"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GirlsOnlyGalleryItem } from "@/lib/girls-only-gallery";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { PositionedImage } from "@/components/ui/PositionedImage";

interface GirlsOnlyGalleryCarouselProps {
  labels: GirlsOnlyPageLabels["gallery"];
  items: GirlsOnlyGalleryItem[];
}

const GAP_PX = 12;

function useVisibleCount() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width >= 1024) setVisibleCount(3);
      else if (width >= 640) setVisibleCount(2);
      else setVisibleCount(1);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return visibleCount;
}

function GallerySlide({
  item,
  slideWidth,
}: {
  item: GirlsOnlyGalleryItem;
  slideWidth: number;
}) {
  const sizes =
    slideWidth > 0
      ? `${Math.ceil(slideWidth)}px`
      : "(max-width: 640px) 280px, (max-width: 1024px) 360px, 320px";
  const isLocalGallery = item.src.startsWith("/girls-only/");

  return item.settings ? (
    <PositionedImage
      src={item.src}
      alt={item.alt}
      settings={item.settings}
      sizes={sizes}
      quality={90}
    />
  ) : (
    <Image
      src={item.src}
      alt={item.alt}
      fill
      className="object-cover"
      sizes={sizes}
      quality={90}
      unoptimized={isLocalGallery}
    />
  );
}

export function GirlsOnlyGalleryCarousel({
  labels,
  items,
}: GirlsOnlyGalleryCarouselProps) {
  const visibleCount = useVisibleCount();
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const count = items.length;
  const maxIndex = Math.max(0, count - visibleCount);

  useEffect(() => {
    setIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || visibleCount === 0) return;
    const totalGap = GAP_PX * (visibleCount - 1);
    setSlideWidth((track.clientWidth - totalGap) / visibleCount);
  }, [visibleCount]);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(Math.min(Math.max(next, 0), maxIndex));
    },
    [count, maxIndex],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    const node = regionRef.current;
    if (!node || count === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [count, goNext, goPrev]);

  if (count === 0) return null;

  const offset = index * (slideWidth + GAP_PX);
  const pageCount = maxIndex + 1;
  const currentPage = index + 1;

  return (
    <div
      ref={regionRef}
      className="mx-auto mt-10 w-full max-w-[280px] sm:max-w-xl md:max-w-2xl lg:max-w-4xl"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.title}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start == null || end == null) return;
        const delta = end - start;
        if (Math.abs(delta) < 40) return;
        if (delta > 0) goPrev();
        else goNext();
      }}
    >
      <div className="relative">
        <div ref={trackRef} className="overflow-hidden">
          <ul
            className="flex transition-transform duration-500 ease-out"
            style={{
              gap: `${GAP_PX}px`,
              transform:
                slideWidth > 0 ? `translate3d(-${offset}px, 0, 0)` : undefined,
            }}
          >
            {items.map((item) => (
              <li
                key={item.src}
                className="relative shrink-0 overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(43,13,18,0.08)] sm:rounded-3xl"
                style={{
                  width: slideWidth > 0 ? slideWidth : undefined,
                  aspectRatio: "3 / 4",
                }}
              >
                <GallerySlide item={item} slideWidth={slideWidth} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {pageCount > 1 ? (
        <div
          className="mt-5 flex flex-wrap items-center justify-center gap-2 px-2"
          role="tablist"
          aria-label={labels.title}
        >
          {Array.from({ length: pageCount }, (_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              role="tab"
              aria-selected={pageIndex === index}
              aria-label={`${pageIndex + 1} / ${pageCount}`}
              onClick={() => goTo(pageIndex)}
              className={`h-2 rounded-full transition-all duration-300 ${
                pageIndex === index
                  ? "w-6 bg-rose-deep"
                  : "w-2 bg-rose/35 hover:bg-rose/55"
              }`}
            />
          ))}
        </div>
      ) : null}

      <p
        className="mt-3 text-center text-sm tabular-nums text-wine/55"
        aria-live="polite"
      >
        {currentPage} / {pageCount}
      </p>
    </div>
  );
}
