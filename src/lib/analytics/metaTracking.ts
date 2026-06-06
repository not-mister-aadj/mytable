"use client";

import type { ExperienceItem } from "@/i18n/types";
import type { BookingOutcomeSummary } from "@/lib/booking-outcome-data";
import {
  initiateCheckout,
  landingPageView,
  lead,
  pageView,
  purchase,
  viewContent,
} from "@/lib/analytics/metaPixel";
import { inferPageType } from "@/lib/analytics/inferPageType";

export function trackMetaPageView(pathname: string): void {
  const pageType = inferPageType(pathname);

  if (pageType === "event_detail") {
    // ViewContent fires from ExperiencePageContent — avoids double-counting PageView.
    return;
  }

  if (pageType === "home" || pageType === "agenda") {
    landingPageView(pathname, pageType);
    return;
  }

  pageView({
    page_type: pageType,
    page_path: pathname,
    page_category: "other",
  });
}

function eventContentId(experience: ExperienceItem): string {
  const id = experience.eventDbId ?? experience.id;
  return `event_${id}`;
}

export function trackMetaViewContent(
  experience: ExperienceItem,
  locale: string,
): void {
  viewContent({
    content_name: experience.experienceName,
    content_ids: [eventContentId(experience)],
    content_type: "product",
    event_type: experience.experienceType ?? experience.category,
    city: experience.city,
    value: experience.price,
    currency: "EUR",
    page_path: experience.slug
      ? `/${locale}/agenda/${experience.slug}`
      : undefined,
  });
}

export function trackMetaInitiateCheckout(
  experience: ExperienceItem,
  seats: number,
  bookingId: string,
): void {
  initiateCheckout({
    content_name: experience.experienceName,
    content_ids: [eventContentId(experience)],
    event_type: experience.experienceType ?? experience.category,
    city: experience.city,
    seats,
    value: experience.price * seats,
    currency: "EUR",
    booking_id: bookingId,
  });
}

export function trackMetaPurchase(summary: BookingOutcomeSummary): void {
  if (!summary.bookingId || summary.amountCents == null) return;

  purchase({
    value: summary.amountCents / 100,
    currency: summary.currency ?? "EUR",
    content_name: summary.eventName,
    event_type: summary.experienceType ?? "experience",
    city: summary.city,
    seats: summary.seats ?? 1,
    booking_id: summary.bookingId,
    content_ids: summary.eventId ? [`event_${summary.eventId}`] : undefined,
  });
}

export function trackMetaLead(input: {
  source: "waitlist" | "newsletter";
  city: string;
  waitlistId: string;
}): void {
  lead({
    source: input.source,
    city: input.city,
    waitlist_id: input.waitlistId,
  });
}
