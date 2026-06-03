"use client";

import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n/types";

interface EmptyAgendaStateProps {
  empty: Dictionary["agenda"]["empty"];
  onShowAll: () => void;
}

export function EmptyAgendaState({ empty, onShowAll }: EmptyAgendaStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="col-span-full flex flex-col items-center rounded-3xl border border-dashed border-border-subtle bg-beige/50 px-6 py-16 text-center sm:py-20"
    >
      <h3 className="font-serif text-2xl font-medium text-wine sm:text-3xl">
        {empty.title}
      </h3>
      <p className="mt-3 max-w-md text-base leading-relaxed text-wine/60">
        {empty.text}
      </p>
      <button
        type="button"
        onClick={onShowAll}
        className="mt-8 rounded-full border border-burgundy/25 bg-cream px-6 py-3 text-sm font-medium text-burgundy transition-all duration-300 hover:border-burgundy/40 hover:shadow-md"
      >
        {empty.showAllCities}
      </button>
    </motion.div>
  );
}
