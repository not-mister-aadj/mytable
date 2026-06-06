import type { Booking, Event } from "@/db/schema";
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
import { getSiteUrl } from "@/lib/env";

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
