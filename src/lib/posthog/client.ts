"use client";

// Bundle the recorder so replay does not depend on a lazy CDN fetch
// (which fails when /flags remote config is disabled or assets are blocked).
import "posthog-js/dist/posthog-recorder";
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
    ui_host: "https://eu.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    // Autocapture powers click heatmaps; skip noisy form field captures.
    autocapture: {
      capture_copied_text: false,
      dom_event_allowlist: ["click"],
      element_allowlist: ["a", "button", "input", "select", "textarea", "label"],
    },
    capture_heatmaps: true,
    enable_heatmaps: true,
    // Session replay: watch scroll, rage clicks, drop-off on LPs.
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        email: true,
        tel: true,
      },
      recordCrossOriginIframes: false,
    },
    // Skip /flags (project key returns 401 on that endpoint for us).
    // Because remote replay config then never arrives, force-start below.
    advanced_disable_feature_flags: true,
    loaded: (ph) => {
      if (!ph.sessionRecordingStarted()) {
        ph.startSessionRecording(true);
      }
    },
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
