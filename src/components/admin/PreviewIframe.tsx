"use client";

import { useMemo } from "react";
import { adminUrl } from "@/lib/admin-url";
import type { Locale } from "@/i18n/config";

interface PreviewIframeProps {
  eventId: string;
  locale: Locale;
  width: number;
  height: number;
  className?: string;
  /** Bump after save to reload iframe */
  revision?: number;
}

export function PreviewIframe({
  eventId,
  locale,
  width,
  height,
  className = "",
  revision = 0,
}: PreviewIframeProps) {
  const src = useMemo(() => {
    const url = adminUrl(`/preview/${eventId}?locale=${locale}`);
    return revision > 0 ? `${url}&r=${revision}` : url;
  }, [eventId, locale, revision]);

  return (
    <iframe
      src={src}
      title="Pagina preview"
      width={width}
      height={height}
      className={`block border-0 bg-cream ${className}`}
      style={{ width, height }}
    />
  );
}
