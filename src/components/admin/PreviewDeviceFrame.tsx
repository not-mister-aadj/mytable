"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { PreviewIframe } from "./PreviewIframe";
import {
  MOBILE_PREVIEW_FRAMES,
  type MobilePreviewSize,
} from "./mobile-preview-frames";

interface PreviewDeviceFrameProps {
  mode: "desktop" | "mobile";
  mobileSize: MobilePreviewSize;
  children: ReactNode;
  className?: string;
  /** When set, mobile uses iframe so viewport = device width (true 1:1 breakpoints) */
  eventId?: string;
  locale?: Locale;
  previewRevision?: number;
}

export function PreviewDeviceFrame({
  mode,
  mobileSize,
  children,
  className = "",
  eventId,
  locale = "nl",
  previewRevision = 0,
}: PreviewDeviceFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [desktopWidth, setDesktopWidth] = useState(900);

  useEffect(() => {
    if (mode !== "desktop" || !eventId) return;
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width;
      if (w > 0) setDesktopWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode, eventId]);

  if (mode === "desktop") {
    if (eventId) {
      const height = Math.min(900, Math.round(desktopWidth * 1.35));
      return (
        <div ref={wrapRef} className={`w-full ${className}`}>
          <PreviewIframe
            eventId={eventId}
            locale={locale}
            width={desktopWidth}
            height={height}
            revision={previewRevision}
            className="w-full rounded-2xl shadow-lg"
          />
          <p className="mt-2 text-center text-[10px] text-wine/50">
            Desktop · {desktopWidth}px breed (opgeslagen versie)
          </p>
        </div>
      );
    }
    return <div className={`w-full ${className}`}>{children}</div>;
  }

  const frame = MOBILE_PREVIEW_FRAMES[mobileSize];

  if (eventId) {
    return (
      <div className={`mx-auto w-full ${className}`}>
        <div className="mx-auto overflow-hidden rounded-[1.75rem] border-[3px] border-wine/15 bg-cream shadow-[0_12px_40px_rgba(43,13,18,0.12)]">
          <PreviewIframe
            eventId={eventId}
            locale={locale}
            width={frame.width}
            height={frame.height}
            revision={previewRevision}
            className="rounded-[1.4rem]"
          />
        </div>
        <p className="mt-2 text-center text-[10px] text-wine/50">
          {frame.label} · {frame.width}×{frame.height} — zelfde viewport als op
          de site ({frame.device})
        </p>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full ${className}`}>
      <div
        className="mx-auto overflow-hidden rounded-[1.75rem] border-[3px] border-dashed border-wine/20 bg-cream p-4"
        style={{
          width: frame.width,
          maxWidth: "100%",
          aspectRatio: `${frame.width} / ${frame.height}`,
        }}
      >
        <p className="mb-3 text-center text-xs text-wine/55">
          Sla de tafel op voor een exacte mobiele preview (1:1 met de website).
        </p>
        <div className="h-full overflow-x-hidden overflow-y-auto overscroll-y-contain opacity-90">
          {children}
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-wine/50">
        {frame.label} · {frame.width}×{frame.height} (concept)
      </p>
    </div>
  );
}
