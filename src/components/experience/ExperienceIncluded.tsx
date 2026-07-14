"use client";

import { motion } from "framer-motion";
import type { ExperienceIncludedItem } from "@/i18n/types";

interface ExperienceIncludedProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: ExperienceIncludedItem[];
  isFemaleOnly?: boolean;
}

export function ExperienceIncluded({
  eyebrow,
  title,
  subtitle,
  items,
  isFemaleOnly = false,
}: ExperienceIncludedProps) {
  const accent = isFemaleOnly ? "text-rose-deep" : "text-burgundy";
  const cardBg = isFemaleOnly ? "border-rose/15 bg-rose/5" : "border-border-subtle bg-beige/80";

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-xs font-semibold uppercase tracking-[0.24em] text-wine/45"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-2 max-w-2xl font-serif text-2xl font-medium tracking-tight text-wine sm:text-4xl"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-3 max-w-2xl text-sm leading-relaxed text-wine/65 sm:text-base"
      >
        {subtitle}
      </motion.p>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-4 sm:gap-4">
        {items.map((item, index) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className={`rounded-2xl border px-4 py-5 text-center sm:rounded-3xl sm:px-5 sm:py-6 ${cardBg}`}
          >
            <span className={`block font-serif text-3xl font-medium sm:text-4xl ${accent}`}>
              {item.value}
            </span>
            <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-wine/55 sm:text-sm">
              {item.label}
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
