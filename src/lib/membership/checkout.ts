import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, events, type Event } from "@/db/schema";
import { jouwTafelKiesPath, jouwTafelSettingsPath, jouwTafelMembershipPath, termsPath, type Locale } from "@/i18n/config";
import { metaContextToStripeMetadata, type MetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { onBookingCreated } from "@/lib/customers/hooks";
import { getSiteUrl } from "@/lib/env";
import { isEventClosedForBooking } from "@/lib/event-visibility";
import { getRunningMembershipForUser, previousStripeCustomerId } from "@/lib/membership/data";
import { MEMBERSHIP_OFFER_CREDIT_CENTS, formatPlanEuros, getMembershipPlan, type MembershipPlanId } from "@/lib/membership/plans";
import { membershipOfferCouponId, planPriceIds } from "@/lib/membership/stripe";
import { FREE_GUEST_EVENT } from "@/lib/membership/member-checkout";
import { planPriceLine } from "@/lib/membership/mail-copy";
import { getStripe, getSubscriptionCheckoutPaymentMethodTypes } from "@/lib/stripe";
import { isJouwTafelType, isSharedTableType } from "@/lib/event-concepts";
import { bookingOpensOverride, isClosedEmpty, jouwTafelBookingWindow } from "@/lib/jouw-tafel/logic";
import { communicationLocale } from "@/lib/booking-table-language";

/** "settings": "Word lid" on the settings page, without a Sunday chosen yet. */
export type MembershipCheckoutSource = "page" | "kies" | "offer" | "booking" | "settings";

export type MembershipCheckoutInput = {
  user: { id: string; email: string };
  plan: MembershipPlanId;
  locale: Locale;
  source: MembershipCheckoutSource;
  /** Optional: the table chosen on "Kies je zondag", booked once paid. */
  table?: {
    eventId: string;
    seats: 1 | 2;
    name: string;
    dietaryNotes?: string | null;
    tableLanguagePreference?: string | null;
    /** The language of mails and pages for this booking (communicationLocale). */
    locale?: Locale;
    birthDate?: string | null;
    agePreference?: string | null;
    /** Logged on the pending booking (consent, utm, age check). */
    events?: Array<{ type: string; payload: Record<string, unknown> }>;
  } | null;
  /** "Elke zondag" in the booking card: back to this page when they cancel
   * in Stripe (a path on this site). */
  returnPath?: string | null;
  /** The offer after a paid Sunday Social: that booking's seat comes off
   * the first month, and the person returns to its confirmation page. */
  offer?: { bookingId: string; bookingSessionId: string } | null;
  meta: MetaTrackingContext;
};

export type MembershipCheckoutResult =
  | { ok: true; url: string; sessionId: string; bookingId?: string | null }
  | { ok: false; error: "already_member" | "table_unavailable" | "table_full" | "checkout_failed" };

/** Why a Sunday Social cannot be booked right now (shared with
 * /api/checkout): a series table or a hand-made one. */
export function sundayTableUnavailable(event: Event | undefined, seats: number, now = new Date()): "table_unavailable" | "table_full" | null {
  if (!event || event.workflowStatus !== "published" || !isSharedTableType(event.experienceType)) return "table_unavailable";
  if (event.extras?.comingSoon) return "table_unavailable";
  const series = isJouwTafelType(event.experienceType);
  // A new member books first, but not before members can (4 weeks ahead).
  if (series && now.getTime() < jouwTafelBookingWindow(event.startsAt, bookingOpensOverride(event.extras)).membersFrom.getTime()) return "table_unavailable";
  if (isEventClosedForBooking(event.startsAt, now)) return "table_unavailable";
  if (event.capacity - event.spotsSold < seats) return "table_full";
  // Nobody booked it 14 days before: closed, like a full table.
  if (series && isClosedEmpty({ ...event, bookingOpensAt: bookingOpensOverride(event.extras) }, now.getTime())) return "table_unavailable";
  return null;
}

/**
 * Starts a subscription Checkout for a plan. With a table from "Kies je
 * zondag", a pending booking is made first (seat 1 free, a guest seat at
 * the plan's member price as a one-time item on the same Checkout) and
 * confirmed by the webhook once the subscription is paid.
 */
export async function createMembershipCheckout(input: MembershipCheckoutInput): Promise<MembershipCheckoutResult> {
  if (await getRunningMembershipForUser(input.user.id)) return { ok: false, error: "already_member" };

  const db = getDb();
  const email = input.user.email.trim().toLowerCase();
  let pendingBookingId: string | null = null;
  let guestCents = 0;
  let event: Event | undefined;

  if (input.table) {
    [event] = await db.select().from(events).where(eq(events.id, input.table.eventId)).limit(1);
    const problem = sundayTableUnavailable(event, input.table.seats);
    if (problem) return { ok: false, error: problem };
    // Joining with a guest: the guest comes along for free (the free guest
    // of every 3 months, the first one straight away). Taken when the
    // membership starts (fulfillMembershipCheckout).
    guestCents = 0;
    const [booking] = await db
      .insert(bookings)
      .values({
        eventId: event!.id,
        email,
        customerName: input.table.name.trim() || null,
        seats: input.table.seats,
        amountCents: guestCents,
        locale: input.table.locale ?? communicationLocale(input.table.tableLanguagePreference, input.locale),
        dietaryNotes: input.table.dietaryNotes?.trim() || null,
        seatingPreference: "join_others",
        tableLanguagePreference: input.table.tableLanguagePreference ?? "both_fine",
        birthDate: input.table.birthDate || null,
        agePreference: input.table.agePreference || null,
        paymentStatus: "pending",
      })
      .returning();
    pendingBookingId = booking!.id;
    for (const extra of input.table.events ?? []) {
      await db.insert(bookingEvents).values({ bookingId: booking!.id, type: extra.type, payload: extra.payload });
    }
    await onBookingCreated({ booking: booking!, event: event! }).catch(() => undefined);
    await db.insert(bookingEvents).values({
      bookingId: booking!.id,
      type: "member_checkout_started",
      payload: { plan: input.plan, guestCents },
    });
    if (input.table.seats === 2) {
      await db.insert(bookingEvents).values({ bookingId: booking!.id, type: FREE_GUEST_EVENT, payload: { plan: input.plan, onJoin: true } });
    }
    if (input.meta.fbp || input.meta.fbc || input.meta.clientIpAddress) {
      await db.insert(bookingEvents).values({ bookingId: booking!.id, type: "checkout_meta_context", payload: input.meta });
    }
  }

  const stripe = getStripe();
  const prices = await planPriceIds(input.plan);
  const site = getSiteUrl().replace(/\/$/, "");
  const page = jouwTafelMembershipPath(input.locale);
  const en = input.locale === "en";
  const metadata: Record<string, string> = {
    kind: "membership",
    plan: input.plan,
    user_id: input.user.id,
    email,
    locale: input.locale,
    source: input.source,
    ...(input.table?.name ? { name: input.table.name.slice(0, 200) } : {}),
    ...(input.offer ? { offer_booking_id: input.offer.bookingId } : {}),
    ...(pendingBookingId ? { member_booking_id: pendingBookingId, event_id: input.table!.eventId, seats: String(input.table!.seats) } : {}),
    ...metaContextToStripeMetadata(input.meta),
    ...(input.meta.clientIpAddress ? { mt_ip: input.meta.clientIpAddress.slice(0, 60) } : {}),
    ...(input.meta.clientUserAgent ? { mt_ua: input.meta.clientUserAgent.slice(0, 480) } : {}),
  };

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{ price: prices.initial, quantity: 1 }];
  if (guestCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: guestCents,
        tax_behavior: "inclusive",
        product_data: {
          name: en ? "Guest at your Sunday Social (member price)" : "Gast aan je Sunday Social (ledenprijs)",
          description: event ? `${event.city} · MyTable` : "MyTable",
        },
      },
    });
  }

  const existingCustomer = await previousStripeCustomerId({ userId: input.user.id, email });
  const plan = getMembershipPlan(input.plan);
  const firstMonth = `€${formatPlanEuros(Math.max(0, plan.initialCents - MEMBERSHIP_OFFER_CREDIT_CENTS), input.locale)}`;
  const monthly = `€${formatPlanEuros(plan.monthlyCents, input.locale)}`;
  const priceLine = input.offer
    ? en
      ? `${firstMonth} for your first month, then ${monthly} per month, cancel monthly`
      : `${firstMonth} voor je eerste maand, daarna ${monthly} per maand, per maand opzegbaar`
    : planPriceLine(input.plan, input.locale);
  const confirmed = input.offer
    ? `${site}/${input.locale}/boeking/bevestigd?session_id=${encodeURIComponent(input.offer.bookingSessionId)}`
    : null;
  // "Elke zondag" in the booking card: the same confirmation page as a
  // single seat, for the booking this Checkout pays for.
  const fromBooking = input.source === "booking" && pendingBookingId;
  const settingsPage = `${site}${jouwTafelSettingsPath(input.locale)}`;
  const back = input.returnPath && input.returnPath.startsWith("/") && !input.returnPath.startsWith("//") ? input.returnPath : null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(existingCustomer ? { customer: existingCustomer } : { customer_email: email }),
      client_reference_id: input.user.id,
      locale: en ? "en" : "nl",
      payment_method_types: getSubscriptionCheckoutPaymentMethodTypes("EUR"),
      line_items: lineItems,
      ...(input.offer ? { discounts: [{ coupon: await membershipOfferCouponId() }] } : {}),
      metadata,
      subscription_data: {
        metadata: { kind: "membership", plan: input.plan, user_id: input.user.id, email, locale: input.locale },
      },
      custom_text: {
        // Stripe shows "billed every 4 months" / "yearly" for the first
        // price, so the plan's own words go right above the pay button.
        submit: {
          message: en
            ? `${priceLine}. Your membership starts right after payment. Terms: ${site}${termsPath("en")}`
            : `${priceLine}. Je lidmaatschap start direct na betaling. Voorwaarden: ${site}${termsPath("nl")}`,
        },
      },
      success_url: fromBooking
        ? `${site}/${input.locale}/boeking/bevestigd?session_id={CHECKOUT_SESSION_ID}&lid={CHECKOUT_SESSION_ID}`
        : confirmed
          ? `${confirmed}&lid={CHECKOUT_SESSION_ID}`
          : input.source === "settings"
            ? `${settingsPage}?lid={CHECKOUT_SESSION_ID}`
            : `${site}${page}?welkom=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: fromBooking && back
        ? `${site}${back}`
        : confirmed
          ? confirmed
          : input.source === "settings"
            ? settingsPage
            : input.source === "kies" ? `${site}${jouwTafelKiesPath(input.locale)}` : `${site}${page}?plan=${input.plan}`,
    });
    if (pendingBookingId) {
      await db.update(bookings).set({ stripeCheckoutSessionId: session.id }).where(eq(bookings.id, pendingBookingId));
    }
    if (!session.url) return { ok: false, error: "checkout_failed" };
    return { ok: true, url: session.url, sessionId: session.id, bookingId: pendingBookingId };
  } catch (error) {
    if (pendingBookingId) {
      await db.update(bookings).set({ paymentStatus: "failed" }).where(eq(bookings.id, pendingBookingId));
    }
    throw error;
  }
}
