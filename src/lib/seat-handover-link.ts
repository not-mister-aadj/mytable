import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, events } from "@/db/schema";
import { ensureAuthUserForEmail } from "@/lib/auth/ensure-auth-user-for-email";
import { tableLanguage } from "@/lib/jouw-tafel/groups-logic";
import { canReschedule } from "@/lib/jouw-tafel/reschedule-logic";
import { handOverSeat } from "@/lib/seat-handover";
import { getTokenSecrets } from "@/lib/sunday-table-intro";
import { buttonMail, longDate, sendSundayMail } from "@/lib/admin/sunday-mails";
import { tablePageUrl } from "@/lib/table-page";
import { amsterdamDateIso, amsterdamDateTime } from "@/lib/sunday-wine-table";

/**
 * "Geef mijn plek door" as a link: the guest shares it (WhatsApp, copy), and
 * whoever opens it first and confirms takes the seat over. The seat stays
 * the guest's until then. One open link per booking: sharing again gives the
 * same link; "Link intrekken" or the seat being taken closes it. Kept as
 * booking_events (handover_link / handover_link_revoked / handover_link_used),
 * no table of its own. Only for a fixed seat (less than 7 days before; a
 * member's too), until the afternoon starts.
 */

const PURPOSE = "seat-handover-link";
const SITE = "https://www.mytable.club";
const LINK_TYPES = ["handover_link", "handover_link_revoked", "handover_link_used"] as const;
const FROM = "MyTable <hallo@tafels.mytable.club>";

type Booking = typeof bookings.$inferSelect;
type Event = typeof events.$inferSelect;

/** Can this seat be handed over by link at `now`? */
export function canShareSeat(booking: Booking, event: Event, now: number): boolean {
  return (
    booking.paymentStatus === "paid" &&
    booking.lifecycleStatus === "active" &&
    !booking.cancelledLateAt &&
    !booking.noShowAt &&
    !canReschedule(event.startsAt, now) &&
    event.startsAt.getTime() > now
  );
}

async function load(bookingId: string): Promise<{ booking: Booking; event: Event } | null> {
  const [row] = await getDb()
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  return row ?? null;
}

/** The id of the booking's open link, or null. */
export async function openLinkId(bookingId: string): Promise<string | null> {
  const [last] = await getDb()
    .select({ type: bookingEvents.type, payload: bookingEvents.payload })
    .from(bookingEvents)
    .where(and(eq(bookingEvents.bookingId, bookingId), inArray(bookingEvents.type, [...LINK_TYPES])))
    .orderBy(desc(bookingEvents.createdAt))
    .limit(1);
  if (last?.type !== "handover_link") return null;
  const id = (last.payload as { linkId?: unknown } | null)?.linkId;
  return typeof id === "string" ? id : null;
}

/** The link to share: the open one again (so a link already sent keeps working), else a new one. */
export async function createHandOverLink(bookingId: string, now = Date.now()): Promise<string | null> {
  const row = await load(bookingId);
  if (!row || !canShareSeat(row.booking, row.event, now)) return null;
  let linkId = await openLinkId(bookingId);
  if (!linkId) {
    linkId = randomBytes(9).toString("base64url");
    await getDb().insert(bookingEvents).values({ bookingId, type: "handover_link", payload: { linkId } });
  }
  const token = await new SignJWT({ bookingId, linkId, purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(row.event.startsAt.getTime() / 1000))
    .sign(getTokenSecrets()[0]!);
  const locale = row.booking.locale === "en" ? "en" : "nl";
  return `${SITE}${locale === "en" ? "/en" : ""}/plek-overnemen/${token}`;
}

export async function revokeHandOverLink(bookingId: string): Promise<void> {
  if (!(await openLinkId(bookingId))) return;
  await getDb().insert(bookingEvents).values({ bookingId, type: "handover_link_revoked", payload: {} });
}

async function verify(token: string): Promise<{ bookingId: string; linkId: string } | null> {
  for (const secret of getTokenSecrets()) {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.purpose !== PURPOSE) return null;
      if (typeof payload.bookingId !== "string" || typeof payload.linkId !== "string") return null;
      return { bookingId: payload.bookingId, linkId: payload.linkId };
    } catch {
      // Not this key (or expired): try the next one.
    }
  }
  return null;
}

export type HandOverOffer =
  | { state: "open"; bookingId: string; giver: string; city: string; startsAt: Date; seats: number; language: "nl" | "en"; locale: "nl" | "en" }
  /** Taken over: who has it now, so the one who took it sees that it is theirs. */
  | { state: "taken"; takerEmail: string | null; takenBookingId: string | null }
  | { state: "closed" };

/** What the link shows: the seat to take, or why it can't be taken any more. */
export async function readHandOverLink(token: string, now = Date.now()): Promise<HandOverOffer> {
  const ref = await verify(token);
  if (!ref) return { state: "closed" };
  const row = await load(ref.bookingId);
  if (!row) return { state: "closed" };
  if (row.booking.lifecycleStatus === "transferred" && row.booking.transferredBy === "doorgegeven") {
    const takenId = row.booking.transferredToBookingId;
    const [taken] = takenId ? await getDb().select({ email: bookings.email }).from(bookings).where(eq(bookings.id, takenId)).limit(1) : [];
    return { state: "taken", takerEmail: taken?.email.trim().toLowerCase() ?? null, takenBookingId: takenId ?? null };
  }
  if ((await openLinkId(ref.bookingId)) !== ref.linkId || !canShareSeat(row.booking, row.event, now)) return { state: "closed" };
  const table = await getDb()
    .select({ pref: bookings.tableLanguagePreference })
    .from(bookings)
    .where(and(eq(bookings.eventId, row.event.id), eq(bookings.paymentStatus, "paid"), eq(bookings.lifecycleStatus, "active")));
  return {
    state: "open",
    bookingId: ref.bookingId,
    giver: row.booking.customerName?.trim().split(/\s+/)[0] ?? "",
    city: row.event.city,
    startsAt: row.event.startsAt,
    seats: row.booking.seats,
    language: tableLanguage(table.map((t) => t.pref)).language,
    locale: row.booking.locale === "en" ? "en" : "nl",
  };
}

/** 18 or older on the day of the Sunday. */
export function adultOn(birthDate: string, day: Date): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return false;
  const born = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(born.getTime()) || born.getTime() > day.getTime()) return false;
  const eighteen = new Date(Date.UTC(born.getUTCFullYear() + 18, born.getUTCMonth(), born.getUTCDate()));
  return eighteen.getTime() <= day.getTime();
}

export type ClaimResult =
  | { ok: true; email: string; newAccount: boolean; bookingId: string }
  | { ok: false; error: "closed" | "taken" | "invalid" | "young" | "same" | "already" | "failed" };

/**
 * Takes the seat over: the hand-over as from the table page (same group,
 * mail to them, mail to the giver, a note to us), with their birth date, and
 * a silent account when they have none yet.
 */
export async function claimHandOverLink(token: string, input: { name: string; email: string; birthDate: string }): Promise<ClaimResult> {
  const offer = await readHandOverLink(token);
  if (offer.state !== "open") return { ok: false, error: offer.state };
  if (!adultOn(input.birthDate, offer.startsAt)) return { ok: false, error: /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) ? "young" : "invalid" };
  const result = await handOverSeat(offer.bookingId, { name: input.name, email: input.email, birthDate: input.birthDate });
  if (!result.ok) return { ok: false, error: result.error === "closed" ? "closed" : result.error };
  await getDb().insert(bookingEvents).values({ bookingId: offer.bookingId, type: "handover_link_used", payload: { toBookingId: result.bookingId } });
  const email = input.email.trim().toLowerCase();
  const account = await ensureAuthUserForEmail({ email, name: input.name, source: "handover", city: offer.city, locale: offer.locale }).catch(() => ({ created: false }));
  return { ok: true, email, newAccount: account.created, bookingId: result.bookingId };
}

const REMIND_AFTER_MS = 2 * 86_400_000;

function amsterdamHour(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", hourCycle: "h23" }).format(d));
}

/**
 * When the giver of a link nobody took hears it: two days after sharing it,
 * at the latest Friday 10:00 before the Sunday (Amsterdam), never at night
 * (21:00 to 08:00 waits for 08:00). A link shared from Friday 10:00 on gets
 * no reminder: null.
 */
export function reminderAt(startsAt: Date, sharedAt: Date): Date | null {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  const friday = amsterdamDateTime(y, m, d - 2, 10, 0);
  if (sharedAt.getTime() >= friday.getTime()) return null;
  let due = new Date(Math.min(sharedAt.getTime() + REMIND_AFTER_MS, friday.getTime()));
  const hour = amsterdamHour(due);
  if (hour < 8 || hour >= 21) {
    const [dy, dm, dd] = amsterdamDateIso(due).split("-").map(Number) as [number, number, number];
    due = amsterdamDateTime(dy, dm, hour < 8 ? dd : dd + 1, 8, 0);
  }
  return new Date(Math.min(due.getTime(), friday.getTime()));
}

/** "Nog niemand heeft je plek overgenomen": come anyway (nothing to do), or cancel so the waitlist gets the seat. */
export function handOverReminderMail(p: { locale: "nl" | "en"; firstName: string; startsAt: Date; tableUrl: string }): { subject: string; text: string; html: string } {
  const nl = p.locale === "nl";
  const day = longDate(p.startsAt, p.locale);
  const text = (
    nl
      ? [
          `Hoi${p.firstName ? ` ${p.firstName}` : ""},`,
          "",
          `Je link voor ${day} staat nog open, maar nog niemand heeft je plek overgenomen.`,
          "",
          "Kom je toch? Dan hoef je niets te doen. Kun je echt niet? Meld je dan af op je tafelpagina. Dan bieden we je plek aan iemand van de wachtlijst aan en blijft je tafel compleet. Je link opnieuw delen kan daar ook.",
          "",
          p.tableUrl,
          "",
          "Groetjes,",
          "MyTable",
        ]
      : [
          `Hi${p.firstName ? ` ${p.firstName}` : ""},`,
          "",
          `Your link for ${day} is still open, but nobody has taken your seat yet.`,
          "",
          "Coming after all? Then there's nothing to do. Really can't make it? Cancel on your table page. We'll then offer your seat to someone on the waitlist and your table stays complete. You can share your link again there too.",
          "",
          p.tableUrl,
          "",
          "Best,",
          "MyTable",
        ]
  ).join("\n");
  return {
    subject: nl ? "Nog niemand heeft je plek overgenomen" : "Nobody has taken your seat yet",
    ...buttonMail(text, p.tableUrl, nl ? "Naar je tafelpagina" : "To your table page"),
  };
}

/**
 * Hourly (feedback-mails cron): the giver of a link that is still open hears
 * that nobody took it, at reminderAt. Once per link (a reminded link stays
 * reminded), never after the start.
 */
export async function sendHandOverReminders(now: Date = new Date()): Promise<{ sent: number }> {
  const db = getDb();
  const rows = (await db.execute(sql`
    select distinct on (be.booking_id) be.booking_id, be.payload->>'linkId' as link_id
    from booking_events be
    join bookings b on b.id = be.booking_id
    join events e on e.id = b.event_id
    where be.type in ('handover_link', 'handover_link_revoked', 'handover_link_used', 'handover_link_reminded')
      and e.starts_at > ${now.toISOString()}::timestamptz
      and e.starts_at < ${new Date(now.getTime() + 8 * 86_400_000).toISOString()}::timestamptz
    order by be.booking_id, be.created_at desc`)) as unknown as Array<{ booking_id: string; link_id: string | null }>;
  let sent = 0;
  for (const r of rows) {
    // Only a link whose last event is the link itself: not revoked, used, or reminded.
    const [last] = await db
      .select({ type: bookingEvents.type, at: bookingEvents.createdAt })
      .from(bookingEvents)
      .where(and(eq(bookingEvents.bookingId, r.booking_id), inArray(bookingEvents.type, [...LINK_TYPES, "handover_link_reminded"])))
      .orderBy(desc(bookingEvents.createdAt))
      .limit(1);
    if (last?.type !== "handover_link") continue;
    const row = await load(r.booking_id);
    if (!row || !canShareSeat(row.booking, row.event, now.getTime())) continue;
    const due = reminderAt(row.event.startsAt, last.at);
    if (!due || now.getTime() < due.getTime()) continue;
    const locale = row.booking.locale === "en" ? "en" : "nl";
    const mail = handOverReminderMail({
      locale,
      firstName: row.booking.customerName?.trim().split(/\s+/)[0] ?? "",
      startsAt: row.event.startsAt,
      tableUrl: await tablePageUrl(row.booking.id, locale),
    });
    const id = await sendSundayMail(row.booking.email, { ...mail, from: FROM }).catch((error) => {
      console.error("[handover reminder] mail failed", error);
      return null;
    });
    if (!id) continue;
    await db.insert(bookingEvents).values({ bookingId: row.booking.id, type: "handover_link_reminded", payload: { linkId: r.link_id } });
    sent += 1;
  }
  return { sent };
}
