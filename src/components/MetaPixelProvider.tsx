"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { initMetaPixel, isMetaPixelConfigured, isMetaPixelEnabled } from "@/lib/analytics/metaPixel";
import { trackMetaPageView } from "@/lib/analytics/metaTracking";
import { persistUtmFromUrl } from "@/lib/analytics/utm";

function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isMetaPixelEnabled()) return;
    initMetaPixel();
  }, []);

  useEffect(() => {
    if (!isMetaPixelEnabled() || !pathname) return;
    initMetaPixel();
    persistUtmFromUrl(searchParams.toString() ? `?${searchParams.toString()}` : "");
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
