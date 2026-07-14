"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Venue } from "@/db/schema";
import { ExperienceCard } from "@/components/ExperienceCard";
import { nl } from "@/i18n/dictionaries/nl";
import { en } from "@/i18n/dictionaries/en";
import { motion } from "framer-motion";
import type { PreviewEventData } from "./event-preview";
import { buildCardPreviewExperience } from "./event-preview";
import { AdminDetailPreview } from "./AdminDetailPreview";
import { PreviewDeviceFrame } from "./PreviewDeviceFrame";
import {
  DEFAULT_MOBILE_PREVIEW_SIZE,
  MOBILE_PREVIEW_FRAMES,
  type MobilePreviewSize,
} from "./mobile-preview-frames";

const MOBILE_SIZE_STORAGE_KEY = "mytable-admin-mobile-preview-size";

function readStoredMobileSize(): MobilePreviewSize {
  if (typeof window === "undefined") return DEFAULT_MOBILE_PREVIEW_SIZE;
  const raw = localStorage.getItem(MOBILE_SIZE_STORAGE_KEY);
  if (raw && raw in MOBILE_PREVIEW_FRAMES) {
    return raw as MobilePreviewSize;
  }
  return DEFAULT_MOBILE_PREVIEW_SIZE;
}

export function LivePreviewPanel({
  data,
  allVenues = [],
}: {
  data: PreviewEventData;
  allVenues?: Venue[];
}) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [mobileSize, setMobileSize] = useState<MobilePreviewSize>(
    DEFAULT_MOBILE_PREVIEW_SIZE,
  );
  const [mode, setMode] = useState<"card" | "detail">("card");
  const [fullscreen, setFullscreen] = useState(false);

  const locale = data.previewLocale ?? "nl";
  const dict = locale === "en" ? en : nl;
  const card = useMemo(() => buildCardPreviewExperience(data), [data]);

  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  useEffect(() => {
    setMobileSize(readStoredMobileSize());
  }, []);

  const selectMobileSize = useCallback((size: MobilePreviewSize) => {
    setMobileSize(size);
    localStorage.setItem(MOBILE_SIZE_STORAGE_KEY, size);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, closeFullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const mobileSizeToggle =
    viewport === "mobile" ? (
      <div className="flex rounded-full border border-border-subtle bg-cream p-0.5 text-xs">
        {(Object.keys(MOBILE_PREVIEW_FRAMES) as MobilePreviewSize[]).map(
          (key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectMobileSize(key)}
              className={`rounded-full px-2.5 py-1 ${mobileSize === key ? "bg-burgundy text-cream" : "text-wine/70"}`}
              title={MOBILE_PREVIEW_FRAMES[key].device}
            >
              {MOBILE_PREVIEW_FRAMES[key].label}
            </button>
          ),
        )}
      </div>
    ) : null;

  const viewportToggle = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-full border border-border-subtle bg-cream p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setViewport("desktop")}
          className={`rounded-full px-3 py-1 ${viewport === "desktop" ? "bg-burgundy text-cream" : "text-wine/70"}`}
        >
          Desktop
        </button>
        <button
          type="button"
          onClick={() => setViewport("mobile")}
          className={`rounded-full px-3 py-1 ${viewport === "mobile" ? "bg-burgundy text-cream" : "text-wine/70"}`}
        >
          Mobiel
        </button>
      </div>
      {mobileSizeToggle}
    </div>
  );

  const previewContent =
    mode === "card" ? (
      <div className="p-3 [&_a]:pointer-events-none">
        <ExperienceCard
          experience={card}
          statusLabels={dict.agenda.status}
          femaleOnlyBadge={dict.experiences.femaleOnlyBadge}
          reserveCta={dict.experiences.reserveCta}
          viewTableCta={dict.experiencePage.viewTableCta}
          perPersonFromLabel={dict.experiencePage.perPersonFrom}
          href="#preview"
          locale={locale}
        />
      </div>
    ) : data.eventId ? null : (
      <AdminDetailPreview data={data} allVenues={allVenues} />
    );

  const fullscreenOverlay =
    fullscreen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col bg-wine/10"
            role="dialog"
            aria-modal="true"
            aria-label="Detailpagina preview"
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-beige px-4 py-3 sm:px-6">
              <div>
                <p className="font-serif text-lg text-burgundy">
                  Detailpagina — preview
                </p>
                <p className="text-xs text-wine/55">
                  Esc of Sluiten om terug te gaan
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {viewportToggle}
                <button
                  type="button"
                  onClick={closeFullscreen}
                  className="rounded-full bg-burgundy px-5 py-2 text-sm font-medium text-cream"
                >
                  Sluiten
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto p-4 sm:p-8">
              <PreviewDeviceFrame
                mode={viewport}
                mobileSize={mobileSize}
                className="max-w-full"
                eventId={data.eventId}
                locale={locale}
                previewRevision={data.previewRevision}
              >
                {!data.eventId ? (
                  <AdminDetailPreview
                    data={data}
                    allVenues={allVenues}
                    expanded
                  />
                ) : null}
              </PreviewDeviceFrame>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {fullscreenOverlay}

      <div className="sticky top-24 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif text-lg text-burgundy">Live preview</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-border-subtle bg-cream p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("card")}
                className={`rounded-full px-3 py-1 ${mode === "card" ? "bg-burgundy text-cream" : "text-wine/70"}`}
              >
                Agenda
              </button>
              <button
                type="button"
                onClick={() => setMode("detail")}
                className={`rounded-full px-3 py-1 ${mode === "detail" ? "bg-burgundy text-cream" : "text-wine/70"}`}
              >
                Detail
              </button>
            </div>
            {viewportToggle}
            {mode === "detail" ? (
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                className="rounded-full border border-burgundy/30 px-3 py-1 text-xs font-medium text-burgundy transition-colors hover:bg-burgundy/5"
              >
                Volledig scherm
              </button>
            ) : null}
          </div>
        </div>

        <motion.div
          layout
          className="flex w-full justify-center overflow-y-auto rounded-2xl border border-border-subtle bg-wine/[0.03] p-3 shadow-lg max-h-[85vh]"
        >
          <PreviewDeviceFrame
            mode={viewport}
            mobileSize={mobileSize}
            eventId={mode === "detail" ? data.eventId : undefined}
            locale={locale}
            previewRevision={data.previewRevision}
          >
            {previewContent}
          </PreviewDeviceFrame>
          {mode === "detail" && data.eventId ? (
            <p className="text-center text-[10px] text-wine/45">
              Mobiele/desktop preview = opgeslagen versie (1:1 met website). Sla
              op om te vernieuwen.
            </p>
          ) : null}
        </motion.div>
      </div>
    </>
  );
}
