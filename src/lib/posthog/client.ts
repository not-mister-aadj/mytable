"use client";

import posthog from "posthog-js";
import { getPostHogIngestHost, isPostHogConfigured } from "@/lib/posthog/config";
import type { PostHogEventName } from "@/lib/posthog/events";

let initialized = false;

export function initPostHogClient(): void {
  if (initialized || typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key || !isPostHogConfigured()) return;

  posthog.init(key, {
    api_host: getPostHogIngestHost(),
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });

  initialized = true;
}

export function captureClientEvent(
  event: PostHogEventName | string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === "undefined") return;
  initPostHogClient();
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function capturePageView(url: string): void {
  if (typeof window === "undefined") return;
  initPostHogClient();
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: url });
}

export { posthog };
