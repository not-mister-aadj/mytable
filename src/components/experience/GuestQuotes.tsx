"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ExperienceGuestQuote } from "@/i18n/types";

interface GuestQuotesProps {
  title: string;
  quotes: ExperienceGuestQuote[];
}

function formatAttribution(quote: ExperienceGuestQuote): string {
  if (quote.detail) return `${quote.name}, ${quote.detail}`;
  if (quote.age) return `${quote.name}, ${quote.age}`;
  return quote.name;
}

export function GuestQuotes({ title, quotes }: GuestQuotesProps) {
  const [active, setActive] = useState(0);
  const current = quotes[active] ?? quotes[0];

  if (!current) return null;

  return (
    <section className="border-t border-border-subtle py-14 sm:py-20">
      <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>

      <div className="relative mt-10 overflow-hidden rounded-3xl border border-border-subtle bg-beige px-6 py-10 sm:px-12 sm:py-14">
        <span className="font-serif text-6xl leading-none text-gold/50" aria-hidden>
          &ldquo;
        </span>

        <AnimatePresence mode="wait">
          <motion.blockquote
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <p className="mt-2 max-w-3xl font-serif text-2xl leading-relaxed text-wine sm:text-3xl">
              {current.quote}
            </p>
            <footer className="mt-6 text-sm font-medium text-wine/55">
              {formatAttribution(current)}
            </footer>
          </motion.blockquote>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-3">
          {quotes.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === active
                  ? "w-8 bg-burgundy"
                  : "w-2 bg-burgundy/25 hover:bg-burgundy/40"
              }`}
              aria-label={`Testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
