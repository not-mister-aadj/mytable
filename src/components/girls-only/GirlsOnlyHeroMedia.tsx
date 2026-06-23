"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getGirlsOnlyHeroSlideshowImages } from "@/data/girls-only-media";

const SLIDE_INTERVAL_MS = 4000;

interface GirlsOnlyHeroMediaProps {
  locale: Locale;
}

export function GirlsOnlyHeroMedia({ locale }: GirlsOnlyHeroMediaProps) {
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

  return (
    <figure className="relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(157,77,111,0.18)] sm:aspect-[5/6]">
        {slides.map((slide, slideIndex) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              slideIndex === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-wine/35 via-transparent to-transparent" />
      </div>
    </figure>
  );
}
