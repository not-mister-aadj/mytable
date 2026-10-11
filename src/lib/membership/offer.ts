import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { bookingEvents, bookings, events, memberships } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import type { MetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { isEmailFrozen } from "@/lib/customers/freeze";
import { isSharedTableType } from "@/lib/event-concepts";
import { createMembershipCheckout, type MembershipCheckoutResult } from "@/lib/membership/checkout";
import {
  MEMBERSHIP_OFFER_CREDIT_CENTS,
  MEMBERSHIP_OFFER_MINUTES,
  MEMBERSHIP_OFFER_OPEN,
  MEMBERSHIP_OFFER_PLAN,
  getMembershipPlan,
} from "@/lib/membership/plans";
import { isStripeConfigured } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// The membership offer between paying for a Sunday Social and its
// confirmation page. One per paid booking: it shows right after paying,
// stays open for MEMBERSHIP_OFFER_MINUTES (a refresh, or coming back from
// Stripe, still works) and is gone for good after "no thanks" or once that
// time is over. The seat just paid for comes off the first month.

const SHOWN = "membership_offer_shown";
const DECLINED = "membership_offer_declined";
const ACCEPTED = "membership_offer_accepted";

/** What the screen shows. Amounts in cents; no personal data. */
export type MembershipOffer = {
  /** What one Sunday costs without a membership. */
  singleSeatCents: number;
  monthlyCents: number;
  creditCents: number;
  firstMonthCents: number;
};

type OfferBooking = { bookingId: string; email: string; seatCents: number };

/** The paid booking behind a Checkout session, when it can get the offer:
 * a Sunday Social, paid for (not a member's included seat), still active. */
async function offerBooking(sessionId: string): Promise<OfferBooking | null> {
  if (!MEMBERSHIP_OFFER_OPEN || !isDbConfigured() || !isStripeConfigured() || !sessionId) return null;
  const [row] = await getDb()
    .select({ booking: bookings, experienceType: events.experienceType })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.stripeCheckoutSessionId, sessionId))
    .limit(1);
  if (!row || !isSharedTableType(row.experienceType)) return null;
  const { booking } = row;
  if (booking.paymentStatus !== "paid" || booking.lifecycleStatus !== "active") return null;
  if (booking.membershipId || booking.amountCents <= 0 || booking.seats < 1) return null;
  return {
    bookingId: booking.id,
    email: booking.email.trim().toLowerCase(),
    seatCents: Math.round(booking.amountCents / booking.seats),
  };
}

/** True when this address has a running membership (they never see it). */
async function isMember(email: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(sql`lower(${memberships.email}) = ${email}`, ne(memberships.status, "canceled")))
    .limit(1);
  return Boolean(row);
}

/** Whether the offer of this booking is still open, and since when it shows. */
async function offerState(bookingId: string, now: number): Promise<{ open: boolean; shownAt: Date | null }> {
  const rows = await getDb()
    .select({ type: bookingEvents.type, createdAt: bookingEvents.createdAt })
    .from(bookingEvents)
    .where(and(eq(bookingEvents.bookingId, bookingId), inArray(bookingEvents.type, [SHOWN, DECLINED])))
    .orderBy(asc(bookingEvents.createdAt));
  if (rows.some((r) => r.type === DECLINED)) return { open: false, shownAt: null };
  const shownAt = rows.find((r) => r.type === SHOWN)?.createdAt ?? null;
  if (!shownAt) return { open: true, shownAt: null };
  return { open: now - shownAt.getTime() < MEMBERSHIP_OFFER_MINUTES * 60 * 1000, shownAt };
}

function amounts(seatCents: number): MembershipOffer {
  const plan = getMembershipPlan(MEMBERSHIP_OFFER_PLAN);
  return {
    singleSeatCents: seatCents,
    monthlyCents: plan.monthlyCents,
    creditCents: MEMBERSHIP_OFFER_CREDIT_CENTS,
    firstMonthCents: Math.max(0, plan.initialCents - MEMBERSHIP_OFFER_CREDIT_CENTS),
  };
}

/**
 * The offer for the confirmation page of this Checkout session, or null
 * when there is none (not a paid Sunday Social, already a member, declined,
 * or its time is over). The first call starts the clock.
 */
export async function getMembershipOffer(sessionId: string, now: number = Date.now()): Promise<MembershipOffer | null> {
  const booking = await offerBooking(sessionId);
  if (!booking || (await isMember(booking.email))) return null;
  const state = await offerState(booking.bookingId, now);
  if (!state.open) return null;
  if (!state.shownAt) {
    await getDb().insert(bookingEvents).values({ bookingId: booking.bookingId, type: SHOWN, payload: {} });
  }
  return amounts(booking.seatCents);
}

/** "No thanks": this booking's offer is gone for good. */
export async function declineMembershipOffer(sessionId: string): Promise<void> {
  const booking = await offerBooking(sessionId);
  if (!booking) return;
  const state = await offerState(booking.bookingId, Date.now());
  // Never shown, or already declined: nothing to close.
  if (!state.shownAt) return;
  await getDb().insert(bookingEvents).values({ bookingId: booking.bookingId, type: DECLINED, payload: {} });
}

/** The account for this address: theirs when they have one, else a new one
 * (no password; they sign in with a code sent to this address). */
async function accountIdForEmail(email: string): Promise<string> {
  const rows = (await getDb().execute(sql`
    select id from auth.users where lower(email) = ${email} order by created_at asc limit 1
  `)) as unknown as Array<{ id: string }>;
  if (rows[0]?.id) return rows[0].id;
  const { data, error } = await createSupabaseAdminClient().auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) throw new Error(`Could not create the account for a new member: ${error?.message ?? "no user"}`);
  return data.user.id;
}

export type OfferCheckoutResult = MembershipCheckoutResult | { ok: false; error: "offer_closed" | "frozen" };

/**
 * "Yes, make me a member": a subscription Checkout for the address of the
 * booking, with the booked seat off the first month. The account is made
 * here, so nothing stands between the button and paying.
 */
export async function startMembershipOfferCheckout(input: {
  sessionId: string;
  locale: Locale;
  meta: MetaTrackingContext;
}): Promise<OfferCheckoutResult> {
  const booking = await offerBooking(input.sessionId);
  if (!booking) return { ok: false, error: "offer_closed" };
  if (await isMember(booking.email)) return { ok: false, error: "already_member" };
  const state = await offerState(booking.bookingId, Date.now());
  if (!state.open || !state.shownAt) return { ok: false, error: "offer_closed" };
  if (await isEmailFrozen(booking.email)) return { ok: false, error: "frozen" };

  const userId = await accountIdForEmail(booking.email);
  const result = await createMembershipCheckout({
    user: { id: userId, email: booking.email },
    plan: MEMBERSHIP_OFFER_PLAN,
    locale: input.locale,
    source: "offer",
    offer: { bookingId: booking.bookingId, bookingSessionId: input.sessionId },
    meta: input.meta,
  });
  if (result.ok) {
    await getDb()
      .insert(bookingEvents)
      .values({ bookingId: booking.bookingId, type: ACCEPTED, payload: { checkoutSessionId: result.sessionId } });
  }
  return result;
}

/**
 * Back from Stripe after becoming a member through the offer: true when
 * that membership belongs to this booking's address (the page then says
 * "welcome" instead of showing the offer).
 */
export async function isOfferMembershipOf(sessionId: string, membershipEmail: string): Promise<boolean> {
  const booking = await offerBooking(sessionId);
  return Boolean(booking && booking.email === membershipEmail.trim().toLowerCase());
}
