import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings, events, inviteSubscribers } from "@/db/schema";
import { buttonMail, longDate, sendSundayMail } from "@/lib/admin/sunday-mails";
import { transferBooking } from "@/lib/booking-transfer";
import { normalizeEmail } from "@/lib/customers/normalize";
import { canReschedule, moveTargets } from "@/lib/jouw-tafel/reschedule-logic";
import { loadRescheduleCandidates } from "@/lib/jouw-tafel/reschedule-server";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { announceMovedSeat } from "@/lib/seat-offer";
import { tablePageUrl } from "@/lib/table-page";

/**
 * "Ik wil verzetten", from "Kom je zondag?" and the table page: a guest moves
 * their own seat to any open Sunday in their cities. Free until 7 days
 * before, as often as they like; a seat from a membership follows the
 * membership's own rule. A full Sunday's waitlist hears about the seat.
 */

const FROM = "MyTable <hallo@tafels.mytable.club>";
const WEEK_MS = 7 * 86_400_000;

export type MoveOption = { eventId: string; city: string; startsAt: string };
export type MoveState =
  | { state: "open"; city: string; startsAt: string; options: MoveOption[] }
  | { state: "moved"; city: string; startsAt: string; tableUrl: string }
  | { state: "closed"; reason: "too_late" | "member" | "gone"; city: string; startsAt: string };

type Row = { booking: typeof bookings.$inferSelect; event: typeof events.$inferSelect };

async function load(bookingId: string): Promise<Row | null> {
  const [row] = await getDb()
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  return row ?? null;
}

/** The cities this guest follows: where they booked or signed up, and what they ticked themselves. */
async function citiesOf(email: string): Promise<string[]> {
  const db = getDb();
  const key = normalizeEmail(email);
  const rows = (await db.execute(sql`
    select e.city from bookings b join events e on e.id = b.event_id where lower(trim(b.email)) = ${key} and b.payment_status = 'paid'
    union select e.city from event_notify_signups n join events e on e.id = n.event_id where lower(trim(n.email)) = ${key}
    union select w.city from waitlist_signups w where lower(trim(w.email)) = ${key}`)) as unknown as Array<{ city: string | null }>;
  const [sub] = await db.select({ prefs: inviteSubscribers.cityPrefs }).from(inviteSubscribers).where(eq(inviteSubscribers.emailNormalized, key)).limit(1);
  const prefs = (sub?.prefs ?? {}) as Record<string, string>;
  const off = new Set(Object.entries(prefs).filter(([, pref]) => pref === "none").map(([city]) => city.toLowerCase()));
  const all = [...rows.map((r) => r.city ?? ""), ...Object.keys(prefs)].filter((city) => city && !off.has(city.toLowerCase()));
  return [...new Set(all)];
}

async function options(row: Row, now: number): Promise<MoveOption[]> {
  const found = moveTargets(row.event, await loadRescheduleCandidates(), row.booking.seats, await citiesOf(row.booking.email), now);
  return found.map((e) => ({ eventId: e.id, city: e.city, startsAt: e.startsAt.toISOString() }));
}

/** What the move page shows for this booking. */
export async function loadMovePage(bookingId: string, locale: "nl" | "en", now: number = Date.now()): Promise<MoveState | null> {
  const row = await load(bookingId);
  if (!row || row.booking.paymentStatus !== "paid" || row.event.experienceType !== JOUW_TAFEL_TYPE) return null;
  const { booking, event } = row;
  const base = { city: event.city, startsAt: event.startsAt.toISOString() };
  if (booking.lifecycleStatus === "transferred" && booking.transferredToBookingId) {
    const moved = await load(booking.transferredToBookingId);
    if (!moved) return { state: "closed", reason: "gone", ...base };
    return {
      state: "moved",
      city: moved.event.city,
      startsAt: moved.event.startsAt.toISOString(),
      tableUrl: await tablePageUrl(moved.booking.id, locale, ""),
    };
  }
  if (booking.lifecycleStatus !== "active" || booking.cancelledLateAt || event.startsAt.getTime() <= now) return { state: "closed", reason: "gone", ...base };
  if (booking.membershipId) return { state: "closed", reason: "member", ...base };
  if (!canReschedule(event.startsAt, now)) return { state: "closed", reason: "too_late", ...base };
  return { state: "open", ...base, options: await options(row, now) };
}

export type MoveResult = { ok: true; city: string; startsAt: string; tableUrl: string } | { ok: false; error: "closed" | "taken" | "failed" };

/** Moves the seat to the Sunday the guest picked, and tells them (and, for a full Sunday, its waitlist). */
export async function moveSeat(bookingId: string, targetEventId: string, locale: "nl" | "en", now: Date = new Date()): Promise<MoveResult> {
  const row = await load(bookingId);
  if (!row) return { ok: false, error: "closed" };
  const { booking, event } = row;
  if (
    booking.paymentStatus !== "paid" ||
    booking.lifecycleStatus !== "active" ||
    booking.cancelledLateAt ||
    booking.membershipId ||
    event.experienceType !== JOUW_TAFEL_TYPE ||
    !canReschedule(event.startsAt, now.getTime())
  ) {
    return { ok: false, error: "closed" };
  }
  if (!(await options(row, now.getTime())).some((o) => o.eventId === targetEventId)) return { ok: false, error: "taken" };
  const wasFull = event.spotsSold >= event.capacity;
  let moved: Awaited<ReturnType<typeof transferBooking>>;
  try {
    moved = await transferBooking({ bookingId, targetEventId, by: "klant", selfService: true, quiet: true, confirmed: true });
  } catch (error) {
    console.error("[seat-move] transfer failed", error);
    return { ok: false, error: "failed" };
  }
  const lang = booking.locale === "en" ? "en" : "nl";
  const target = moved.targetEvent;
  const mail = movedMail({
    locale: lang,
    firstName: booking.customerName?.trim().split(/\s+/)[0] ?? "",
    city: target.city,
    startsAt: target.startsAt,
    tableUrl: await tablePageUrl(moved.newBooking.id, lang),
    now,
  });
  await sendSundayMail(booking.email, { ...mail, from: FROM }).catch((error) => console.error("[seat-move] mail failed", error));
  if (wasFull) await announceMovedSeat(event.id, now).catch((error) => console.error("[seat-move] waitlist mail failed", error));
  return { ok: true, city: target.city, startsAt: target.startsAt.toISOString(), tableUrl: await tablePageUrl(moved.newBooking.id, locale, "") };
}

/** "Verzet: je schuift aan op zondag 17 januari in Utrecht". */
export function movedMail(p: { locale: "nl" | "en"; firstName: string; city: string; startsAt: Date; tableUrl: string; now?: Date }): {
  subject: string;
  text: string;
  html: string;
} {
  const nl = p.locale === "nl";
  const day = longDate(p.startsAt, p.locale);
  const at = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" }).format(p.startsAt);
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  // Within a week the location is out already: it is on their table page.
  const soon = p.startsAt.getTime() - (p.now ?? new Date()).getTime() < WEEK_MS;
  const where = soon
    ? nl
      ? "Waar je aan tafel zit, staat op je tafelpagina."
      : "Where you'll be seated is on your table page."
    : nl
      ? "Een week vooraf hoor je waar je aan tafel zit."
      : "A week before, you'll hear where you'll be seated.";
  const text = [
    hi,
    "",
    nl ? `Je plek is verzet. Je schuift nu aan op ${day} om ${at} in ${p.city}.` : `Your seat has been moved. You're now joining on ${day} at ${at} in ${p.city}.`,
    "",
    where,
    "",
    p.tableUrl,
    "",
    nl ? "Tot dan," : "See you then,",
    "MyTable",
  ].join("\n");
  return {
    subject: nl ? `Verzet: je schuift aan op ${day} in ${p.city}` : `Moved: you're joining on ${day} in ${p.city}`,
    ...buttonMail(text, p.tableUrl, nl ? "Naar je tafelpagina" : "To your table page"),
  };
}
