"use client";

import { useState } from "react";
import type { ExperienceFaqItem } from "@/i18n/types";

interface ExperienceFaqProps {
  title: string;
  items: ExperienceFaqItem[];
}

export function ExperienceFaq({ title, items }: ExperienceFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-border-subtle py-8 sm:py-14 lg:py-20">
      <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <ul className="mt-6 divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-beige/50 sm:mt-10 sm:rounded-3xl">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <li key={item.question}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-cream/50 sm:gap-4 sm:px-6 sm:py-5"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-wine sm:text-base">{item.question}</span>
                <span
                  className="shrink-0 font-serif text-xl text-burgundy transition-transform duration-300"
                  aria-hidden
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <p className="border-t border-border-subtle/60 px-4 pb-4 pt-0 text-sm leading-relaxed text-wine/70 sm:px-6 sm:pb-5 sm:text-base">
                  {item.answer}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
