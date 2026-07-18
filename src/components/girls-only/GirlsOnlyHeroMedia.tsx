"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getGirlsOnlyHeroSlideshowImages } from "@/data/girls-only-media";

const SLIDE_INTERVAL_MS = 4000;
const HERO_SIZES =
  "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 560px";

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

  const nextIndex = slideshowEnabled
    ? (index + 1) % slides.length
    : index;

  return (
    <figure className="relative">
      <div className="relative aspect-[16/10] max-h-[13.5rem] overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(157,77,111,0.18)] sm:aspect-[5/6] sm:max-h-none">
        {slides.map((slide, slideIndex) => {
          const isActive = slideIndex === index;
          const isPrefetch = slideIndex === nextIndex && slideIndex !== index;
          if (!isActive && !isPrefetch) return null;

          return (
            <Image
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              fill
              sizes={HERO_SIZES}
              priority={slideIndex === 0}
              loading={slideIndex === 0 ? "eager" : "lazy"}
              className={`object-cover transition-opacity duration-700 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-t from-wine/35 via-transparent to-transparent" />
      </div>
    </figure>
  );
}
