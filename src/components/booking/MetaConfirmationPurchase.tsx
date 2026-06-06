"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";
import type { ConfirmationPurchaseData } from "@/lib/analytics/confirmationPurchase";
import { isMetaPixelEnabled } from "@/lib/analytics/metaConfig";
import { hasPurchaseBeenTracked } from "@/lib/analytics/metaPixel";
import { trackMetaPurchasePayload } from "@/lib/analytics/metaTracking";

type Props = {
  initial: ConfirmationPurchaseData | null;
  locale: Locale;
};

const POLL_MS = 2000;
const POLL_MAX = 45;
const EMBED_ID = "mytable-confirmation-purchase";

function getSessionIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("session_id")?.trim();
  return id?.startsWith("cs_") ? id : null;
}

function readEmbeddedPurchase(): ConfirmationPurchaseData | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(EMBED_ID);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as ConfirmationPurchaseData;
  } catch {
    return null;
  }
}

function toPayload(data: ConfirmationPurchaseData) {
  return {
    bookingId: data.bookingId,
    eventId: data.eventId,
    value: data.value,
    currency: data.currency,
    contentName: data.contentName,
    experienceType: data.experienceType,
    city: data.city,
    seats: data.seats,
  };
}

function tryFirePurchase(data: ConfirmationPurchaseData): boolean {
  if (hasPurchaseBeenTracked(data.bookingId)) return true;
  return trackMetaPurchasePayload(toPayload(data));
}

/** Fires Meta Purchase on the booking confirmation page (primary conversion point). */
export function MetaConfirmationPurchase({ initial, locale }: Props) {
  useEffect(() => {
    if (!isMetaPixelEnabled()) return;

    const sessionId = getSessionIdFromUrl();
    if (!sessionId) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Meta Pixel] Geen session_id in URL op bevestigingspagina — Purchase kan niet vuren.",
          "URL moet zijn: /boeking/bevestigd?session_id=cs_...",
        );
      }
      return;
    }

    let cancelled = false;
    let data = initial ?? readEmbeddedPurchase();

    async function poll(sessionId: string, attempt = 0): Promise<void> {
      if (cancelled) return;

      if (!data || !hasPurchaseBeenTracked(data.bookingId)) {
        try {
          const params = new URLSearchParams({ session_id: sessionId, locale });
          const res = await fetch(`/api/booking/confirmation?${params.toString()}`);
          if (res.ok) {
            const body = (await res.json()) as {
              purchase?: ConfirmationPurchaseData | null;
            };
            data = body.purchase ?? data;
          }
        } catch {
          // retry
        }
      }

      if (data && tryFirePurchase(data)) {
        return;
      }

      if (attempt >= POLL_MAX) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[Meta Pixel] Geen Purchase na polling.",
            "Nieuwe checkout proberen of localStorage keys mytable_meta_purchase_* wissen.",
            { sessionId, hadInitialData: Boolean(initial) },
          );
        }
        return;
      }

      window.setTimeout(() => void poll(sessionId, attempt + 1), POLL_MS);
    }

    if (data && tryFirePurchase(data)) {
      return;
    }

    void poll(sessionId);

    return () => {
      cancelled = true;
    };
  }, [initial, locale]);

  return null;
}

export function ConfirmationPurchaseEmbed({
  data,
}: {
  data: ConfirmationPurchaseData;
}) {
  return (
    <script
      id={EMBED_ID}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
