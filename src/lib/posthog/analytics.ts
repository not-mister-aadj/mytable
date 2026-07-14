"use client";

import type { ExperienceItem } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { AgendaTabKey } from "@/i18n/types";
import { captureClientEvent } from "@/lib/posthog/client";
import { PostHogEvents, type AnalyticsSourceSection } from "@/lib/posthog/events";
import {
  buildExperienceProperties,
  getDeviceType,
  hashEmailClient,
  parseUtmParams,
  type AnalyticsProperties,
} from "@/lib/posthog/properties";

function baseContext(): AnalyticsProperties {
  if (typeof window === "undefined") return {};
  const utm = parseUtmParams(window.location.search);
  return {
    device_type: getDeviceType(navigator.userAgent),
    referrer: document.referrer || undefined,
    ...utm,
  };
}

function capture(event: string, properties?: AnalyticsProperties): void {
  captureClientEvent(event as Parameters<typeof captureClientEvent>[0], {
    ...baseContext(),
    ...properties,
  });
}

export function trackPageViewed(props: {
  page_path: string;
  page_type: string;
  language: string;
}): void {
  capture(PostHogEvents.pageViewed, props);
}

export function trackAgendaViewed(props: {
  language: string;
  category_filter?: string;
  number_of_events_visible: number;
}): void {
  capture(PostHogEvents.agendaViewed, {
    city_filter: undefined,
    ...props,
  });
}

export function trackEventCardClicked(
  experience: ExperienceItem,
  language: string,
  sourceSection: AnalyticsSourceSection,
): void {
  capture(PostHogEvents.eventCardClicked, {
    ...buildExperienceProperties(experience, language),
    source_section: sourceSection,
  });
}

export function trackEventDetailViewed(
  experience: ExperienceItem,
  language: string,
): void {
  capture(PostHogEvents.eventDetailViewed, {
    ...buildExperienceProperties(experience, language),
  });
  // Legacy alias during dashboard migration
  capture(PostHogEvents.eventPageViewed, {
    ...buildExperienceProperties(experience, language),
  });
}

export function trackBookingStarted(
  experience: ExperienceItem,
  language: string,
  source: "detail_page" | "agenda_card" | "hero" | "sticky_bar" | "final_cta" | "mobile_sticky" | "mid_cta",
  seatsSelected?: number,
): void {
  capture(PostHogEvents.bookingStarted, {
    ...buildExperienceProperties(experience, language),
    seats_selected: seatsSelected,
    source,
  });
}

export function trackSeatsSelected(
  experience: ExperienceItem,
  language: string,
  seats: number,
  totalPriceOverride?: number,
): void {
  const totalPrice = totalPriceOverride ?? experience.price * seats;
  capture(PostHogEvents.seatsSelected, {
    ...buildExperienceProperties(experience, language),
    seats,
    total_price: totalPrice,
  });
}

export function trackCheckoutStarted(props: AnalyticsProperties): void {
  capture(PostHogEvents.checkoutStarted, props);
}

export function trackBookingConfirmationViewed(props: AnalyticsProperties): void {
  capture(PostHogEvents.bookingConfirmationViewed, props);
}

export function trackPaymentFailedClient(props: AnalyticsProperties): void {
  capture(PostHogEvents.paymentFailed, props);
}

export function trackLanguageChanged(props: {
  from_language: string;
  to_language: string;
  page_path: string;
}): void {
  capture(PostHogEvents.languageChanged, props);
}

export function trackCityFilterChanged(props: {
  selected_city: string;
  previous_city: string;
  page_path: string;
}): void {
  capture(PostHogEvents.cityFilterChanged, props);
}

export function trackEventTypeFilterChanged(props: {
  selected_type: string;
  previous_type: string;
  page_path: string;
  result_count?: number;
}): void {
  capture(PostHogEvents.eventTypeFilterChanged, props);
}

export function trackEmailSignupCompleted(props: {
  email: string;
  city: string;
  language: string;
  source_section: AnalyticsSourceSection;
}): void {
  capture(PostHogEvents.emailSignupCompleted, {
    email_hash: hashEmailClient(props.email),
    city: props.city,
    language: props.language,
    source_section: props.source_section,
  });
  capture(PostHogEvents.waitlistSignup, {
    city: props.city,
    locale: props.language,
  });
}

export function trackAgendaTabChange(
  tabs: Array<{ id: AgendaTabKey; label: string }>,
  previous: AgendaTabKey,
  next: AgendaTabKey,
  resultCount: number,
  locale: Locale,
): void {
  const label = (key: AgendaTabKey) =>
    tabs.find((t) => t.id === key)?.label ?? key;
  trackEventTypeFilterChanged({
    selected_type: label(next),
    previous_type: label(previous),
    page_path: window.location.pathname,
    result_count: resultCount,
  });
}
