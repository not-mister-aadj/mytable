"use client";

import {
  getGoogleAdsConversionId,
  getGoogleAdsSendTo,
  isGoogleAdsConfigured,
} from "@/lib/analytics/googleAdsConfig";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const PURCHASE_STORAGE_PREFIX = "mytable_google_ads_purchase_";
const GTAG_RETRY_MS = 150;
const GTAG_MAX_ATTEMPTS = 40;

function isDebugMode(): boolean {
  return process.env.NODE_ENV === "development";
}

function logGoogleAds(message: string, detail?: Record<string, unknown>): void {
  if (!isDebugMode()) return;
  console.log(`[Google Ads] ${message}`, detail ?? {});
}

export function hasGoogleAdsPurchaseBeenTracked(bookingId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = PURCHASE_STORAGE_PREFIX + bookingId;

  try {
    if (sessionStorage.getItem(key) === "1") return true;
    if (localStorage.getItem(key) === "1") return true;
  } catch {
    return false;
  }

  return false;
}

function markGoogleAdsPurchaseTracked(bookingId: string): void {
  if (typeof window === "undefined") return;
  const key = PURCHASE_STORAGE_PREFIX + bookingId;

  try {
    sessionStorage.setItem(key, "1");
    localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}

function canTrackGtag(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function initGoogleAds(): void {
  if (typeof window === "undefined" || !isGoogleAdsConfigured()) return;

  const conversionId = getGoogleAdsConversionId();
  if (!conversionId) return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    const gtag = (...args: unknown[]) => {
      window.dataLayer!.push(args);
    };
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", conversionId);
  }

  const scriptId = "google-ads-gtag";
  if (document.getElementById(scriptId)) return;

  const script = document.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(conversionId)}`;
  document.head.appendChild(script);

  logGoogleAds("init", { conversion_id: conversionId });
}

export function trackGoogleAdsPurchase(
  params: {
    value: number;
    currency: string;
    transactionId: string;
  },
  attempt = 0,
): void {
  initGoogleAds();

  if (hasGoogleAdsPurchaseBeenTracked(params.transactionId)) {
    logGoogleAds("conversion skipped (duplicate)", {
      transaction_id: params.transactionId,
    });
    return;
  }

  const sendTo = getGoogleAdsSendTo();
  if (!sendTo) return;

  if (!canTrackGtag()) {
    if (attempt < GTAG_MAX_ATTEMPTS) {
      setTimeout(
        () => trackGoogleAdsPurchase(params, attempt + 1),
        GTAG_RETRY_MS,
      );
    } else {
      logGoogleAds("conversion not sent — gtag not ready");
    }
    return;
  }

  window.gtag!("event", "conversion", {
    send_to: sendTo,
    value: params.value,
    currency: params.currency,
    transaction_id: params.transactionId,
  });

  logGoogleAds("conversion", {
    send_to: sendTo,
    value: params.value,
    currency: params.currency,
    transaction_id: params.transactionId,
  });
  markGoogleAdsPurchaseTracked(params.transactionId);
}
