"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { deferUntilIdle } from "@/lib/defer-until-idle";
import { buildMetaAdvancedMatching } from "@/lib/analytics/metaAdvancedMatching";
import { ensureMetaFbcCookie } from "@/lib/analytics/metaCookies";
import {
  initMetaPixel,
  isMetaPixelConfigured,
  isMetaPixelEnabled,
} from "@/lib/analytics/metaPixel";
import { trackMetaCompleteRegistration, trackMetaPageView } from "@/lib/analytics/metaTracking";
import { persistUtmFromUrl } from "@/lib/analytics/utm";
import { useAuthSession } from "@/features/auth/AuthSessionContext";

function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuthSession();
  const readyRef = useRef(false);
  const pendingRef = useRef<{ pathname: string; query: string } | null>(null);
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isMetaPixelEnabled()) return;
    ensureMetaFbcCookie();
  }, [searchParams]);

  useEffect(() => {
    if (!isMetaPixelEnabled() || loading) return;

    const cleanup = deferUntilIdle(() => {
      void buildMetaAdvancedMatching(user).then((matching) => {
        initMetaPixel(matching);
        readyRef.current = true;
        const pending = pendingRef.current;
        if (pending) {
          pendingRef.current = null;
          const key = `${pending.pathname}?${pending.query}`;
          if (lastTrackedPathRef.current !== key) {
            lastTrackedPathRef.current = key;
            persistUtmFromUrl(pending.query ? `?${pending.query}` : "");
            trackMetaPageView(pending.pathname);
          }
        }
      });
    });
    return cleanup;
  }, [user, loading]);

  useEffect(() => {
    if (!isMetaPixelEnabled() || loading || !user) return;
    trackMetaCompleteRegistration(user);
  }, [user, loading]);

  useEffect(() => {
    if (!isMetaPixelEnabled() || !pathname) return;

    const query = searchParams.toString();
    const key = `${pathname}?${query}`;

    if (!readyRef.current) {
      pendingRef.current = { pathname, query };
      return;
    }

    if (lastTrackedPathRef.current === key) return;
    lastTrackedPathRef.current = key;

    void buildMetaAdvancedMatching(user).then((matching) => {
      initMetaPixel(matching);
      persistUtmFromUrl(query ? `?${query}` : "");
      trackMetaPageView(pathname);
    });
  }, [pathname, searchParams, user]);

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
