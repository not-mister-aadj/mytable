"use client";

import { motion } from "framer-motion";
import type { ExperienceVenue } from "@/i18n/types";

export function LocationTbdVenueCard({
  venue,
  index,
}: {
  venue: ExperienceVenue;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="w-[min(85vw,320px)] shrink-0 overflow-hidden rounded-3xl border border-cream/15 bg-cream text-wine shadow-sm"
    >
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-gradient-to-br from-beige via-cream to-rose-soft/30 px-6">
        <div className="flex items-end gap-2" aria-hidden>
          <span className="font-serif text-5xl font-medium text-burgundy/80">
            ?
          </span>
          <span className="font-serif text-4xl font-medium text-gold/90">?</span>
          <span className="font-serif text-3xl font-medium text-rose-deep/70">
            ?
          </span>
        </div>
        <span className="rounded-full border border-wine/15 bg-cream/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-wine/60">
          {venue.atmosphere}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <h3 className="font-serif text-xl font-medium leading-snug text-burgundy sm:text-2xl">
          {venue.title ?? venue.name}
        </h3>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-wine/50">
          {venue.area}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-wine/70">
          {venue.description}
        </p>
      </div>
    </motion.article>
  );
}
