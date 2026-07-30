"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";
import type { ClubConfirmationPurchaseData } from "@/lib/analytics/clubConfirmationPurchase";
import { isMetaPixelEnabled } from "@/lib/analytics/metaConfig";
import { hasPurchaseBeenTracked } from "@/lib/analytics/metaPixel";
import { trackMetaClubPurchase } from "@/lib/analytics/metaTracking";

type Props = {
  initial: ClubConfirmationPurchaseData | null;
  locale: Locale;
};

const POLL_MS = 2000;
const POLL_MAX = 45;

function getSessionIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search)
    .get("session_id")
    ?.trim();
  return id?.startsWith("cs_") ? id : null;
}

function tryFirePurchase(data: ClubConfirmationPurchaseData): boolean {
  if (hasPurchaseBeenTracked(data.membershipId)) return true;
  return trackMetaClubPurchase(data);
}

/** Fires Meta Purchase on the clubmember confirmation page. */
export function MetaClubConfirmationPurchase({ initial, locale }: Props) {
  useEffect(() => {
    if (!isMetaPixelEnabled()) return;

    const sessionId = getSessionIdFromUrl();
    if (!sessionId) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Meta Pixel] Geen session_id op clubmember/bevestigd — Purchase kan niet vuren.",
        );
      }
      return;
    }

    let cancelled = false;
    let data = initial;

    async function poll(sessionId: string, attempt = 0): Promise<void> {
      if (cancelled) return;

      if (!data || !hasPurchaseBeenTracked(data.membershipId)) {
        try {
          const params = new URLSearchParams({
            session_id: sessionId,
            locale,
          });
          const res = await fetch(
            `/api/clubmember/confirmation?${params.toString()}`,
          );
          if (res.ok) {
            const body = (await res.json()) as {
              purchase?: ClubConfirmationPurchaseData | null;
            };
            data = body.purchase ?? data;
          }
        } catch {
          // retry
        }
      }

      if (data && tryFirePurchase(data)) return;

      if (attempt >= POLL_MAX) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[Meta Pixel] Geen club Purchase na polling.", {
            sessionId,
            hadInitialData: Boolean(initial),
          });
        }
        return;
      }

      window.setTimeout(() => void poll(sessionId, attempt + 1), POLL_MS);
    }

    if (data && tryFirePurchase(data)) return;

    void poll(sessionId);

    return () => {
      cancelled = true;
    };
  }, [initial, locale]);

  return null;
}
