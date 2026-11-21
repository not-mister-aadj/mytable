"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

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
  "flex h-10 w-10 items-center justify-center rounded-full border border-wine/15 bg-white text-wine shadow-[0_4px_14px_rgba(43,13,18,0.08)] transition hover:border-wine/40 disabled:pointer-events-none disabled:opacity-30";

/** Every partner bar of the city, as photo cards to swipe or drag through.
 * Which ones we reserved only a member sees, in the booking card. */
export function SundayTablePartnerSelection({ selection }: { selection: PartnerSelection }) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    const first = row.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 16 : row.clientWidth;
    setActive(Math.min(selection.partners.length - 1, Math.round(row.scrollLeft / step)));
    setAtStart(row.scrollLeft <= 4);
    setAtEnd(row.scrollLeft + row.clientWidth >= row.scrollWidth - 4);
  }, [selection.partners.length]);

  useEffect(() => {
    measure();
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    for (const child of Array.from(row.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [measure]);

  if (selection.partners.length === 0) return null;

  const scrollToCard = (index: number) => {
    const row = rowRef.current;
    const card = row?.children[index] as HTMLElement | undefined;
    if (row && card) row.scrollTo({ left: card.offsetLeft - row.offsetLeft, behavior: "smooth" });
  };

  // Drag with the mouse on desktop; touch keeps its own native swipe.
  const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || !rowRef.current) return;
    drag.current = { x: e.clientX, left: rowRef.current.scrollLeft, moved: false };
    rowRef.current.style.scrollSnapType = "none";
  };
  const onPointerMove = (e: PointerEvent<HTMLUListElement>) => {
    const row = rowRef.current;
    if (!drag.current || !row) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    row.scrollLeft = drag.current.left - dx;
  };
  const endDrag = () => {
    const row = rowRef.current;
    if (!drag.current || !row) return;
    drag.current = null;
    const first = row.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 16 : row.clientWidth;
    const target = Math.round(row.scrollLeft / step) * step;
    row.scrollTo({ left: target, behavior: "smooth" });
    window.setTimeout(() => {
      if (rowRef.current) rowRef.current.style.scrollSnapType = "";
    }, 350);
  };

  const many = selection.partners.length > 1;

  return (
    <section id="partners" className="mt-12 scroll-mt-28">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{selection.eyebrow}</p>
          <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine text-balance sm:text-3xl">
            {selection.title}
          </h2>
        </div>
        {many ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label={selection.prevLabel}
              disabled={atStart}
              onClick={() => scrollToCard(Math.max(0, active - 1))}
              className={arrowClass}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={selection.nextLabel}
              disabled={atEnd}
              onClick={() => scrollToCard(Math.min(selection.partners.length - 1, active + 1))}
              className={arrowClass}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-wine/70">{selection.body}</p>

      <ul
        ref={rowRef}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          if (drag.current?.moved) e.preventDefault();
        }}
        className="-mx-5 mt-6 flex cursor-grab snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 select-none active:cursor-grabbing [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {selection.partners.map((p) => (
          <li key={p.id} className="group w-[78%] shrink-0 snap-start sm:w-[300px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-beige shadow-[0_18px_40px_rgba(43,13,18,0.14)]">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  draggable={false}
                  sizes="(max-width: 640px) 78vw, 300px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14060a]/80 via-[#14060a]/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                {p.area ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{p.area}</p>
                ) : null}
                <h3 className="mt-1.5 font-serif text-2xl font-medium leading-tight text-cream">{p.name}</h3>
                {p.atmosphere ? <p className="mt-1 text-sm text-cream/80">{p.atmosphere}</p> : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {many ? (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {selection.partners.map((p, index) => (
            <button
              key={p.id}
              type="button"
              aria-label={p.name}
              onClick={() => scrollToCard(index)}
              className={`h-1.5 rounded-full transition-all ${index === active ? "w-6 bg-wine" : "w-1.5 bg-wine/25 hover:bg-wine/45"}`}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4">
        <span aria-hidden className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-sm text-wine">
          ★
        </span>
        <p className="text-sm leading-relaxed text-wine/75">
          <span className="font-semibold text-wine">{selection.memberTitle}</span> {selection.memberBody}{" "}
          <a
            href={selection.memberHref}
            className="whitespace-nowrap font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
          >
            {selection.memberCta} →
          </a>
        </p>
      </div>
    </section>
  );
}
