"use client";

import { motion } from "framer-motion";
import { PositionedImage } from "@/components/ui/PositionedImage";
import type { ExperienceVenue } from "@/i18n/types";

interface VenueLineupProps {
  title: string;
  subtitle: string;
  venues: ExperienceVenue[];
}

export function VenueLineup({ title, subtitle, venues }: VenueLineupProps) {
  return (
    <section className="border-y border-border-subtle bg-wine py-16 text-cream sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="max-w-2xl font-serif text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream/75 sm:text-lg">
            {subtitle}
          </p>
        </motion.div>

        <div className="-mx-5 mt-12 flex gap-5 overflow-x-auto px-5 pb-2 scrollbar-none sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
          {venues.map((venue, index) => (
            <motion.article
              key={venue.name}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group w-[min(85vw,320px)] shrink-0 overflow-hidden rounded-3xl border border-cream/10 bg-cream/5 backdrop-blur-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <PositionedImage
                  src={venue.image}
                  alt={venue.name}
                  settings={venue.imageSettings}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="320px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-wine/70 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-cream/25 bg-wine/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream/90 backdrop-blur-sm">
                  {venue.atmosphere}
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="font-serif text-2xl font-medium text-cream">
                  {venue.name}
                </h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gold">
                  {venue.area}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-cream/70">
                  {venue.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
