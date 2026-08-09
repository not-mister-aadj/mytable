import type { Booking, ClubPlanId, Event } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  bookingEvents,
  bookings,
  clubMemberships,
  events,
} from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import {
  clubmemberConfirmedPath,
  clubmemberPath,
  experiencePath,
  type Locale,
} from "@/i18n/config";
import {
  mergeMetaCapiUserData,
  sendMetaCapiEvent,
  type MetaCapiUserData,
  splitPersonName,
} from "@/lib/analytics/metaCapiClient";
import {
  metaInitiateCheckoutEventId,
  metaLeadEventId,
  metaPurchaseEventId,
} from "@/lib/analytics/metaIds";
import {
  enrichmentToUserData,
  loadCheckoutMetaContext,
  loadCustomerMetaEnrichment,
  metaUserDataFromStoredContext,
} from "@/lib/analytics/metaCapiContext";
import { metaContextFromStripeMetadata } from "@/lib/analytics/metaApiContext";
import { getClubConfirmationPurchase } from "@/lib/analytics/clubConfirmationPurchase";
import {
  CLUB_PLAN_PRICING,
  isClubPlanId,
} from "@/lib/club/plan-pricing";
import { getSiteUrl } from "@/lib/env";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { isCheckoutPaymentSettled } from "@/lib/stripe/checkout-session";

function eventDisplayName(event: Event, locale: string): string {
  return locale === "en" ? event.nameEn : event.nameNl;
}

function eventSourceUrl(locale: Locale, slug: string): string {
  return `${getSiteUrl()}${experiencePath(locale, slug)}`;
}

function confirmationUrl(locale: Locale): string {
  const prefix = locale === "en" ? "/en" : "";
  return `${getSiteUrl()}${prefix}/boeking/bevestigd`;
}

export async function sendMetaCapiPurchase(input: {
  booking: Booking;
  event: Event;
  userData?: MetaCapiUserData;
}): Promise<boolean> {
  const { booking, event } = input;
  const locale = (booking.locale === "en" ? "en" : "nl") as Locale;

  const nameParts = splitPersonName(booking.customerName);
  const enrichment = await loadCustomerMetaEnrichment(booking.email);
  return sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: metaPurchaseEventId(booking.id),
    eventSourceUrl: confirmationUrl(locale),
    userData: mergeMetaCapiUserData(
      {
        email: booking.email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        city: event.city,
        country: "nl",
      },
      enrichmentToUserData(enrichment),
      input.userData,
    ),
    customData: {
      value: booking.amountCents / 100,
      currency: booking.currency.toUpperCase(),
      content_name: eventDisplayName(event, booking.locale),
      content_ids: [`event_${event.id}`],
      content_type: "product",
      event_type: event.experienceType,
      city: event.city,
      seats: booking.seats,
      booking_id: booking.id,
      num_items: booking.seats,
    },
  });
}

export async function sendMetaCapiInitiateCheckout(input: {
  booking: Booking;
  event: Event;
  userData?: MetaCapiUserData;
}): Promise<boolean> {
  const { booking, event } = input;
  const locale = (booking.locale === "en" ? "en" : "nl") as Locale;

  const nameParts = splitPersonName(booking.customerName);
  const enrichment = await loadCustomerMetaEnrichment(booking.email);
  return sendMetaCapiEvent({
    eventName: "InitiateCheckout",
    eventId: metaInitiateCheckoutEventId(booking.id),
    eventSourceUrl: eventSourceUrl(locale, event.slug),
    userData: mergeMetaCapiUserData(
      {
        email: booking.email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        city: event.city,
        country: "nl",
      },
      enrichmentToUserData(enrichment),
      input.userData,
    ),
    customData: {
      content_name: eventDisplayName(event, booking.locale),
      content_ids: [`event_${event.id}`],
      content_type: "product",
      event_type: event.experienceType,
      city: event.city,
      seats: booking.seats,
      value: booking.amountCents / 100,
      currency: booking.currency.toUpperCase(),
      booking_id: booking.id,
    },
  });
}

export async function sendMetaCapiLead(input: {
  email: string;
  city: string;
  source: "waitlist" | "newsletter";
  waitlistId: string;
  eventSourceUrl: string;
  userData?: MetaCapiUserData;
}): Promise<boolean> {
  const enrichment = await loadCustomerMetaEnrichment(input.email);
  return sendMetaCapiEvent({
    eventName: "Lead",
    eventId: metaLeadEventId(input.waitlistId),
    eventSourceUrl: input.eventSourceUrl,
    userData: mergeMetaCapiUserData(
      {
        email: input.email,
        city: input.city,
        country: "nl",
      },
      enrichmentToUserData(enrichment),
      input.userData,
    ),
    customData: {
      source: input.source,
      city: input.city,
    },
  });
}

/** Fallback when the Stripe webhook is delayed or missed — deduped via booking_events. */
export async function sendMetaCapiPurchaseForSession(
  sessionId: string,
  requestHeaders?: Headers,
): Promise<boolean> {
  if (!isDbConfigured() || !isStripeConfigured()) return false;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return false;

  const db = getDb();
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) return false;

  if (!isCheckoutPaymentSettled(session, row.booking.paymentStatus)) {
    return false;
  }

  const [alreadySent] = await db
    .select({ id: bookingEvents.id })
    .from(bookingEvents)
    .where(
      and(
        eq(bookingEvents.bookingId, bookingId),
        eq(bookingEvents.type, "meta_capi_purchase"),
      ),
    )
    .limit(1);
  if (alreadySent) return false;

  const storedMeta = await loadCheckoutMetaContext(bookingId);
  const nameParts = splitPersonName(row.booking.customerName);
  const stripePhone = session.customer_details?.phone?.trim() || null;
  const sent = await sendMetaCapiPurchase({
    booking: row.booking,
    event: row.event,
    userData: mergeMetaCapiUserData(
      metaUserDataFromStoredContext(
        storedMeta,
        row.booking.email,
        nameParts.firstName,
        {
          lastName: nameParts.lastName,
          phone: stripePhone,
          city: row.event.city,
          country: "nl",
          clientIpAddress:
            requestHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            requestHeaders?.get("x-real-ip") ??
            null,
          clientUserAgent: requestHeaders?.get("user-agent") ?? null,
        },
      ),
    ),
  });

  if (sent) {
    await db.insert(bookingEvents).values({
      bookingId,
      type: "meta_capi_purchase",
      payload: {
        event_id: metaPurchaseEventId(bookingId),
        source: "confirmation_page",
      },
    });
  }

  return sent;
}

function clubConfirmationUrl(locale: Locale): string {
  return `${getSiteUrl()}${clubmemberConfirmedPath(locale)}`;
}

export async function sendMetaCapiClubInitiateCheckout(input: {
  membershipId: string;
  planId: ClubPlanId;
  email: string;
  name?: string | null;
  city: string;
  locale: Locale;
  userData?: MetaCapiUserData;
}): Promise<boolean> {
  const plan = CLUB_PLAN_PRICING[input.planId];
  const nameParts = splitPersonName(input.name);
  const enrichment = await loadCustomerMetaEnrichment(input.email);
  return sendMetaCapiEvent({
    eventName: "InitiateCheckout",
    eventId: metaInitiateCheckoutEventId(input.membershipId),
    eventSourceUrl: `${getSiteUrl()}${clubmemberPath(input.locale)}`,
    userData: mergeMetaCapiUserData(
      {
        email: input.email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        city: input.city,
        country: "nl",
      },
      enrichmentToUserData(enrichment),
      input.userData,
    ),
    customData: {
      content_name:
        input.locale === "en" ? plan.nameEn : plan.nameNl,
      content_ids: [`club_${input.planId}`],
      content_type: "product",
      event_type: "club_membership",
      city: input.city,
      seats: 1,
      value: plan.amountCents / 100,
      currency: "EUR",
      booking_id: input.membershipId,
    },
  });
}

export async function sendMetaCapiClubPurchase(input: {
  membershipId: string;
  planId: ClubPlanId;
  email: string;
  name?: string | null;
  city: string;
  value: number;
  currency: string;
  locale: Locale;
  userData?: MetaCapiUserData;
}): Promise<boolean> {
  const plan = CLUB_PLAN_PRICING[input.planId];
  const nameParts = splitPersonName(input.name);
  const enrichment = await loadCustomerMetaEnrichment(input.email);
  return sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: metaPurchaseEventId(input.membershipId),
    eventSourceUrl: clubConfirmationUrl(input.locale),
    userData: mergeMetaCapiUserData(
      {
        email: input.email,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        city: input.city,
        country: "nl",
      },
      enrichmentToUserData(enrichment),
      input.userData,
    ),
    customData: {
      value: input.value,
      currency: input.currency.toUpperCase(),
      content_name:
        input.locale === "en" ? plan.nameEn : plan.nameNl,
      content_ids: [`club_${input.planId}`],
      content_type: "product",
      event_type: "club_membership",
      city: input.city,
      seats: 1,
      booking_id: input.membershipId,
      num_items: 1,
    },
  });
}

/** Browser confirmation fallback — Meta dedupes via shared event_id with fulfill. */
export async function sendMetaCapiClubPurchaseForSession(
  sessionId: string,
  requestHeaders?: Headers,
): Promise<boolean> {
  if (!isDbConfigured() || !isStripeConfigured()) return false;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const locale = (session.metadata?.locale === "en" ? "en" : "nl") as Locale;

  const purchase = await getClubConfirmationPurchase(sessionId, locale);
  if (!purchase) return false;

  const db = getDb();
  const [membership] = await db
    .select()
    .from(clubMemberships)
    .where(eq(clubMemberships.id, purchase.membershipId))
    .limit(1);
  if (!membership) return false;

  const membershipLocale =
    membership.locale === "en" ? "en" : locale;
  const planId = isClubPlanId(purchase.planId)
    ? purchase.planId
    : isClubPlanId(membership.planId)
      ? membership.planId
      : "12m";

  const clickIds = metaContextFromStripeMetadata(session.metadata ?? undefined);
  const stripePhone = session.customer_details?.phone?.trim() || null;

  return sendMetaCapiClubPurchase({
    membershipId: purchase.membershipId,
    planId,
    email: membership.email,
    name: membership.name,
    city: purchase.city,
    value: purchase.value,
    currency: purchase.currency,
    locale: membershipLocale,
    userData: mergeMetaCapiUserData({
      phone: stripePhone,
      fbp: clickIds.fbp ?? null,
      fbc: clickIds.fbc ?? null,
      clientIpAddress:
        requestHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        requestHeaders?.get("x-real-ip") ??
        null,
      clientUserAgent: requestHeaders?.get("user-agent") ?? null,
    }),
  });
}
