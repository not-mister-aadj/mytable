"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { initPostHogClient, capturePageView } from "@/lib/posthog/client";
import { isPostHogConfigured } from "@/lib/posthog/config";

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
