"use client";

import type { ReactNode } from "react";
import {
  MOBILE_PREVIEW_FRAMES,
  type MobilePreviewSize,
} from "./mobile-preview-frames";

interface PreviewDeviceFrameProps {
  mode: "desktop" | "mobile";
  mobileSize: MobilePreviewSize;
  children: ReactNode;
  /** Taller scroll area in fullscreen */
  className?: string;
}

export function PreviewDeviceFrame({
  mode,
  mobileSize,
  children,
  className = "",
}: PreviewDeviceFrameProps) {
  if (mode === "desktop") {
    return <div className={`w-full ${className}`}>{children}</div>;
  }

  const frame = MOBILE_PREVIEW_FRAMES[mobileSize];

  return (
    <div className={`mx-auto w-full ${className}`}>
      <div
        className="mx-auto overflow-hidden rounded-[1.75rem] border-[3px] border-wine/15 bg-cream shadow-[0_12px_40px_rgba(43,13,18,0.12)]"
        style={{
          width: frame.width,
          maxWidth: "100%",
          aspectRatio: `${frame.width} / ${frame.height}`,
        }}
      >
        <div className="h-full overflow-x-hidden overflow-y-auto overscroll-y-contain">
          {children}
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-wine/50">
        {frame.label} · {frame.width}×{frame.height} ({frame.device})
      </p>
    </div>
  );
}
