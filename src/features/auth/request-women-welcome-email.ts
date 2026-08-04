"use client";

import type { Locale } from "@/i18n/config";

/** Fire-and-forget welcome email for women after onboarding. */
export function requestWomenWelcomeEmail(locale: Locale): void {
  void fetch("/api/onboarding/women-welcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale }),
  }).catch(() => {
    /* non-blocking */
  });
}
