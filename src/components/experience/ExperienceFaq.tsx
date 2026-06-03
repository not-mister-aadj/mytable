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
    <section className="border-t border-border-subtle py-14 sm:py-20">
      <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <ul className="mt-10 divide-y divide-border-subtle rounded-3xl border border-border-subtle bg-beige/50">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <li key={item.question}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-cream/50"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
              >
                <span className="font-medium text-wine">{item.question}</span>
                <span
                  className="shrink-0 font-serif text-xl text-burgundy transition-transform duration-300"
                  aria-hidden
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen ? (
                <p className="border-t border-border-subtle/60 px-6 pb-5 pt-0 text-base leading-relaxed text-wine/70">
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
