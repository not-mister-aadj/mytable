import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, eventGroups, events } from "@/db/schema";
import { dropPlannedMailsFor, sendSundayMail, shortDate } from "@/lib/admin/sunday-mails";
import { getEmailReplyTo } from "@/lib/email/resend";
import { releaseLine, releaseSeat, sendDueSeatOffers } from "@/lib/seat-offer";
import { forgiveSickCancel, recordMissedSunday } from "@/lib/missed-sundays/server";
import { CANCEL_REASON_NL, type CancelReason } from "@/lib/cancel-reasons";

export type LateCancelResult = { ok: true } | { ok: false; error: "not_found" | "started" };

/**
 * "Kun je toch niet?" on the table page, until the Sunday starts: the guest
 * gives up a fixed seat and tells us what happened (a member just cancels).
 * No refund (terms, art. 6) and the seat stays taken; the guest leaves their
 * group's list and gets no more Sunday mails. Not a no-show. They pick what
 * happened; ill the first time in 3 months is let go (no miss, no mail).
 */
export async function cancelLate(bookingId: string, now = new Date(), reason?: string, kind?: CancelReason): Promise<LateCancelResult> {
  const note = reason?.trim().slice(0, 1000) || null;
  const why = kind && kind !== "other" ? CANCEL_REASON_NL[kind] : note;
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.paymentStatus, "paid"), eq(bookings.lifecycleStatus, "active")))
    .limit(1);
  if (!row) return { ok: false, error: "not_found" };
  if (row.booking.cancelledLateAt) return { ok: true };
  if (row.event.startsAt.getTime() <= now.getTime()) return { ok: false, error: "started" };

  const [marked] = await db
    .update(bookings)
    .set({ cancelledLateAt: now })
    .where(and(eq(bookings.id, bookingId), isNull(bookings.cancelledLateAt)))
    .returning({ id: bookings.id });
  if (!marked) return { ok: true };
  const left = await dropPlannedMailsFor(row.event.id, bookingId).catch(() => ["saturday", "morning", "feedback"]);
  await db.insert(bookingEvents).values({ bookingId, type: "cancelled_late", payload: { plannedMailsLeft: left, ...(why ? { reason: why } : {}), ...(kind ? { reasonKind: kind } : {}) } });
  // The seat goes to the Sunday's waitlist, to who fits the group (seat-offer.ts).
  let seatLine: string | null = null;
  try {
    const release = await releaseSeat({ bookingId, eventId: row.event.id, groupId: row.booking.groupId, startsAt: row.event.startsAt, now });
    const offered = release.offerAt && release.offerAt.getTime() <= now.getTime() ? (await sendDueSeatOffers(now)).find((r) => r.releaseId === release.id) : undefined;
    seatLine = releaseLine(release, offered);
  } catch (error) {
    console.error("[late-cancel] offering the seat failed:", error);
  }
  // Ill, and not in the 3 months before: let go. Otherwise a seat given up after moving closed is a missed Sunday.
  const forgiven = kind === "sick" ? await forgiveSickCancel(bookingId, now).catch(() => false) : false;
  if (!forgiven) await recordMissedSunday({ bookingId, kind: "late", now }).catch((e) => console.error("[late-cancel] missed sunday failed", e));
  // We hear about it at once: the groups may need another look.
  const told = kind === "sick" ? `${why} (${forgiven ? "vergeven, eerste keer in 3 maanden" : "vaker in 3 maanden, telt mee"})` : why;
  await notifyOwnerOfCancel({ booking: row.booking, event: row.event, plannedMailsLeft: left, seatLine, now, reason: told }).catch((error) =>
    console.error("[late-cancel] telling the owner failed:", error),
  );
  return { ok: true };
}

/** A short mail to our own inbox for every cancellation on the table page. */
async function notifyOwnerOfCancel(input: {
  booking: typeof bookings.$inferSelect;
  event: typeof events.$inferSelect;
  plannedMailsLeft: string[];
  seatLine: string | null;
  now: Date;
  reason: string | null;
}): Promise<void> {
  const { booking, event, now } = input;
  const db = getDb();
  const [group] = booking.groupId
    ? await db.select({ number: eventGroups.number }).from(eventGroups).where(eq(eventGroups.id, booking.groupId)).limit(1)
    : [];
  // Who still comes: per group, and for the whole Sunday.
  const counts = (await db.execute(sql`
    select g.number, coalesce(sum(b.seats), 0)::int as seats
    from bookings b left join event_groups g on g.id = b.group_id
    where b.event_id = ${event.id} and b.payment_status = 'paid' and b.lifecycle_status = 'active'
      and b.cancelled_late_at is null and b.no_show_at is null
    group by g.number order by g.number nulls last`)) as unknown as Array<{ number: number | null; seats: number }>;
  const total = counts.reduce((n, c) => n + c.seats, 0);
  const own = group ? (counts.find((c) => c.number === group.number)?.seats ?? 0) : null;
  const name = booking.customerName?.trim() || booking.email;
  const date = shortDate(event.startsAt, "nl");
  const hours = Math.max(0, Math.round((event.startsAt.getTime() - now.getTime()) / 3_600_000));
  const when = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(now);
  const text = [
    `${name} heeft zich afgemeld voor ${event.city}, ${date}.`,
    "",
    ...(input.reason ? [`Wat er is: ${input.reason}`, ""] : []),
    `Afgemeld: ${when}, ${hours} uur voor de start`,
    `Plekken: ${booking.seats}`,
    ...(group ? [`Groep ${group.number}: nog ${own}`] : []),
    `Komen nog: ${total}${counts.length > 1 ? ` (${counts.map((c) => `${c.number === null ? "zonder groep" : `groep ${c.number}`}: ${c.seats}`).join(", ")})` : ""}`,
    ...(input.seatLine ? [input.seatLine] : []),
    ...(input.plannedMailsLeft.length ? [`Mail niet teruggehaald: ${input.plannedMailsLeft.join(", ")}`] : []),
  ].join("\n");
  await sendSundayMail(getEmailReplyTo(), {
    subject: `[afmelding] ${name} · ${event.city} ${date}${group ? ` · groep ${group.number} nog ${own}` : ""}`,
    text,
  });
}

/** Our own note on a cancellation (admin). */
export async function saveCancelNote(bookingId: string, note: string): Promise<void> {
  await getDb()
    .update(bookings)
    .set({ cancelNote: note.trim().slice(0, 2000) || null })
    .where(eq(bookings.id, bookingId));
}
