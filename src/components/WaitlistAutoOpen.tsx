"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reads a `?join=1` query param and auto-opens the waitlist modal on mount —
 * for links (DMs, email, Instagram bio) that should skip straight to the
 * questionnaire instead of requiring a click on the page's own CTA.
 *
 * Isolated in its own component (rather than calling useSearchParams directly
 * inside the big landing-page view components) so only this small subtree
 * opts into client-side rendering for the dynamic query-param read — the
 * rest of the landing page stays prerenderable. Callers must wrap this in a
 * `<Suspense fallback={null}>` boundary, per Next.js's useSearchParams
 * requirement for static pages.
 */
export function WaitlistAutoOpen({ onTrigger }: { onTrigger: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("join") === "1") {
      onTrigger();
    }
    // Only re-check when the query string itself changes — onTrigger is a
    // fresh closure every render in the callers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
