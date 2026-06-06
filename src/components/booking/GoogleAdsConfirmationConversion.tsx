"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import type { ConfirmationPurchaseData } from "@/lib/analytics/confirmationPurchase";
import { isGoogleAdsConfigured } from "@/lib/analytics/googleAdsConfig";
import { trackGoogleAdsPurchase } from "@/lib/analytics/googleAds";

type Props = {
  initial: ConfirmationPurchaseData | null;
  sessionId: string;
  locale: Locale;
};

const POLL_MS = 2000;
const POLL_MAX = 45;

function fireConversion(data: ConfirmationPurchaseData): void {
  trackGoogleAdsPurchase({
    value: data.value,
    currency: data.currency,
    transactionId: data.bookingId,
  });
}

/** Fires Google Ads purchase conversion with value on the confirmation page. */
export function GoogleAdsConfirmationConversion({
  initial,
  sessionId,
  locale,
}: Props) {
  const conversionFired = useRef(false);

  useEffect(() => {
    if (!isGoogleAdsConfigured()) return;

    function tryFire(data: ConfirmationPurchaseData) {
      if (conversionFired.current) return;
      conversionFired.current = true;
      fireConversion(data);
    }

    if (initial) {
      tryFire(initial);
    }

    let cancelled = false;

    async function poll(attempt = 0): Promise<void> {
      if (cancelled || conversionFired.current || attempt >= POLL_MAX) return;

      try {
        const params = new URLSearchParams({ session_id: sessionId, locale });
        const res = await fetch(`/api/booking/confirmation?${params.toString()}`);
        if (res.ok) {
          const body = (await res.json()) as {
            purchase?: ConfirmationPurchaseData | null;
          };
          if (body.purchase) {
            tryFire(body.purchase);
          }
        }
      } catch {
        // retry
      }

      if (!cancelled && !conversionFired.current) {
        window.setTimeout(() => void poll(attempt + 1), POLL_MS);
      }
    }

    if (!conversionFired.current) {
      void poll(initial ? 1 : 0);
    }

    return () => {
      cancelled = true;
    };
  }, [initial, sessionId, locale]);

  return null;
}
