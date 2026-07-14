"use client";

import { motion } from "framer-motion";
import type { ExperienceFlowStep } from "@/i18n/types";

interface ExperienceFlowProps {
  eyebrow: string;
  title: string;
  expandLabel: string;
  steps: ExperienceFlowStep[];
}

function FlowStepsList({ steps }: { steps: ExperienceFlowStep[] }) {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8">
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-burgundy font-serif text-base text-cream sm:h-10 sm:w-10 sm:text-lg"
            aria-hidden
          >
            {index + 1}
          </span>
          <h3 className="mt-3 font-serif text-lg font-medium text-burgundy sm:mt-4 sm:text-xl">
            {step.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-wine/75 sm:mt-2 sm:text-base">
            {step.description}
          </p>
        </motion.li>
      ))}
    </ol>
  );
}

export function ExperienceFlow({
  eyebrow,
  title,
  expandLabel,
  steps,
}: ExperienceFlowProps) {
  return (
    <section className="rounded-2xl bg-beige/80 px-4 py-8 sm:rounded-3xl sm:px-10 sm:py-16">
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
        className="mt-2 font-serif text-2xl font-medium tracking-tight text-wine sm:text-4xl"
      >
        {title}
      </motion.h2>

      <details className="group mt-6 sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-border-subtle bg-cream/80 px-4 py-3.5 text-left marker:content-none">
          <span className="text-sm font-medium text-wine">{expandLabel}</span>
          <span
            aria-hidden
            className="text-burgundy transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </summary>
        <div className="mt-4">
          <FlowStepsList steps={steps} />
        </div>
      </details>

      <div className="mt-8 hidden sm:block sm:mt-10">
        <FlowStepsList steps={steps} />
      </div>
    </section>
  );
}
