import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, events, type Event } from "@/db/schema";
import { jouwTafelKiesPath, jouwTafelMembershipPath, termsPath, type Locale } from "@/i18n/config";
import { metaContextToStripeMetadata, type MetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { onBookingCreated } from "@/lib/customers/hooks";
import { getSiteUrl } from "@/lib/env";
import { isEventClosedForBooking } from "@/lib/event-visibility";
import { getRunningMembershipForUser, previousStripeCustomerId } from "@/lib/membership/data";
import { guestSeatCents, type MembershipPlanId } from "@/lib/membership/plans";
import { planPriceIds } from "@/lib/membership/stripe";
import { memberBookingAmountCents } from "@/lib/membership/logic";
import { planPriceLine } from "@/lib/membership/mail-copy";
import { getStripe, getSubscriptionCheckoutPaymentMethodTypes } from "@/lib/stripe";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { bookingOpensOverride, isClosedEmpty, jouwTafelBookingWindow } from "@/lib/jouw-tafel/logic";

export type MembershipCheckoutSource = "page" | "kies";

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
  } | null;
  meta: MetaTrackingContext;
};

export type MembershipCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: "already_member" | "table_unavailable" | "table_full" | "checkout_failed" };

/** Why a Sunday Table cannot be booked right now (shared with /api/checkout). */
export function sundayTableUnavailable(event: Event | undefined, seats: number, now = new Date()): "table_unavailable" | "table_full" | null {
  if (!event || event.workflowStatus !== "published" || event.experienceType !== JOUW_TAFEL_TYPE) return "table_unavailable";
  if (event.extras?.comingSoon) return "table_unavailable";
  // A new member books first, but not before members can (4 weeks ahead).
  if (now.getTime() < jouwTafelBookingWindow(event.startsAt, bookingOpensOverride(event.extras)).membersFrom.getTime()) return "table_unavailable";
  if (isEventClosedForBooking(event.startsAt, now)) return "table_unavailable";
  if (event.capacity - event.spotsSold < seats) return "table_full";
  // Nobody booked it 14 days before: closed, like a full table.
  if (isClosedEmpty({ ...event, bookingOpensAt: bookingOpensOverride(event.extras) }, now.getTime())) return "table_unavailable";
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
    guestCents = memberBookingAmountCents(input.table.seats, guestSeatCents(input.plan));
    const [booking] = await db
      .insert(bookings)
      .values({
        eventId: event!.id,
        email,
        customerName: input.table.name.trim() || null,
        seats: input.table.seats,
        amountCents: guestCents,
        locale: input.locale,
        dietaryNotes: input.table.dietaryNotes?.trim() || null,
        seatingPreference: "join_others",
        tableLanguagePreference: input.table.tableLanguagePreference ?? "both_fine",
        paymentStatus: "pending",
      })
      .returning();
    pendingBookingId = booking!.id;
    await onBookingCreated({ booking: booking!, event: event! }).catch(() => undefined);
    await db.insert(bookingEvents).values({
      bookingId: booking!.id,
      type: "member_checkout_started",
      payload: { plan: input.plan, guestCents },
    });
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
          name: en ? "Guest at your Sunday Table (member price)" : "Gast aan je Sunday Table (ledenprijs)",
          description: event ? `${event.city} · MyTable` : "MyTable",
        },
      },
    });
  }

  const existingCustomer = await previousStripeCustomerId({ userId: input.user.id, email });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(existingCustomer ? { customer: existingCustomer } : { customer_email: email }),
      client_reference_id: input.user.id,
      locale: en ? "en" : "nl",
      payment_method_types: getSubscriptionCheckoutPaymentMethodTypes("EUR"),
      line_items: lineItems,
      metadata,
      subscription_data: {
        metadata: { kind: "membership", plan: input.plan, user_id: input.user.id, email, locale: input.locale },
      },
      custom_text: {
        // Stripe shows "billed every 4 months" / "yearly" for the first
        // price, so the plan's own words go right above the pay button.
        submit: {
          message: en
            ? `${planPriceLine(input.plan, "en")}. Your membership starts right after payment. Terms: ${site}${termsPath("en")}`
            : `${planPriceLine(input.plan, "nl")}. Je lidmaatschap start direct na betaling. Voorwaarden: ${site}${termsPath("nl")}`,
        },
      },
      success_url: `${site}${page}?welkom=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        input.source === "kies" ? `${site}${jouwTafelKiesPath(input.locale)}` : `${site}${page}?plan=${input.plan}`,
    });
    if (pendingBookingId) {
      await db.update(bookings).set({ stripeCheckoutSessionId: session.id }).where(eq(bookings.id, pendingBookingId));
    }
    if (!session.url) return { ok: false, error: "checkout_failed" };
    return { ok: true, url: session.url, sessionId: session.id };
  } catch (error) {
    if (pendingBookingId) {
      await db.update(bookings).set({ paymentStatus: "failed" }).where(eq(bookings.id, pendingBookingId));
    }
    throw error;
  }
}
