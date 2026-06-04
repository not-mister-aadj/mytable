"use client";

import { useMemo, useState } from "react";
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

  const locale = data.previewLocale ?? "nl";
  const dict = locale === "en" ? en : nl;
  const card = useMemo(() => buildCardPreviewExperience(data), [data]);

  const widthClass = viewport === "mobile" ? "w-[320px]" : "w-full";

  return (
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
  );
}
