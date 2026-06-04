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

export function LivePreviewPanel({
  data,
  allVenues = [],
}: {
  data: PreviewEventData;
  allVenues?: Venue[];
}) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [mode, setMode] = useState<"card" | "detail">("card");
  const [fullscreen, setFullscreen] = useState(false);

  const locale = data.previewLocale ?? "nl";
  const dict = locale === "en" ? en : nl;
  const card = useMemo(() => buildCardPreviewExperience(data), [data]);

  const widthClass = viewport === "mobile" ? "mx-auto w-[320px]" : "w-full";

  const closeFullscreen = useCallback(() => setFullscreen(false), []);

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

  const viewportToggle = (
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
        Mobile
      </button>
    </div>
  );

  const fullscreenOverlay =
    fullscreen && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex flex-col bg-cream"
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
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                className={
                  viewport === "mobile"
                    ? "mx-auto w-full max-w-[390px] shadow-xl"
                    : "w-full"
                }
              >
                <AdminDetailPreview
                  data={data}
                  allVenues={allVenues}
                  expanded
                />
              </div>
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
          <div className="flex flex-wrap gap-2">
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
          className={`max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-border-subtle bg-cream shadow-lg ${widthClass}`}
        >
          {mode === "card" ? (
            <div className="p-3 [&_a]:pointer-events-none">
              <ExperienceCard
                experience={card}
                statusLabels={dict.agenda.status}
                femaleOnlyBadge={dict.experiences.femaleOnlyBadge}
                reserveCta={dict.experiences.reserveCta}
                viewTableCta={dict.experiencePage.viewTableCta}
                href="#preview"
              />
            </div>
          ) : (
            <AdminDetailPreview data={data} allVenues={allVenues} />
          )}
        </motion.div>
      </div>
    </>
  );
}
