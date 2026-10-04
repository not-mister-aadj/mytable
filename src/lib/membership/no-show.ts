import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, events, memberships } from "@/db/schema";
import { logCustomerActivity } from "@/lib/customers/activities";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { noShowOutcome, type NoShowOutcome } from "@/lib/membership/logic";
import { sendNoShowBlockedEmail, sendNoShowWarningEmail } from "@/lib/membership/mails";

export type NoShowResult =
  | { ok: true; outcome: NoShowOutcome | null; mailed: boolean }
  | { ok: false; error: string };

/**
 * Admin "Niet gekomen" on a booking. Records the no-show on the booking;
 * for a member's booking also: the first time a friendly warning mail, any
 * later time no booking for a month (the membership and its payments
 * continue) and a mail with the date booking opens again. Marking the same
 * booking twice does nothing the second time.
 */
export async function markNoShow(input: { bookingId: string; by: string; now?: Date }): Promise<NoShowResult> {
  const now = input.now ?? new Date();
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  if (!row) return { ok: false, error: "Boeking niet gevonden" };
  if (row.booking.paymentStatus !== "paid" || row.booking.lifecycleStatus !== "active") {
    return { ok: false, error: "Alleen actieve, bevestigde boekingen" };
  }
  if (row.event.startsAt.getTime() > now.getTime()) {
    return { ok: false, error: "De tafel is nog niet begonnen" };
  }

  const result = await db.transaction(async (tx) => {
    const [marked] = await tx
      .update(bookings)
      .set({ noShowAt: now })
      .where(and(eq(bookings.id, row.booking.id), isNull(bookings.noShowAt)))
      .returning();
    if (!marked) return { alreadyMarked: true as const };
    await tx.insert(bookingEvents).values({ bookingId: marked.id, type: "no_show_marked", payload: { by: input.by } });
    if (!marked.membershipId) return { alreadyMarked: false as const, outcome: null, membershipId: null };

    // Lock the membership row so two no-shows marked at once count right.
    const [m] = await tx
      .select()
      .from(memberships)
      .where(eq(memberships.id, marked.membershipId))
      .for("update")
      .limit(1);
    if (!m) return { alreadyMarked: false as const, outcome: null, membershipId: null };
    const outcome = noShowOutcome(m.noShowCount, now);
    await tx
      .update(memberships)
      .set({
        noShowCount: outcome.noShowCount,
        ...(outcome.kind === "warning" ? { noShowWarnedAt: now } : {}),
        ...(outcome.kind === "block"
          ? {
              bookingBlockedUntil: sql`GREATEST(coalesce(${memberships.bookingBlockedUntil}, ${outcome.blockedUntil.toISOString()}::timestamptz), ${outcome.blockedUntil.toISOString()}::timestamptz)`,
            }
          : {}),
        updatedAt: now,
      })
      .where(eq(memberships.id, m.id));
    return { alreadyMarked: false as const, outcome, membershipId: m.id };
  });

  if (result.alreadyMarked) return { ok: true, outcome: null, mailed: false };
  if (!result.outcome || !result.membershipId) return { ok: true, outcome: null, mailed: false };

  const [membership] = await db.select().from(memberships).where(eq(memberships.id, result.membershipId)).limit(1);
  if (!membership) return { ok: true, outcome: result.outcome, mailed: false };
  const mailed =
    result.outcome.kind === "warning"
      ? await sendNoShowWarningEmail(membership, row.event.startsAt).catch(() => false)
      : await sendNoShowBlockedEmail(membership, row.event.startsAt, membership.bookingBlockedUntil ?? result.outcome.blockedUntil).catch(
          () => false,
        );
  await db.insert(bookingEvents).values({
    bookingId: row.booking.id,
    type: mailed ? "no_show_email_sent" : "no_show_email_failed",
    payload: { kind: result.outcome.kind },
  });
  if (membership.customerId) {
    await logCustomerActivity({
      customerId: membership.customerId,
      type: CustomerActivityTypes.noteAdded,
      title: result.outcome.kind === "warning" ? "Niet gekomen (waarschuwing)" : "Niet gekomen (maand niet boeken)",
      description: row.event.city,
      metadata: { bookingId: row.booking.id, membershipId: membership.id, noShowCount: result.outcome.noShowCount },
    }).catch(() => undefined);
  }
  return { ok: true, outcome: result.outcome, mailed };
}

/**
 * Undo a "Niet gekomen" marked by mistake: clears it on the booking and,
 * for a member, takes it off the count (and lifts a month's pause that it
 * caused). Mails already sent are not taken back.
 */
export async function undoNoShow(input: { bookingId: string; by: string }): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [cleared] = await tx
      .update(bookings)
      .set({ noShowAt: null })
      .where(and(eq(bookings.id, input.bookingId), isNotNull(bookings.noShowAt)))
      .returning();
    if (!cleared) return { ok: true };
    await tx.insert(bookingEvents).values({ bookingId: cleared.id, type: "no_show_undone", payload: { by: input.by } });
    if (cleared.membershipId) {
      const [m] = await tx
        .select()
        .from(memberships)
        .where(eq(memberships.id, cleared.membershipId))
        .for("update")
        .limit(1);
      if (m) {
        const count = Math.max(0, m.noShowCount - 1);
        await tx
          .update(memberships)
          .set({
            noShowCount: count,
            ...(count < 2 ? { bookingBlockedUntil: null } : {}),
            ...(count === 0 ? { noShowWarnedAt: null } : {}),
            updatedAt: new Date(),
          })
          .where(eq(memberships.id, m.id));
      }
    }
    return { ok: true };
  });
}
