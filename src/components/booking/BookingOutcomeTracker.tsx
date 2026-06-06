"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import type { BookingOutcomeSummary } from "@/lib/booking-outcome-data";
import {
  trackBookingConfirmationViewed,
  trackPaymentFailedClient,
} from "@/lib/posthog/analytics";

interface BookingOutcomeTrackerProps {
  variant: "success" | "failed";
  locale: Locale;
  summary: BookingOutcomeSummary | null;
  eventSlug?: string;
}

export function BookingOutcomeTracker({
  variant,
  locale,
  summary,
  eventSlug,
}: BookingOutcomeTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    if (variant === "success") {
      trackBookingConfirmationViewed({
        event_id: summary?.eventId ?? null,
        event_slug: summary?.eventSlug ?? null,
        event_type: summary?.experienceType ?? null,
        city: summary?.city ?? null,
        seats: summary?.seats ?? null,
        total_paid: summary?.amountCents ? summary.amountCents / 100 : null,
        booking_id: summary?.bookingId ?? null,
        language: locale,
      });
      return;
    }

    trackPaymentFailedClient({
      event_slug: eventSlug ?? summary?.eventSlug ?? null,
      city: summary?.city ?? null,
      failure_reason: "user_cancelled",
      language: locale,
    });
  }, [variant, locale, summary, eventSlug]);

  return null;
}
