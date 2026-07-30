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
  perPersonFromLabel: string;
  locale: Locale;
  filterKey: string;
  /** Query string without `?` for experience deep links (e.g. from=sunday-table). */
  linkQuery?: string;
}

export function EventGrid({
  grid,
  items,
  statusLabels,
  femaleOnlyBadge,
  reserveCta,
  viewTableCta,
  perPersonFromLabel,
  locale,
  filterKey,
  linkQuery = "",
}: EventGridProps) {
  return (
    <section className="mt-8 sm:mt-10">
      <div>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-[1.75rem]">
          {grid.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-wine/55">
          {grid.subtitle}
        </p>
      </div>

      <div className="mt-5 min-h-[240px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={filterKey}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
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
                  perPersonFromLabel={perPersonFromLabel}
                  href={`${experiencePath(locale, experience.slug)}${
                    linkQuery ? `?${linkQuery}` : ""
                  }`}
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
