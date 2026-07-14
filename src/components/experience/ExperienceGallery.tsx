"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, useReducedMotion } from "framer-motion";
import type { ImageSettings } from "@/lib/image-settings";
import { PositionedImage } from "@/components/ui/PositionedImage";

interface ExperienceGalleryProps {
  title: string;
  images: string[];
  imageSettings?: ImageSettings[];
  experienceName: string;
  isFemaleOnly?: boolean;
}

function NavButton({
  direction,
  onClick,
  className = "",
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  const label = direction === "prev" ? "Vorige foto" : "Volgende foto";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-wine/35 text-cream shadow-[0_8px_32px_rgba(43,13,18,0.25)] backdrop-blur-md transition hover:bg-wine/50 sm:h-12 sm:w-12 ${className}`}
    >
      <svg
        width="18"
        height="18"
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

function MainSlide({
  src,
  index,
  settings,
  experienceName,
  isActive,
}: {
  src: string;
  index: number;
  settings?: ImageSettings;
  experienceName: string;
  isActive: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative min-w-0 flex-[0_0_100%]">
      <div className="relative aspect-[16/10] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          key={isActive ? `active-${index}` : `idle-${index}`}
          initial={{ scale: 1 }}
          animate={{
            scale: isActive && !prefersReducedMotion ? 1.03 : 1,
          }}
          transition={{ duration: 9, ease: "linear" }}
        >
          <PositionedImage
            src={src}
            alt={`${experienceName}, ${index + 1}`}
            settings={settings}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 768px"
            priority={index === 0}
            className="object-cover"
          />
        </motion.div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine/45 via-wine/5 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-wine/10 via-transparent to-wine/10"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function ExperienceGallery({
  title,
  images: galleryImages,
  imageSettings,
  experienceName,
  isFemaleOnly = false,
}: ExperienceGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: 28,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  if (galleryImages.length === 0) return null;

  const slideCount = galleryImages.length;
  const accent = isFemaleOnly ? "text-rose-deep" : "text-gold";
  const frameShadow = isFemaleOnly
    ? "shadow-[0_32px_80px_rgba(157,77,111,0.22)]"
    : "shadow-[0_32px_80px_rgba(43,13,18,0.18)]";
  const thumbRing = isFemaleOnly ? "ring-rose-deep" : "ring-wine";
  const sectionClass = isFemaleOnly
    ? "overflow-hidden border-y border-rose/15 bg-gradient-to-b from-rose-soft/40 via-cream to-cream py-10 sm:py-16 lg:py-24"
    : "overflow-hidden border-t border-border-subtle bg-cream py-10 sm:py-16 lg:py-24";

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-[0.28em] ${accent}`}
            >
              {isFemaleOnly ? "Sfeer" : "Impressie"}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl lg:text-5xl">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-4 sm:pb-1">
            <div className="flex gap-1.5" aria-hidden>
              {galleryImages.map((src, index) => (
                <span
                  key={`progress-${src}-${index}`}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    index === selectedIndex
                      ? `w-8 ${isFemaleOnly ? "bg-rose-deep" : "bg-wine"}`
                      : "w-2 bg-wine/15"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium tabular-nums tracking-[0.2em] text-wine/45">
              {String(selectedIndex + 1).padStart(2, "0")}
              <span className="mx-1 text-wine/25">/</span>
              {String(slideCount).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-8 max-w-7xl px-5 sm:mt-10 sm:px-8 lg:mt-12 lg:px-10">
        <div
          className={`group relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] sm:max-w-4xl sm:rounded-[2rem] ${frameShadow}`}
        >
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex touch-pan-y">
              {galleryImages.map((src, index) => (
                <MainSlide
                  key={`${src}-${index}`}
                  src={src}
                  index={index}
                  settings={imageSettings?.[index]}
                  experienceName={experienceName}
                  isActive={index === selectedIndex}
                />
              ))}
            </div>
          </div>

          {slideCount > 1 ? (
            <>
              <NavButton
                direction="prev"
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 opacity-100 transition sm:left-6 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              />
              <NavButton
                direction="next"
                onClick={scrollNext}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 opacity-100 transition sm:right-6 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              />
            </>
          ) : null}
        </div>

        {slideCount > 1 ? (
          <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1 scrollbar-none sm:mt-5 sm:justify-center sm:gap-3">
            {galleryImages.map((src, index) => {
              const isActive = index === selectedIndex;
              return (
                <button
                  key={`thumb-${src}-${index}`}
                  type="button"
                  onClick={() => scrollTo(index)}
                  aria-label={`Ga naar foto ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative aspect-[16/10] w-[4.5rem] shrink-0 overflow-hidden rounded-xl transition sm:w-20 ${
                    isActive
                      ? `ring-2 ${thumbRing} ring-offset-2 ring-offset-cream`
                      : "opacity-55 hover:opacity-90"
                  }`}
                >
                  <PositionedImage
                    src={src}
                    alt=""
                    settings={imageSettings?.[index]}
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
