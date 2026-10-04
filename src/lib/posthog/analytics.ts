"use client";

import type { ExperienceItem } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { AgendaTabKey } from "@/i18n/types";
import { captureClientEvent, captureClientEventBeacon } from "@/lib/posthog/client";
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
  extras?: {
    join_option?: string;
    ticket_quantity?: number;
    is_multi_ticket?: boolean;
  },
): void {
  capture(PostHogEvents.bookingStarted, {
    ...buildExperienceProperties(experience, language),
    seats_selected: seatsSelected,
    source,
    ...extras,
  });
}

export function trackSeatsSelected(
  experience: ExperienceItem,
  language: string,
  seats: number,
  totalPriceOverride?: number,
  extras?: {
    join_option?: string;
    ticket_quantity?: number;
    is_multi_ticket?: boolean;
  },
): void {
  const totalPrice = totalPriceOverride ?? experience.price * seats;
  capture(PostHogEvents.seatsSelected, {
    ...buildExperienceProperties(experience, language),
    seats,
    total_price: totalPrice,
    ...extras,
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

/** "Jouw tafel" landing page events. Never pass an email or name in here. */
export function trackJouwTafelEvent(
  event:
    | typeof PostHogEvents.landingSectionViewed
    | typeof PostHogEvents.landingCtaClicked
    | typeof PostHogEvents.landingSignupPageViewed
    | typeof PostHogEvents.landingLoginPageViewed,
  props: AnalyticsProperties,
): void {
  capture(event, props);
}

/** "Jouw tafel" account screens (sign up / log in). Never pass an email in
 * here: screen, step and reason only. */
export function trackJouwTafelAuthEvent(
  event:
    | typeof PostHogEvents.authScreenViewed
    | typeof PostHogEvents.authCodeRequested
    | typeof PostHogEvents.authCodeVerified
    | typeof PostHogEvents.authCodeFailed
    | typeof PostHogEvents.authGoogleClicked
    | typeof PostHogEvents.authGoogleHiddenInApp,
  props: AnalyticsProperties & { screen: "signup" | "login" },
): void {
  capture(event, props);
}

/** Logout from the "Jouw tafel" welcome page. */
export function trackJouwTafelLogout(props: { locale: string }): void {
  capture(PostHogEvents.authLoggedOut, props);
}

/** Quiz events (/jouw-tafel/start). Callers pass step ids, answer ids and
 * counts only: never a name, email, birth date or typed text. */
export function trackQuizEvent(
  event:
    | typeof PostHogEvents.quizStepViewed
    | typeof PostHogEvents.quizStepCompleted
    | typeof PostHogEvents.quizBackClicked
    | typeof PostHogEvents.quizResumed
    | typeof PostHogEvents.quizCompleted
    | typeof PostHogEvents.quizChooseViewed
    | typeof PostHogEvents.quizReserveClicked
    | typeof PostHogEvents.quizNotifyClicked
    | typeof PostHogEvents.quizShareClicked
    | typeof PostHogEvents.quizInfoOpened
    | typeof PostHogEvents.quizLogoutClicked,
  props: AnalyticsProperties,
): void {
  capture(event, props);
}

/** Settings page events: field names, booleans and counts only. */
export function trackSettingsEvent(
  event:
    | typeof PostHogEvents.settingsOpened
    | typeof PostHogEvents.settingChanged
    | typeof PostHogEvents.notificationsToggled
    | typeof PostHogEvents.bookingOpened
    | typeof PostHogEvents.accountDeleted,
  props: AnalyticsProperties,
): void {
  capture(event, props);
}

/** Sunday Table membership events (page, plan picker, checkout, settings,
 * the early-access label on "Kies je zondag"). No personal data. */
export function trackMembershipEvent(
  event:
    | typeof PostHogEvents.membershipPageViewed
    | typeof PostHogEvents.membershipPlanSelected
    | typeof PostHogEvents.membershipCheckoutStarted
    | typeof PostHogEvents.membershipStarted
    | typeof PostHogEvents.membershipCancelClicked
    | typeof PostHogEvents.memberSeatCancelled
    | typeof PostHogEvents.earlyAccessBlockedView,
  props: AnalyticsProperties,
): void {
  capture(event, props);
}

/** The table page and the reserve step after "Kies je zondag". */
export function trackTableEvent(
  event:
    | typeof PostHogEvents.tableOpened
    | typeof PostHogEvents.tablePageViewed
    | typeof PostHogEvents.tableReserveClicked
    | typeof PostHogEvents.reserveStepViewed
    | typeof PostHogEvents.reserveOptionSelected
    | typeof PostHogEvents.reserveCheckoutClicked
    | typeof PostHogEvents.reserveGuestToggled,
  props: AnalyticsProperties,
): void {
  capture(event, props);
}

/** quiz_step_left, on pagehide or when the tab goes to the background. */
export function trackQuizStepLeft(props: AnalyticsProperties): void {
  captureClientEventBeacon(PostHogEvents.quizStepLeft, { ...baseContext(), ...props });
}

/** Fired when someone answers (or explicitly skips) the waitlist preference questions. */
export function trackSundayTableWaitlistEnriched(props: {
  city: string;
  locale: string;
  answered_count: number;
  skipped: boolean;
}): void {
  capture(PostHogEvents.sundayTableWaitlistEnriched, props);
}

export function trackWhatsappJoinClicked(props: {
  interest: string;
  locale: string;
}): void {
  capture(PostHogEvents.whatsappJoinClicked, props);
}

export function trackSundayTableCtaClicked(props: {
  cta: string;
  source?: string;
  locale?: string;
}): void {
  capture(PostHogEvents.sundayTableCtaClicked, props);
}

/** Someone picked "English" on a Sunday Table date page while those tables
 * are still Dutch-only: `selected` when they pick it, `notify` when they
 * leave their details for the first English-speaking table. */
export function trackSundayTableEnglishRequested(props: {
  step: "selected" | "notify";
  city: string;
  locale: string;
}): void {
  capture(PostHogEvents.sundayTableEnglishRequested, props);
}

export function trackScrollDepthReached(props: {
  depth_percent: number;
  page_path: string;
  page_type: string;
  language: string;
}): void {
  capture(PostHogEvents.scrollDepthReached, props);
}

export function trackOnboardingStepViewed(props: {
  step: string;
  mode?: string;
  locale?: string;
}): void {
  capture(PostHogEvents.onboardingStepViewed, props);
}

export function trackOnboardingStepCompleted(props: {
  step: string;
  next_step?: string;
  mode?: string;
  locale?: string;
  choice?: string;
}): void {
  capture(PostHogEvents.onboardingStepCompleted, props);
}

export function trackPremiumExperienceViewed(props: AnalyticsProperties): void {
  capture(PostHogEvents.premiumExperienceViewed, props);
}

export function trackGroupInvitationStarted(props: {
  source?: string;
  locale?: string;
}): void {
  capture(PostHogEvents.groupInvitationStarted, props);
}

export function trackGroupInvitationShared(props: {
  channel: string;
  source?: string;
  locale?: string;
}): void {
  capture(PostHogEvents.groupInvitationShared, props);
  capture(PostHogEvents.inviteShareClicked, props);
}

export function trackInviteShareClicked(props: {
  channel: string;
  locale?: string;
}): void {
  capture(PostHogEvents.inviteShareClicked, props);
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
