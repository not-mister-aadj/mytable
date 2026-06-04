"use client";

import { motion } from "framer-motion";
import type { ExperienceVenue } from "@/i18n/types";
import { PositionedImage } from "@/components/ui/PositionedImage";

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
      className="group w-[min(85vw,320px)] shrink-0 overflow-hidden rounded-3xl border border-cream/15 bg-cream/5 shadow-sm backdrop-blur-sm"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PositionedImage
          src={venue.image}
          alt=""
          settings={venue.imageSettings}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wine/85 via-wine/45 to-wine/25" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border border-cream/35 bg-wine/45 font-serif text-3xl text-cream shadow-lg backdrop-blur-md"
            aria-hidden
          >
            ?
          </div>
        </div>
        <span className="absolute left-4 top-4 rounded-full border border-cream/25 bg-wine/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream/95 backdrop-blur-sm">
          {venue.atmosphere}
        </span>
      </div>
      <div className="border-t border-cream/10 bg-cream/95 p-5 text-wine sm:p-6">
        <h3 className="font-serif text-xl font-medium leading-snug text-burgundy sm:text-2xl">
          {venue.title ?? venue.name}
        </h3>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-wine/50">
          {venue.area}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-wine/75">
          {venue.description}
        </p>
      </div>
    </motion.article>
  );
}
