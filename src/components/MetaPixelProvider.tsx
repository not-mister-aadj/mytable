"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { deferUntilIdle } from "@/lib/defer-until-idle";
import {
  initMetaPixel,
  isMetaPixelConfigured,
  isMetaPixelEnabled,
} from "@/lib/analytics/metaPixel";
import { trackMetaPageView } from "@/lib/analytics/metaTracking";
import { persistUtmFromUrl } from "@/lib/analytics/utm";

function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const readyRef = useRef(false);
  const pendingRef = useRef<{ pathname: string; query: string } | null>(null);

  useEffect(() => {
    if (!isMetaPixelEnabled()) return;

    const cleanup = deferUntilIdle(() => {
      initMetaPixel();
      readyRef.current = true;
      const pending = pendingRef.current;
      if (pending) {
        pendingRef.current = null;
        persistUtmFromUrl(pending.query ? `?${pending.query}` : "");
        trackMetaPageView(pending.pathname);
      }
    });
    return cleanup;
  }, []);

  useEffect(() => {
    if (!isMetaPixelEnabled() || !pathname) return;

    const query = searchParams.toString();

    if (!readyRef.current) {
      pendingRef.current = { pathname, query };
      return;
    }

    initMetaPixel();
    persistUtmFromUrl(query ? `?${query}` : "");
    trackMetaPageView(pathname);
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixelProvider({ children }: { children: React.ReactNode }) {
  if (!isMetaPixelConfigured()) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <MetaPixelTracker />
      </Suspense>
      {children}
    </>
  );
}
