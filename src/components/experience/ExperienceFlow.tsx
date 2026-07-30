"use client";

import { motion } from "framer-motion";
import type { ExperienceFlowStep } from "@/i18n/types";

interface ExperienceFlowProps {
  eyebrow: string;
  title: string;
  expandLabel: string;
  steps: ExperienceFlowStep[];
}

export function ExperienceFlow({
  eyebrow,
  title,
  steps,
}: ExperienceFlowProps) {
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

      <ol className="mt-8 space-y-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-10 sm:space-y-0 lg:grid-cols-3">
        {steps.map((step, index) => (
          <motion.li
            key={step.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className="border-t border-wine/10 py-5 sm:border-t-0 sm:py-0"
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold"
              aria-hidden
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 font-serif text-xl font-medium text-wine sm:text-2xl">
              {step.title}
            </h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-wine/65 sm:mt-3 sm:text-base">
              {step.description}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
