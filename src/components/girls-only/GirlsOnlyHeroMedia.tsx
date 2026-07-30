"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getGirlsOnlyHeroSlideshowImages } from "@/data/girls-only-media";

const SLIDE_INTERVAL_MS = 4000;
const HERO_SIZES =
  "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 560px";
const BACKGROUND_SIZES = "100vw";

interface GirlsOnlyHeroMediaProps {
  locale: Locale;
  /** Full-bleed behind hero copy (homepage intent router). */
  variant?: "card" | "background";
}

export function GirlsOnlyHeroMedia({
  locale,
  variant = "card",
}: GirlsOnlyHeroMediaProps) {
  const slides = getGirlsOnlyHeroSlideshowImages(locale);
  const [index, setIndex] = useState(0);
  const [slideshowEnabled, setSlideshowEnabled] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setSlideshowEnabled(!reduceMotion && slides.length > 1);
  }, [slides.length]);

  useEffect(() => {
    if (!slideshowEnabled) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slideshowEnabled, slides.length]);

  const nextIndex = slideshowEnabled ? (index + 1) % slides.length : index;
  const isBackground = variant === "background";

  const slidesNode = slides.map((slide, slideIndex) => {
    const isActive = slideIndex === index;
    const isPrefetch = slideIndex === nextIndex && slideIndex !== index;
    if (!isActive && !isPrefetch) return null;

    return (
      <Image
        key={slide.src}
        src={slide.src}
        alt={isBackground ? "" : slide.alt}
        fill
        sizes={isBackground ? BACKGROUND_SIZES : HERO_SIZES}
        priority={slideIndex === 0}
        loading={slideIndex === 0 ? "eager" : "lazy"}
        className={`object-cover transition-opacity duration-700 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
    );
  });

  if (isBackground) {
    return (
      <div className="absolute inset-0" aria-hidden>
        {slidesNode}
      </div>
    );
  }

  return (
    <figure className="relative">
      <div className="relative aspect-[16/10] max-h-[13.5rem] overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(43,13,18,0.16)] sm:aspect-[5/6] sm:max-h-none">
        {slidesNode}
        <div className="absolute inset-0 bg-gradient-to-t from-wine/35 via-transparent to-transparent" />
      </div>
    </figure>
  );
}
