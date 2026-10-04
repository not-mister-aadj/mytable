"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { trackJouwTafelEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

/** landing_signup_page_viewed / landing_login_page_viewed, once per visit.
 * Started on the placeholder pages to count intent; kept on the real
 * account screens so the numbers stay comparable over time. The detailed
 * funnel is auth_screen_viewed and friends (JouwTafelAuthForm). */
export function PlaceholderViewTracker({
  kind,
  locale,
}: {
  kind: "signup" | "login";
  locale: Locale;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackJouwTafelEvent(
      kind === "signup"
        ? PostHogEvents.landingSignupPageViewed
        : PostHogEvents.landingLoginPageViewed,
      { locale },
    );
  }, [kind, locale]);
  return null;
}
