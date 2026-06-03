"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Dictionary } from "@/i18n/types";

type FeaturedCard = Dictionary["featuredCarousel"]["cards"][number];

interface FeaturedTablesCarouselProps {
  dict: Dictionary["featuredCarousel"];
}

const CARD_ICONS: Record<FeaturedCard["icon"], ReactNode> = {
  wine: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M8 2h8v2l-1.2 9.5a4 4 0 0 1-3.8 3.5H13a4 4 0 0 1-3.8-3.5L8 4V2zm2 2v1.9l.9 7.1h2.2l.9-7.1V4h-4z" />
    </svg>
  ),
  dinner: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M8 3v8a4 4 0 0 0 4 4v6h2v-6a4 4 0 0 0 4-4V3h-2v7a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V3H8zm8 0V2h2v1h-2z" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M4 8h16v2H4V8zm2 4h12v8h-2v-6H8v6H6v-8z" />
    </svg>
  ),
  walk: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M13.5 5.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM9.2 9.9l-2.1 8.6 1.9.5 1.5-6 1.2 1.2v6.8h2v-7.9l-1.8-1.8 1.1-4.4H9.2z" />
    </svg>
  ),
  mystery: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17l.9-5.4L4.2 7.7l5.4-.8L12 2z" />
    </svg>
  ),
};

function CarouselCard({ card }: { card: FeaturedCard }) {
  return (
    <article className="group relative h-[380px] w-[220px] shrink-0 overflow-hidden rounded-[1.5rem] shadow-[0_16px_40px_rgba(43,13,18,0.14)] transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_24px_50px_rgba(43,13,18,0.2)] sm:h-[500px] sm:w-[300px] sm:rounded-[1.75rem]">
      <Image
        src={card.image}
        alt={card.title}
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        sizes="(max-width: 640px) 220px, 300px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-wine/90 via-wine/25 to-wine/5 transition-opacity duration-500 group-hover:from-wine/85 group-hover:via-wine/20" />

      <div className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 bg-cream/15 text-cream backdrop-blur-md">
        {CARD_ICONS[card.icon]}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold sm:text-xs">
          {card.category}
        </p>
        <h3 className="mt-2 font-serif text-xl font-medium leading-tight text-cream sm:text-2xl">
          {card.title}
        </h3>
        <p className="mt-2 text-sm text-cream/85">
          {card.city} · {card.date}
        </p>
        {card.caption && (
          <p className="mt-3 text-sm leading-relaxed text-cream/70 opacity-90 transition-opacity duration-500 group-hover:text-cream/90">
            {card.caption}
          </p>
        )}
      </div>
    </article>
  );
}

export function FeaturedTablesCarousel({ dict }: FeaturedTablesCarouselProps) {
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: true,
      containScroll: false,
    },
    [
      AutoScroll({
        speed: 0.65,
        startDelay: 0,
        stopOnMouseEnter: true,
        stopOnInteraction: false,
        playOnInit: true,
      }),
    ],
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("reInit", onSelect).on("select", onSelect);
    return () => {
      emblaApi.off("reInit", onSelect).off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const slides = [...dict.cards, ...dict.cards];

  return (
    <section className="overflow-hidden bg-cream py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {dict.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl lg:text-5xl">
            {dict.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-wine/75 sm:text-lg">
            {dict.subtitle}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-12 sm:mt-14"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-cream to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-cream to-transparent sm:w-24" />

        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Vorige tafels"
          className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-cream/90 text-burgundy shadow-md backdrop-blur-sm transition-all hover:bg-cream hover:shadow-lg disabled:opacity-40 lg:flex"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Volgende tafels"
          className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-subtle bg-cream/90 text-burgundy shadow-md backdrop-blur-sm transition-all hover:bg-cream hover:shadow-lg disabled:opacity-40 lg:flex"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y gap-4 pl-5 sm:gap-5 sm:pl-8 lg:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))]">
            {slides.map((card, index) => (
              <CarouselCard key={`${card.id}-${index}`} card={card} />
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mt-10 flex justify-center px-5 sm:mt-12"
      >
        <Link
          href="#experiences"
          className="group inline-flex items-center gap-2.5 rounded-full border border-burgundy/25 bg-beige px-6 py-3 text-sm font-medium text-burgundy transition-all duration-300 hover:border-burgundy/40 hover:bg-cream hover:shadow-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy/10 text-burgundy transition-colors group-hover:bg-burgundy group-hover:text-cream">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path d="M4 8h16M4 12h12M4 16h8" strokeLinecap="round" />
            </svg>
          </span>
          <span>{dict.cta}</span>
          <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
            →
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
