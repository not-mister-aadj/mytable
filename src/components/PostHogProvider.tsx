"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { deferUntilIdle } from "@/lib/defer-until-idle";
import { trackPageViewed } from "@/lib/posthog/analytics";
import { initPostHogClient, capturePageView } from "@/lib/posthog/client";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { inferPageType } from "@/lib/posthog/properties";

function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const readyRef = useRef(false);
  const pendingRef = useRef<{ url: string; pathname: string } | null>(null);

  useEffect(() => {
    const cleanup = deferUntilIdle(() => {
      initPostHogClient();
      readyRef.current = true;
      const pending = pendingRef.current;
      if (pending) {
        pendingRef.current = null;
        capturePageView(pending.url);
        const locale = pending.pathname.startsWith("/en") ? "en" : "nl";
        trackPageViewed({
          page_path: pending.pathname,
          page_type: inferPageType(pending.pathname),
          language: locale,
        });
      }
    });
    return cleanup;
  }, []);

  useEffect(() => {
    if (!isPostHogConfigured() || !pathname) return;

    let url = window.origin + pathname;
    const query = searchParams.toString();
    if (query) url += `?${query}`;

    if (!readyRef.current) {
      pendingRef.current = { url, pathname };
      return;
    }

    initPostHogClient();
    capturePageView(url);

    const locale = pathname.startsWith("/en") ? "en" : "nl";
    trackPageViewed({
      page_path: pathname,
      page_type: inferPageType(pathname),
      language: locale,
    });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!isPostHogConfigured()) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
