"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { getGirlsOnlyHeroSlideshowImages } from "@/data/girls-only-media";

const SLIDE_INTERVAL_MS = 4500;
const PAUSE_AFTER_INTERACT_MS = 10000;
const MAIN_SIZES =
  "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 560px";

function NavButton({
  direction,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-wine/40 text-cream shadow-[0_8px_24px_rgba(43,13,18,0.22)] backdrop-blur-md transition hover:bg-wine/55 sm:flex sm:h-10 sm:w-10 ${
        direction === "prev" ? "left-3 sm:left-4" : "right-3 sm:right-4"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {direction === "prev" ? (
          <path d="M15 18l-6-6 6-6" />
        ) : (
          <path d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  );
}

export function SundayTableHeroGallery({ locale }: { locale: Locale }) {
  const slides = getGirlsOnlyHeroSlideshowImages(locale);
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const isEn = locale === "en";

  const pauseAutoplay = useCallback(() => {
    setPausedUntil(Date.now() + PAUSE_AFTER_INTERACT_MS);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      setIndex(((next % slides.length) + slides.length) % slides.length);
      pauseAutoplay();
    },
    [pauseAutoplay, slides.length],
  );

  useEffect(() => {
    if (reduceMotion || slides.length < 2) return;

    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil) return;
      setIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [pausedUntil, reduceMotion, slides.length]);

  if (slides.length === 0) return null;

  const active = slides[index]!;

  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="relative mx-auto aspect-[5/4] max-h-[14.5rem] w-full max-w-full overflow-hidden rounded-[1.5rem] shadow-[0_28px_70px_rgba(43,13,18,0.14)] sm:aspect-[4/5] sm:max-h-[28rem] sm:max-w-lg sm:rounded-[2.5rem] lg:mx-0 lg:max-h-none lg:min-h-[34rem] lg:max-w-none lg:aspect-auto lg:rounded-[3rem]">
        {slides.map((slide, slideIndex) => {
          const isActive = slideIndex === index;
          const isPrefetch =
            slideIndex === (index + 1) % slides.length && slideIndex !== index;
          if (!isActive && !isPrefetch) return null;

          return (
            <Image
              key={slide.src}
              src={slide.src}
              alt={isActive ? slide.alt : ""}
              fill
              sizes={MAIN_SIZES}
              priority={slideIndex === 0}
              loading={slideIndex === 0 ? "eager" : "lazy"}
              className={`object-cover transition-opacity duration-700 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine/25 via-transparent to-transparent"
          aria-hidden
        />

        {slides.length > 1 ? (
          <>
            <NavButton
              direction="prev"
              onClick={() => goTo(index - 1)}
              label={isEn ? "Previous photo" : "Vorige foto"}
            />
            <NavButton
              direction="next"
              onClick={() => goTo(index + 1)}
              label={isEn ? "Next photo" : "Volgende foto"}
            />
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div
          className="mt-2.5 -mx-0.5 max-w-full min-w-0 overflow-x-auto px-0.5 pb-1 scrollbar-none sm:mt-4"
          role="tablist"
          aria-label={isEn ? "Photo previews" : "Foto-voorbeelden"}
        >
          <div className="flex w-max gap-1.5 sm:gap-2.5">
            {slides.map((slide, slideIndex) => {
              const isActive = slideIndex === index;
              return (
                <button
                  key={slide.src}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={
                    isEn
                      ? `Show photo ${slideIndex + 1}`
                      : `Toon foto ${slideIndex + 1}`
                  }
                  onClick={() => goTo(slideIndex)}
                  className={`relative aspect-square w-10 shrink-0 overflow-hidden rounded-md transition sm:w-14 sm:rounded-lg ${
                    isActive
                      ? "ring-2 ring-wine ring-offset-1 ring-offset-white sm:ring-offset-2"
                      : "opacity-55 hover:opacity-90"
                  }`}
                >
                  <Image
                    src={slide.src}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {active.alt}
      </p>
    </div>
  );
}
