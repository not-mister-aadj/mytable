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
import type { ClubPlanId } from "@/db/schema";
import { CLUB_PLAN_PRICING } from "@/lib/club/plan-pricing";

export function trackMetaPageView(pathname: string): void {
  const pageType = inferPageType(pathname);

  if (pageType === "event_detail") {
    // ViewContent fires from ExperiencePageContent — avoids double-counting PageView.
    return;
  }

  if (
    pageType === "home" ||
    pageType === "agenda" ||
    pageType === "join" ||
    pageType === "girls_only" ||
    pageType === "clubmember" ||
    pageType === "waitlist"
  ) {
    landingPageView(pathname, pageType);
    return;
  }

  pageView({
    page_type: pageType,
    page_path: pathname,
    page_category:
      pageType === "success" || pageType === "failed"
        ? "checkout"
        : pageType === "blog"
          ? "content"
          : "other",
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
  valueOverride?: number,
): void {
  initiateCheckout({
    content_name: experience.experienceName,
    content_ids: [eventContentId(experience)],
    event_type: experience.experienceType ?? experience.category,
    city: experience.city,
    seats,
    value: valueOverride ?? experience.price * seats,
    currency: "EUR",
    booking_id: bookingId,
  });
}

export function trackMetaClubInitiateCheckout(input: {
  membershipId: string;
  planId: ClubPlanId;
  city: string;
  locale: "nl" | "en";
}): void {
  const plan = CLUB_PLAN_PRICING[input.planId];
  initiateCheckout({
    content_name: input.locale === "en" ? plan.nameEn : plan.nameNl,
    content_ids: [`club_${input.planId}`],
    event_type: "club_membership",
    city: input.city,
    seats: 1,
    value: plan.amountCents / 100,
    currency: "EUR",
    booking_id: input.membershipId,
  });
}

export function trackMetaPurchase(summary: BookingOutcomeSummary): void {
  if (!summary.bookingId || summary.amountCents == null) return;

  trackMetaPurchasePayload({
    bookingId: summary.bookingId,
    eventId: summary.eventId,
    value: summary.amountCents / 100,
    currency: summary.currency ?? "EUR",
    contentName: summary.eventName,
    experienceType: summary.experienceType ?? "experience",
    city: summary.city,
    seats: summary.seats ?? 1,
  });
}

export function trackMetaPurchasePayload(data: {
  bookingId: string;
  eventId?: string;
  value: number;
  currency: string;
  contentName: string;
  experienceType: string;
  city: string;
  seats: number;
}): boolean {
  return purchase({
    value: data.value,
    currency: data.currency,
    content_name: data.contentName,
    event_type: data.experienceType,
    city: data.city,
    seats: data.seats,
    booking_id: data.bookingId,
    content_ids: data.eventId ? [`event_${data.eventId}`] : undefined,
  });
}

export function trackMetaClubPurchase(data: {
  membershipId: string;
  planId: string;
  value: number;
  currency: string;
  contentName: string;
  city: string;
}): boolean {
  return purchase({
    value: data.value,
    currency: data.currency,
    content_name: data.contentName,
    event_type: "club_membership",
    city: data.city,
    seats: 1,
    booking_id: data.membershipId,
    content_ids: [`club_${data.planId}`],
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
