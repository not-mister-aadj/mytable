"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackScrollDepthReached } from "@/lib/posthog/analytics";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { inferPageType } from "@/lib/posthog/properties";

const DEPTHS = [25, 50, 75, 90, 100] as const;

function currentScrollPercent(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const height = doc.scrollHeight - window.innerHeight;
  if (height <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / height) * 100));
}

/** Fires once per depth threshold per pathname (25/50/75/90/100). */
export function PostHogScrollDepthTracker() {
  const pathname = usePathname();
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isPostHogConfigured() || !pathname) return;

    firedRef.current = new Set();
    const locale = pathname.startsWith("/en") ? "en" : "nl";
    const pageType = inferPageType(pathname);

    const onScroll = () => {
      const percent = currentScrollPercent();
      for (const depth of DEPTHS) {
        if (percent < depth || firedRef.current.has(depth)) continue;
        firedRef.current.add(depth);
        trackScrollDepthReached({
          depth_percent: depth,
          page_path: pathname,
          page_type: pageType,
          language: locale,
        });
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return null;
}
