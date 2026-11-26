import { and, eq, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { bookingEvents, bookings, events, makerCommissions, makerReferrals, makers, membershipPayments } from "@/db/schema";
import { normalizeEmail } from "@/lib/customers/normalize";
import { MAKER_COMMISSION_CENTS, commissionSeats, referralCounts, sanitizeMakerCode } from "@/lib/makers/shared";

/** Booking event on a booking whose second seat was free through a maker's link. */
export const MAKER_FREE_SEAT_EVENT = "maker_free_seat";

export type ApprovedMaker = { id: string; name: string; email: string; code: string };

export async function getApprovedMaker(rawCode: string | null | undefined): Promise<ApprovedMaker | null> {
  const code = sanitizeMakerCode(rawCode);
  if (!code || !isDbConfigured()) return null;
  const [row] = await getDb()
    .select({ id: makers.id, name: makers.name, email: makers.email, code: makers.code, status: makers.status })
    .from(makers)
    .where(eq(makers.code, code))
    .limit(1);
  if (!row || row.status !== "approved" || !row.code) return null;
  return { id: row.id, name: row.name, email: row.email, code: row.code };
}

/** Has this address ever paid for anything: a seat or a membership month. */
async function hasPaidBefore(email: string): Promise<boolean> {
  const db = getDb();
  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(sql`lower(${bookings.email}) = ${email}`, eq(bookings.paymentStatus, "paid")))
    .limit(1);
  if (booking) return true;
  const [payment] = await db
    .select({ id: membershipPayments.stripeInvoiceId })
    .from(membershipPayments)
    .where(sql`lower(${membershipPayments.email}) = ${email}`)
    .limit(1);
  return Boolean(payment);
}

/**
 * At checkout, with a maker's code in the cookie: ties a new customer to
 * that maker (the first link wins) and says whether the second seat is free.
 * Someone who paid before, or the maker themself, gets nothing.
 */
export async function referralAtCheckout(input: {
  email: string;
  code: string | null | undefined;
  now?: Date;
}): Promise<{ makerId: string; freeSeat: boolean } | null> {
  const maker = await getApprovedMaker(input.code);
  if (!maker) return null;
  const email = normalizeEmail(input.email);
  if (!email || email === normalizeEmail(maker.email)) return null;
  const now = input.now ?? new Date();
  const db = getDb();

  const [existing] = await db.select().from(makerReferrals).where(eq(makerReferrals.emailNormalized, email)).limit(1);
  if (existing && referralCounts(existing, now)) {
    // Theirs already: the free seat only while nothing was paid yet.
    if (existing.makerId !== maker.id || existing.firstPaidAt) return null;
    return (await hasPaidBefore(email)) ? null : { makerId: maker.id, freeSeat: true };
  }
  if (await hasPaidBefore(email)) return null;

  if (existing) {
    await db.update(makerReferrals).set({ makerId: maker.id, createdAt: now, firstPaidAt: null }).where(eq(makerReferrals.emailNormalized, email));
  } else {
    await db.insert(makerReferrals).values({ emailNormalized: email, makerId: maker.id, createdAt: now }).onConflictDoNothing();
  }
  return { makerId: maker.id, freeSeat: true };
}

/** The referral that still counts for this address, if any. */
async function countingReferral(email: string, now: Date) {
  const [referral] = await getDb().select().from(makerReferrals).where(eq(makerReferrals.emailNormalized, email)).limit(1);
  return referral && referralCounts(referral, now) ? referral : null;
}

async function markFirstPaid(email: string, at: Date): Promise<void> {
  await getDb()
    .update(makerReferrals)
    .set({ firstPaidAt: at })
    .where(and(eq(makerReferrals.emailNormalized, email), sql`${makerReferrals.firstPaidAt} is null`));
}

/** After a seat is paid: €7 per paid seat for the maker who brought them. Idempotent. */
export async function recordMakerCommissionForBooking(bookingId: string, now = new Date()): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, startsAt: events.startsAt })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row || row.booking.paymentStatus !== "paid") return false;
  const email = normalizeEmail(row.booking.email);
  const referral = await countingReferral(email, now);
  if (!referral) return false;

  const [free] = await db
    .select({ id: bookingEvents.id })
    .from(bookingEvents)
    .where(and(eq(bookingEvents.bookingId, bookingId), eq(bookingEvents.type, MAKER_FREE_SEAT_EVENT)))
    .limit(1);
  const seats = commissionSeats(row.booking.seats, Boolean(free), row.booking.amountCents);
  if (seats <= 0) return false;

  await db
    .insert(makerCommissions)
    .values({
      makerId: referral.makerId,
      emailNormalized: email,
      bookingId,
      seats,
      amountCents: seats * MAKER_COMMISSION_CENTS,
      eventStartsAt: row.startsAt,
    })
    .onConflictDoNothing();
  await markFirstPaid(email, now);
  return true;
}

/** After a club membership month is paid: €7 for the maker who brought them. Idempotent. */
export async function recordMakerCommissionForInvoice(input: {
  invoiceId: string;
  email: string | null | undefined;
  amountPaid: number;
  paidAt?: Date;
}): Promise<boolean> {
  if (!isDbConfigured() || !input.email || input.amountPaid <= 0) return false;
  const email = normalizeEmail(input.email);
  const now = input.paidAt ?? new Date();
  const referral = await countingReferral(email, now);
  if (!referral) return false;
  await getDb()
    .insert(makerCommissions)
    .values({
      makerId: referral.makerId,
      emailNormalized: email,
      stripeInvoiceId: input.invoiceId,
      seats: 1,
      amountCents: MAKER_COMMISSION_CENTS,
    })
    .onConflictDoNothing();
  await markFirstPaid(email, now);
  return true;
}
