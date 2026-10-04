import { and, eq, inArray, or, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import {
  bookings,
  customerActivities,
  customers,
  eventNotifySignups,
  events,
  sundayTableSignups,
  waitlistSignups,
} from "@/db/schema";
import { reservationCode } from "@/lib/booking-display";
import { normalizeEmail } from "@/lib/customers/normalize";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { CAMPAIGN_UNSUBSCRIBED_TAG } from "@/lib/email/campaign-mail";
import { canMemberCancelSeat } from "@/lib/membership/logic";
import { loadRescheduleCandidates, rescheduleOption, type RescheduleOption } from "@/lib/jouw-tafel/reschedule-server";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";

// Server side of the "Jouw tafel" settings page: reservations, the mail
// switch and deleting an account. Only ever for the signed-in person's own
// email.

export type MemberBooking = {
  id: string;
  eventId: string;
  code: string;
  city: string;
  startsAt: string;
  seats: number;
  /** Null for a Sunday Table, else the experience's name (NL, EN). */
  name: { nl: string; en: string } | null;
  /** A member's booking (own seat included). */
  isMemberSeat: boolean;
  /** A paid guest seat comes with it (not refunded when cancelled). */
  withPaidGuest: boolean;
  /** The member can still cancel it (until 48 hours before). */
  cancellable: boolean;
  /** "Verzetten naar de volgende zondag" for an upcoming Sunday Table seat;
   * null when it does not apply. */
  reschedule: RescheduleOption | null;
};

/**
 * Paid, still active bookings for this person (by customer or email),
 * soonest first. A booking that was moved to another date shows up as its
 * new booking (the old one is "transferred").
 */
export async function getMemberBookings(email: string): Promise<{ upcoming: MemberBooking[]; past: MemberBooking[] }> {
  if (!isDbConfigured()) return { upcoming: [], past: [] };
  const normalized = normalizeEmail(email);
  const db = getDb();
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.emailNormalized, normalized))
    .limit(1);
  const rows = await db
    .select({
      id: bookings.id,
      seats: bookings.seats,
      city: events.city,
      startsAt: events.startsAt,
      experienceType: events.experienceType,
      nameNl: events.nameNl,
      nameEn: events.nameEn,
      membershipId: bookings.membershipId,
      amountCents: bookings.amountCents,
      eventId: events.id,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(
      and(
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
        customer
          ? or(eq(bookings.customerId, customer.id), sql`lower(${bookings.email}) = ${normalized}`)
          : sql`lower(${bookings.email}) = ${normalized}`,
      ),
    )
    .orderBy(events.startsAt);
  const now = Date.now();
  const candidates = rows.some((r) => r.experienceType === JOUW_TAFEL_TYPE && r.startsAt.getTime() >= now)
    ? await loadRescheduleCandidates()
    : [];
  const all = rows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    code: reservationCode(r.id),
    city: r.city,
    startsAt: r.startsAt.toISOString(),
    seats: r.seats,
    name: r.experienceType === JOUW_TAFEL_TYPE ? null : { nl: r.nameNl, en: r.nameEn },
    isMemberSeat: Boolean(r.membershipId),
    withPaidGuest: Boolean(r.membershipId) && r.seats > 1 && r.amountCents > 0,
    cancellable: Boolean(r.membershipId) && canMemberCancelSeat(r.startsAt, now),
    reschedule:
      r.experienceType === JOUW_TAFEL_TYPE && r.startsAt.getTime() >= now && !r.membershipId
        ? rescheduleOption({ id: r.eventId, city: r.city, nameNl: r.nameNl, startsAt: r.startsAt }, r.seats, candidates, now)
        : null,
  }));
  return {
    upcoming: all.filter((b) => new Date(b.startsAt).getTime() >= now),
    past: all.filter((b) => new Date(b.startsAt).getTime() < now).reverse(),
  };
}

// ---------------------------------------------------------------- mail switch

/**
 * "Mail me over nieuwe tafels in mijn steden". Off is the same "afgemeld"
 * tag on the customer that the admin campaign mails already skip; the
 * Sunday Table waitlist invites skip it too (getWaitlistInviteCandidates).
 * On by default.
 */
/** The upcoming tables this person has a seat at: event id to seats. */
export async function getBookedSeats(email: string): Promise<Record<string, number>> {
  const { upcoming } = await getMemberBookings(email);
  const out: Record<string, number> = {};
  for (const b of upcoming) out[b.eventId] = (out[b.eventId] ?? 0) + b.seats;
  return out;
}

export async function getTableMailsOn(email: string): Promise<boolean> {
  if (!isDbConfigured()) return true;
  const [customer] = await getDb()
    .select({ tags: customers.tags })
    .from(customers)
    .where(eq(customers.emailNormalized, normalizeEmail(email)))
    .limit(1);
  return !hasUnsubscribedTag(customer?.tags);
}

export async function setTableMailsOn(input: {
  email: string;
  on: boolean;
  locale: "nl" | "en";
  name?: string;
}): Promise<void> {
  const db = getDb();
  const { id } = await upsertCustomerFromEmail({
    email: input.email,
    language: input.locale,
    customerName: input.name,
  });
  const [row] = await db.select({ tags: customers.tags }).from(customers).where(eq(customers.id, id)).limit(1);
  const others = (row?.tags ?? []).filter((t) => !isUnsubscribedTag(t));
  const tags = input.on ? others : [...others, CAMPAIGN_UNSUBSCRIBED_TAG];
  await db.update(customers).set({ tags, updatedAt: new Date() }).where(eq(customers.id, id));
}

function isUnsubscribedTag(tag: unknown): boolean {
  return typeof tag === "string" && tag.trim().toLowerCase() === CAMPAIGN_UNSUBSCRIBED_TAG;
}

function hasUnsubscribedTag(tags: unknown): boolean {
  return Array.isArray(tags) && tags.some(isUnsubscribedTag);
}

/** Emails (lowercased) that switched table mails off. */
export async function unsubscribedEmails(): Promise<Set<string>> {
  if (!isDbConfigured()) return new Set();
  const rows = await getDb()
    .select({ email: customers.emailNormalized })
    .from(customers)
    .where(sql`${customers.tags} @> ${JSON.stringify([CAMPAIGN_UNSUBSCRIBED_TAG])}::jsonb`);
  return new Set(rows.map((r) => r.email));
}

// ---------------------------------------------------------------- delete

/**
 * Deletes this person's account data, as the privacy policy says ("Laat je
 * je account verwijderen, dan verwijderen wij die gegevens ... behalve wat
 * wij wettelijk moeten bewaren"):
 * - waitlist rows (their invites go with them) and "houd me op de hoogte"
 *   rows: deleted;
 * - the customer profile (CRM: name, tags, notes, stats) and its activity
 *   log: deleted;
 * - bookings (order and invoice data, kept for the fiscal retention period)
 *   and Sunday Table attendance rows: kept, but unlinked from the deleted
 *   customer.
 * The auth user and its quiz answers are deleted by the caller.
 */
export async function deleteMemberData(email: string): Promise<void> {
  if (!isDbConfigured()) return;
  const normalized = normalizeEmail(email);
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(waitlistSignups).where(sql`lower(${waitlistSignups.email}) = ${normalized}`);
    await tx.delete(eventNotifySignups).where(sql`lower(${eventNotifySignups.email}) = ${normalized}`);
    const found = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.emailNormalized, normalized));
    const ids = found.map((c) => c.id);
    if (ids.length === 0) return;
    await tx.update(bookings).set({ customerId: null }).where(inArray(bookings.customerId, ids));
    await tx
      .update(sundayTableSignups)
      .set({ customerId: null, userId: null })
      .where(inArray(sundayTableSignups.customerId, ids));
    await tx.update(waitlistSignups).set({ customerId: null }).where(inArray(waitlistSignups.customerId, ids));
    await tx.delete(customerActivities).where(inArray(customerActivities.customerId, ids));
    await tx.delete(customers).where(inArray(customers.id, ids));
  });
}
