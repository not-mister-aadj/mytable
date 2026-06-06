"use client";

import { hasMetaPixelConsent } from "@/lib/analytics/metaConsent";
import {
  getMetaPixelId,
  isMetaPixelConfigured,
} from "@/lib/analytics/metaConfig";
import {
  metaInitiateCheckoutEventId,
  metaLeadEventId,
  metaPurchaseEventId,
} from "@/lib/analytics/metaIds";
import { getStoredUtm, type UtmParams } from "@/lib/analytics/utm";

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: Fbq;
};

export type MetaViewContentParams = {
  content_name: string;
  content_ids: string[];
  content_type: string;
  event_type: string;
  city: string;
  value: number;
  currency: string;
  page_path?: string;
};

export type MetaInitiateCheckoutParams = {
  content_name: string;
  event_type: string;
  city: string;
  seats: number;
  value: number;
  currency: string;
  content_ids?: string[];
  booking_id?: string;
};

export type MetaPurchaseParams = {
  value: number;
  currency: string;
  content_name: string;
  event_type: string;
  city: string;
  seats: number;
  booking_id: string;
  content_ids?: string[];
};

export type MetaLeadParams = {
  source: "waitlist" | "newsletter";
  city: string;
  waitlist_id?: string;
};

const PURCHASE_STORAGE_PREFIX = "mytable_meta_purchase_";

export { getMetaPixelId, isMetaPixelConfigured };

function isDebugMode(): boolean {
  return process.env.NODE_ENV === "development";
}

function canTrack(): boolean {
  return (
    typeof window !== "undefined" &&
    isMetaPixelConfigured() &&
    hasMetaPixelConsent() &&
    typeof window.fbq === "function"
  );
}

function withUtm<T extends Record<string, unknown>>(params: T): T & UtmParams {
  return { ...getStoredUtm(), ...params };
}

function logMetaEvent(event: string, params?: Record<string, unknown>): void {
  if (!isDebugMode()) return;
  console.log(`[Meta Pixel] ${event} tracked`, params ?? {});
}

function track(event: string, params?: Record<string, unknown>): void {
  initMetaPixel();
  if (!canTrack()) return;
  const payload = params ? withUtm(params) : withUtm({});
  window.fbq!("track", event, payload);
  logMetaEvent(event, payload);
}

export function initMetaPixel(): void {
  if (typeof window === "undefined" || !isMetaPixelConfigured()) return;
  if (typeof window.fbq === "function") return;

  const pixelId = getMetaPixelId();
  if (!pixelId) return;

  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue!.push(args);
    }
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);

  window.fbq("init", pixelId);
  logMetaEvent("init", { pixel_id: pixelId });
}


export function pageView(params?: Record<string, unknown>): void {
  initMetaPixel();
  if (!canTrack()) return;
  const payload = params ? withUtm(params) : withUtm({});
  window.fbq!("track", "PageView", payload);
  logMetaEvent("PageView", payload);
}

/** Homepage + agenda — distinct from event detail (ViewContent). */
export function landingPageView(pathname: string, pageType: "home" | "agenda"): void {
  const params = withUtm({
    page_type: pageType,
    page_path: pathname,
    page_category: "landing",
  });
  initMetaPixel();
  if (!canTrack()) return;
  window.fbq!("trackCustom", "LandingPageView", params);
  window.fbq!("track", "PageView", params);
  logMetaEvent("LandingPageView", params);
}

export function viewContent(params: MetaViewContentParams): void {
  track("ViewContent", {
    ...params,
    page_type: "event_detail",
    page_category: "event",
  });
}

export function initiateCheckout(params: MetaInitiateCheckoutParams): void {
  initMetaPixel();
  if (!canTrack()) return;
  const payload = withUtm({
    content_name: params.content_name,
    event_type: params.event_type,
    city: params.city,
    seats: params.seats,
    value: params.value,
    currency: params.currency,
    content_ids: params.content_ids,
    booking_id: params.booking_id,
  });
  const eventId = params.booking_id
    ? metaInitiateCheckoutEventId(params.booking_id)
    : undefined;

  if (eventId) {
    window.fbq!("track", "InitiateCheckout", payload, { eventID: eventId });
    logMetaEvent("InitiateCheckout", { ...payload, event_id: eventId });
    return;
  }

  window.fbq!("track", "InitiateCheckout", payload);
  logMetaEvent("InitiateCheckout", payload);
}

const PURCHASE_RETRY_MS = 100;
const PURCHASE_MAX_ATTEMPTS = 20;

export function purchase(
  params: MetaPurchaseParams,
  attempt = 0,
): void {
  initMetaPixel();

  if (hasPurchaseBeenTracked(params.booking_id)) {
    if (isDebugMode()) {
      console.log(
        `[Meta Pixel] Purchase skipped (duplicate) for ${params.booking_id}`,
      );
    }
    return;
  }

  if (!canTrack()) {
    if (attempt < PURCHASE_MAX_ATTEMPTS) {
      setTimeout(() => purchase(params, attempt + 1), PURCHASE_RETRY_MS);
    } else if (isDebugMode()) {
      console.warn("[Meta Pixel] Purchase not sent — pixel not ready");
    }
    return;
  }

  const eventId = metaPurchaseEventId(params.booking_id);
  const payload = withUtm({
    value: params.value,
    currency: params.currency,
    content_name: params.content_name,
    content_type: "product",
    event_type: params.event_type,
    city: params.city,
    seats: params.seats,
    num_items: params.seats,
    booking_id: params.booking_id,
    content_ids: params.content_ids,
  });

  window.fbq!("track", "Purchase", payload, { eventID: eventId });
  logMetaEvent("Purchase", { ...payload, event_id: eventId });
  markPurchaseTracked(params.booking_id);
}

export function lead(params: MetaLeadParams): void {
  initMetaPixel();
  if (!canTrack()) return;
  const payload = withUtm({
    source: params.source,
    city: params.city,
  });
  const eventId = params.waitlist_id
    ? metaLeadEventId(params.waitlist_id)
    : undefined;

  if (eventId) {
    window.fbq!("track", "Lead", payload, { eventID: eventId });
    logMetaEvent("Lead", { ...payload, event_id: eventId });
    return;
  }

  window.fbq!("track", "Lead", payload);
  logMetaEvent("Lead", payload);
}

export function hasPurchaseBeenTracked(bookingId: string): boolean {
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

export function markPurchaseTracked(bookingId: string): void {
  if (typeof window === "undefined") return;
  const key = PURCHASE_STORAGE_PREFIX + bookingId;

  try {
    sessionStorage.setItem(key, "1");
    localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}
