"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/lib/jouw-tafel/copy";
import { PlusIcon } from "@/components/jouw-tafel/icons";

/** Accordion: one answer open at a time, all closed at first. */
export function JouwTafelFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className="mt-9 divide-y divide-wine/10 border-y border-wine/10">
      {items.map((item, index) => {
        const isOpen = open === index;
        const buttonId = `${baseId}-q-${index}`;
        const panelId = `${baseId}-a-${index}`;
        return (
          <div key={item.q}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
                className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-serif text-[1.28rem] font-medium leading-snug text-wine transition hover:text-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {item.q}
                <span
                  aria-hidden
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-wine/15 text-burgundy transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  <PlusIcon className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pr-10 text-[1rem] leading-relaxed text-wine/70">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
