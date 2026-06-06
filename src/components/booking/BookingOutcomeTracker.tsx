"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import type { BookingOutcomeSummary } from "@/lib/booking-outcome-data";
import {
  trackBookingConfirmationViewed,
  trackPaymentFailedClient,
} from "@/lib/posthog/analytics";
import { trackMetaPurchase } from "@/lib/analytics/metaTracking";

interface BookingOutcomeTrackerProps {
  variant: "success" | "failed";
  locale: Locale;
  summary: BookingOutcomeSummary | null;
  sessionId?: string;
  eventSlug?: string;
}

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30;

export function BookingOutcomeTracker({
  variant,
  locale,
  summary,
  sessionId,
  eventSlug,
}: BookingOutcomeTrackerProps) {
  const posthogTracked = useRef(false);
  const metaTracked = useRef(false);

  useEffect(() => {
    if (posthogTracked.current) return;
    posthogTracked.current = true;

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

  useEffect(() => {
    if (variant !== "success") return;

    function fireMetaPurchase(next: BookingOutcomeSummary) {
      if (metaTracked.current || !next.bookingId) return;
      metaTracked.current = true;
      trackMetaPurchase(next);
    }

    if (summary?.bookingId) {
      fireMetaPurchase(summary);
      return;
    }

    if (!sessionId) return;

    let cancelled = false;

    async function pollForPaidSummary(attempt = 0): Promise<void> {
      if (cancelled || metaTracked.current || attempt >= POLL_MAX_ATTEMPTS) {
        return;
      }

      try {
        const params = new URLSearchParams({
          session_id: sessionId!,
          locale,
        });
        const res = await fetch(`/api/booking/confirmation?${params.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as {
            summary?: BookingOutcomeSummary | null;
          };
          if (data.summary?.bookingId) {
            fireMetaPurchase(data.summary);
            return;
          }
        }
      } catch {
        // retry
      }

      if (!cancelled && !metaTracked.current) {
        window.setTimeout(
          () => void pollForPaidSummary(attempt + 1),
          POLL_INTERVAL_MS,
        );
      }
    }

    void pollForPaidSummary();

    return () => {
      cancelled = true;
    };
  }, [variant, locale, summary, sessionId]);

  return null;
}
