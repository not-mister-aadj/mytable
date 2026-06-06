"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import type { ConfirmationPurchaseData } from "@/lib/analytics/confirmationPurchase";
import { isMetaPixelConfigured } from "@/lib/analytics/metaConfig";
import { trackMetaPurchasePayload } from "@/lib/analytics/metaTracking";

type Props = {
  initial: ConfirmationPurchaseData | null;
  sessionId: string;
  locale: Locale;
};

const POLL_MS = 2000;
const POLL_MAX = 45;

function firePurchase(data: ConfirmationPurchaseData): void {
  trackMetaPurchasePayload({
    bookingId: data.bookingId,
    eventId: data.eventId,
    value: data.value,
    currency: data.currency,
    contentName: data.contentName,
    experienceType: data.experienceType,
    city: data.city,
    seats: data.seats,
  });
}

/** Fires Meta Purchase on the booking confirmation page (primary conversion point). */
export function MetaConfirmationPurchase({ initial, sessionId, locale }: Props) {
  const purchaseFired = useRef(false);

  useEffect(() => {
    if (!isMetaPixelConfigured()) return;

    function tryFire(data: ConfirmationPurchaseData) {
      if (purchaseFired.current) return;
      purchaseFired.current = true;
      firePurchase(data);
    }

    if (initial) {
      tryFire(initial);
    }

    let cancelled = false;

    async function poll(attempt = 0): Promise<void> {
      if (cancelled || purchaseFired.current || attempt >= POLL_MAX) return;

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

      if (!cancelled && !purchaseFired.current) {
        window.setTimeout(() => void poll(attempt + 1), POLL_MS);
      }
    }

    if (!purchaseFired.current) {
      void poll(initial ? 1 : 0);
    }

    return () => {
      cancelled = true;
    };
  }, [initial, sessionId, locale]);

  return null;
}
