"use client";

import { useState } from "react";

export type InviteRulesSection = { title: string; lines: string[] };

/** The "i" next to the title: every rule of the invite system in one sheet. */
export function InviteRulesInfo({ sections }: { sections: InviteRulesSection[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Regels"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-burgundy/30 font-serif text-sm italic text-burgundy hover:bg-burgundy/5"
      >
        i
      </button>
      {open ? (
        <div role="dialog" aria-modal="true" aria-labelledby="invite-rules-title" className="fixed inset-0 z-50 flex items-center justify-center bg-wine/40 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-beige p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <p id="invite-rules-title" className="font-serif text-2xl text-burgundy">
                Regels
              </p>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-wine/60">
                Sluiten
              </button>
            </div>
            <div className="mt-4 space-y-5">
              {sections.map((section) => (
                <section key={section.title}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/50">{section.title}</p>
                  <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-wine/85">
                    {section.lines.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span aria-hidden className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-gold" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
