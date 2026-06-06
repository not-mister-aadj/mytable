"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { trackPageViewed } from "@/lib/posthog/analytics";
import { initPostHogClient, capturePageView } from "@/lib/posthog/client";
import { isPostHogConfigured } from "@/lib/posthog/config";
import { inferPageType } from "@/lib/posthog/properties";

function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHogClient();
  }, []);

  useEffect(() => {
    if (!isPostHogConfigured() || !pathname) return;
    initPostHogClient();
    let url = window.origin + pathname;
    const query = searchParams.toString();
    if (query) url += `?${query}`;

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
