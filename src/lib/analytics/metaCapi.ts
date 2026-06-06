import type { Booking, Event } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { experiencePath, type Locale } from "@/i18n/config";
import {
  sendMetaCapiEvent,
  type MetaCapiUserData,
} from "@/lib/analytics/metaCapiClient";
import {
  metaInitiateCheckoutEventId,
  metaLeadEventId,
  metaPurchaseEventId,
} from "@/lib/analytics/metaIds";
import {
  loadCheckoutMetaContext,
  metaUserDataFromStoredContext,
} from "@/lib/analytics/metaCapiContext";
import { getSiteUrl } from "@/lib/env";
import { isStripeConfigured, getStripe } from "@/lib/stripe";

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

  return sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: metaPurchaseEventId(booking.id),
    eventSourceUrl: confirmationUrl(locale),
    userData: {
      email: booking.email,
      firstName: booking.customerName?.split(/\s+/)[0] ?? null,
      ...input.userData,
    },
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

  return sendMetaCapiEvent({
    eventName: "InitiateCheckout",
    eventId: metaInitiateCheckoutEventId(booking.id),
    eventSourceUrl: eventSourceUrl(locale, event.slug),
    userData: {
      email: booking.email,
      firstName: booking.customerName?.split(/\s+/)[0] ?? null,
      ...input.userData,
    },
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
  return sendMetaCapiEvent({
    eventName: "Lead",
    eventId: metaLeadEventId(input.waitlistId),
    eventSourceUrl: input.eventSourceUrl,
    userData: {
      email: input.email,
      ...input.userData,
    },
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
  if (!bookingId || session.payment_status !== "paid") return false;

  const db = getDb();
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

  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) return false;

  const storedMeta = await loadCheckoutMetaContext(bookingId);
  const sent = await sendMetaCapiPurchase({
    booking: row.booking,
    event: row.event,
    userData: {
      ...metaUserDataFromStoredContext(
        storedMeta,
        row.booking.email,
        row.booking.customerName?.split(/\s+/)[0] ?? null,
      ),
      clientIpAddress:
        requestHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        requestHeaders?.get("x-real-ip") ??
        null,
      clientUserAgent: requestHeaders?.get("user-agent") ?? null,
    },
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
