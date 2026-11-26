import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, events } from "@/db/schema";
import { ensureAuthUserForEmail } from "@/lib/auth/ensure-auth-user-for-email";
import { tableLanguage } from "@/lib/jouw-tafel/groups-logic";
import { canReschedule } from "@/lib/jouw-tafel/reschedule-logic";
import { handOverSeat } from "@/lib/seat-handover";
import { getTokenSecrets } from "@/lib/sunday-table-intro";

/**
 * "Geef mijn plek door" as a link: the guest shares it (WhatsApp, copy), and
 * whoever opens it first and confirms takes the seat over. The seat stays
 * the guest's until then. One open link per booking: sharing again gives the
 * same link; "Link intrekken" or the seat being taken closes it. Kept as
 * booking_events (handover_link / handover_link_revoked / handover_link_used),
 * no table of its own. Only for a fixed seat (less than 7 days before), not
 * a member's, until the afternoon starts.
 */

const PURPOSE = "seat-handover-link";
const SITE = "https://www.mytable.club";
const LINK_TYPES = ["handover_link", "handover_link_revoked", "handover_link_used"] as const;

type Booking = typeof bookings.$inferSelect;
type Event = typeof events.$inferSelect;

/** Can this seat be handed over by link at `now`? */
export function canShareSeat(booking: Booking, event: Event, now: number): boolean {
  return (
    booking.paymentStatus === "paid" &&
    booking.lifecycleStatus === "active" &&
    !booking.cancelledLateAt &&
    !booking.noShowAt &&
    !booking.membershipId &&
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
