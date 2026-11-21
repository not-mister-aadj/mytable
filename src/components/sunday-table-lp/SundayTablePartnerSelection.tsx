"use client";

import Image from "next/image";
import { useRef } from "react";
export type PartnerSelection = {
  eyebrow: string;
  title: string;
  body: string;
  memberTitle: string;
  memberBody: string;
  memberCta: string;
  memberHref: string;
  prevLabel: string;
  nextLabel: string;
  partners: { id: string; name: string; area: string | null; atmosphere: string | null; imageUrl: string | null }[];
};

const arrowClass =
  "flex h-9 w-9 items-center justify-center rounded-full border border-wine/15 bg-white text-wine transition hover:border-wine/40";

/** Every partner bar of the city, as a row to swipe through (like the
 * highlights). Which ones we reserved only a member sees, in the booking card. */
export function SundayTablePartnerSelection({ selection }: { selection: PartnerSelection }) {
  const rowRef = useRef<HTMLUListElement>(null);
  if (selection.partners.length === 0) return null;
  const scrollRow = (direction: 1 | -1) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <section id="partners" className="mt-10 scroll-mt-28">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{selection.eyebrow}</p>
          <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine text-balance sm:text-3xl">{selection.title}</h2>
        </div>
        {selection.partners.length > 2 ? (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button type="button" aria-label={selection.prevLabel} onClick={() => scrollRow(-1)} className={arrowClass}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button type="button" aria-label={selection.nextLabel} onClick={() => scrollRow(1)} className={arrowClass}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-wine/70">{selection.body}</p>
      <ul
        ref={rowRef}
        className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {selection.partners.map((p) => (
          <li key={p.id} className="w-[62%] shrink-0 snap-start sm:w-[220px]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-beige">
              {p.imageUrl ? (
                <Image src={p.imageUrl} alt={p.name} fill sizes="(max-width: 640px) 62vw, 220px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center font-serif text-xl text-wine/40">{p.name}</div>
              )}
            </div>
            <h3 className="mt-2.5 font-serif text-base font-medium leading-snug tracking-tight text-wine">{p.name}</h3>
            <p className="mt-0.5 text-[13px] leading-relaxed text-wine/65">{[p.area, p.atmosphere].filter(Boolean).join(" · ")}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-wine/70">
        <span className="font-semibold text-wine">{selection.memberTitle}</span> {selection.memberBody}{" "}
        <a
          href={selection.memberHref}
          className="font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
        >
          {selection.memberCta}
        </a>
      </p>
    </section>
  );
}
