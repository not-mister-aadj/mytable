"use client";

import { useEffect } from "react";
import { setAnalyticsConcept } from "@/lib/posthog/client";

/** Tags every PostHog event on these pages with the sign-up concept
 * (A/B test: "waitlist" funnel vs "account" funnel). Removed on leaving. */
export function PostHogConcept({ concept }: { concept: "waitlist" | "account" }) {
  useEffect(() => {
    setAnalyticsConcept(concept);
    return () => setAnalyticsConcept(null);
  }, [concept]);
  return null;
}
