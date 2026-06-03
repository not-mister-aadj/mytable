"use client";

import { motion } from "framer-motion";
import type { ExperienceFlowStep } from "@/i18n/types";

interface ExperienceFlowProps {
  title: string;
  steps: ExperienceFlowStep[];
}

export function ExperienceFlow({ title, steps }: ExperienceFlowProps) {
  return (
    <section className="rounded-3xl bg-beige/80 px-6 py-12 sm:px-10 sm:py-16">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl"
      >
        {title}
      </motion.h2>

      <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {steps.map((step, index) => (
          <motion.li
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            className="relative"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-burgundy font-serif text-lg text-cream"
              aria-hidden
            >
              {index + 1}
            </span>
            <h3 className="mt-4 font-serif text-xl font-medium text-burgundy">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-wine/75 sm:text-base">
              {step.description}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
