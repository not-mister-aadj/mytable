"use client";

import { motion } from "framer-motion";
import type { ExperienceIncludedItem } from "@/i18n/types";

interface ExperienceIncludedProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: ExperienceIncludedItem[];
  /** @deprecated Kept for call-site compatibility; styling is unified. */
  isFemaleOnly?: boolean;
}

export function ExperienceIncluded({
  eyebrow,
  title,
  subtitle,
  items,
}: ExperienceIncludedProps) {
  return (
    <section className="py-10 sm:py-14 lg:py-16">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-3 max-w-2xl font-serif text-2xl font-medium tracking-tight text-wine sm:text-4xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-3 max-w-xl text-sm leading-relaxed text-wine/60 sm:text-base"
      >
        {subtitle}
      </motion.p>

      <ul className="mt-8 divide-y divide-wine/10 border-y border-wine/10 sm:mt-10 sm:grid sm:grid-cols-4 sm:gap-6 sm:divide-y-0 sm:border-0">
        {items.map((item, index) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="flex items-baseline justify-between gap-4 py-4 sm:flex-col sm:items-start sm:justify-start sm:py-0"
          >
            <span className="font-serif text-2xl font-medium text-burgundy sm:text-4xl">
              {item.value}
            </span>
            <span className="text-right text-sm text-wine/55 sm:mt-1 sm:text-left sm:text-xs sm:font-medium sm:uppercase sm:tracking-wide">
              {item.label}
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
