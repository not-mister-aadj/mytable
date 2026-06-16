"use client";

import { AnimatePresence, motion } from "framer-motion";
import { experiencePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { ExperienceCard } from "../ExperienceCard";

interface EventGridProps {
  grid: Dictionary["agenda"]["grid"];
  items: EnrichedExperience[];
  statusLabels: Dictionary["agenda"]["status"];
  femaleOnlyBadge: string;
  reserveCta: string;
  viewTableCta: string;
  locale: Locale;
  filterKey: string;
}

export function EventGrid({
  grid,
  items,
  statusLabels,
  femaleOnlyBadge,
  reserveCta,
  viewTableCta,
  locale,
  filterKey,
}: EventGridProps) {
  return (
    <section className="mt-16 sm:mt-20">
      <div className="max-w-2xl">
        <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
          {grid.title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-wine/65 sm:text-lg">
          {grid.subtitle}
        </p>
      </div>

      <div className="mt-6 min-h-[280px] sm:mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={filterKey}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 xl:gap-7"
          >
            {items.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: Math.min(index * 0.05, 0.25),
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <ExperienceCard
                  experience={experience}
                  statusLabels={statusLabels}
                  femaleOnlyBadge={femaleOnlyBadge}
                  reserveCta={reserveCta}
                  viewTableCta={viewTableCta}
                  href={experiencePath(locale, experience.slug)}
                  locale={locale}
                  sourceSection="agenda_grid"
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
