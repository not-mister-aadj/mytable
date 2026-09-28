"use client";

import Image from "next/image";
import { useRef } from "react";

export type DateHighlight = {
  title: string;
  body: string;
  image: { src: string; alt: string };
};

export type DateHighlights = {
  eyebrow: string;
  title: string;
  items: DateHighlight[];
  /** Labels for the desktop scroll buttons, for screen readers. */
  prevLabel: string;
  nextLabel: string;
};

export type DaySteps = {
  eyebrow: string;
  title: string;
  steps: { title: string; body: string }[];
};

export type VenueAbout = {
  eyebrow: string;
  name: string;
  body: string;
  facts: { label: string; value: string; href?: string }[];
};

const sectionEyebrow = "text-[11px] font-semibold uppercase tracking-[0.28em] text-gold";
const sectionTitle =
  "mt-3 font-serif text-2xl font-medium tracking-tight text-wine text-balance sm:text-3xl";

/** "Waarom dit een zondag wordt om te onthouden": photo cards with one
 * benefit each, in a single row that scrolls sideways so the block stays
 * compact. Swipe on phones; arrow buttons on bigger screens. */
export function SundayTableHighlights({ highlights }: { highlights: DateHighlights }) {
  const rowRef = useRef<HTMLUListElement>(null);

  function scrollRow(direction: 1 | -1) {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: "smooth" });
  }

  const arrowClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-wine/15 bg-white text-wine transition hover:border-wine/40";

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className={sectionEyebrow}>{highlights.eyebrow}</p>
          <h2 className={sectionTitle}>{highlights.title}</h2>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            aria-label={highlights.prevLabel}
            onClick={() => scrollRow(-1)}
            className={arrowClass}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={highlights.nextLabel}
            onClick={() => scrollRow(1)}
            className={arrowClass}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <ul
        ref={rowRef}
        className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {highlights.items.map((item) => (
          <li key={item.title} className="w-[62%] shrink-0 snap-start sm:w-[220px]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-beige">
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(max-width: 640px) 62vw, 220px"
                className="object-cover"
              />
            </div>
            <h3 className="mt-2.5 font-serif text-base font-medium leading-snug tracking-tight text-wine">
              {item.title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-wine/65">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StepIcon({ index }: { index: number }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (index === 0) {
    // Arrival: a clock.
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    );
  }
  if (index === 1) {
    // At the table: a wine glass.
    return (
      <svg {...common}>
        <path d="M8 3h8l-.6 5.2a3.4 3.4 0 0 1-6.8 0L8 3Z" />
        <path d="M12 11.6V19" />
        <path d="M9 21h6" />
      </svg>
    );
  }
  // Afterwards: two speech bubbles.
  return (
    <svg {...common}>
      <path d="M4 5.5h10a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 14 13.5H9l-3 2.5v-2.5H4A1.5 1.5 0 0 1 2.5 12V7A1.5 1.5 0 0 1 4 5.5Z" />
      <path d="M18 9.5h1.5A1.5 1.5 0 0 1 21 11v4.5a1.5 1.5 0 0 1-1.5 1.5H19v2l-2.5-2H12" />
    </svg>
  );
}

/** "Op de dag zelf": what the afternoon itself looks like, from walking in
 * to heading home. Booking is left out; that part is obvious. */
export function SundayTableDaySteps({ daySteps }: { daySteps: DaySteps }) {
  return (
    <section className="mt-12">
      <p className={sectionEyebrow}>{daySteps.eyebrow}</p>
      <h2 className={sectionTitle}>{daySteps.title}</h2>
      <ol className="mt-6 space-y-6">
        {daySteps.steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-wine text-cream">
              <StepIcon index={index} />
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-medium leading-snug tracking-tight text-wine">
                {step.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-wine/65">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "Over de locatie": a short story about the venue plus the practical
 * details, so nobody has to look it up before booking. */
export function SundayTableVenueAbout({ venue }: { venue: VenueAbout }) {
  return (
    <section className="rounded-[1.5rem] border border-wine/10 bg-white/70 p-6 shadow-[0_20px_50px_rgba(43,13,18,0.05)] sm:p-8">
      <p className={sectionEyebrow}>{venue.eyebrow}</p>
      <h2 className={sectionTitle}>{venue.name}</h2>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-wine/70">{venue.body}</p>
      <dl className="mt-6 grid gap-4 border-t border-wine/10 pt-5 sm:grid-cols-2">
        {venue.facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-wine/50">
              {fact.label}
            </dt>
            <dd className="mt-1 text-sm text-wine">
              {fact.href ? (
                <a
                  href={fact.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-wine/25 underline-offset-4 transition hover:decoration-wine/60"
                >
                  {fact.value}
                </a>
              ) : (
                fact.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
