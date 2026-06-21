"use client";

import { useEffect, useRef, useState } from "react";
import { girlsOnlyHeroMedia } from "@/data/girls-only-media";

interface GirlsOnlyHeroMediaProps {
  alt: string;
  editionBadge: string;
  editionTitle: string;
  editionNote: string;
}

export function GirlsOnlyHeroMedia({
  alt,
  editionBadge,
  editionTitle,
  editionNote,
}: GirlsOnlyHeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setEnabled(!reduceMotion);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  }, [enabled]);

  return (
    <figure className="relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(157,77,111,0.18)] sm:aspect-[5/6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={girlsOnlyHeroMedia.posterSrc}
          alt={alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            enabled ? "opacity-0" : "opacity-100"
          }`}
        />
        {enabled ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={girlsOnlyHeroMedia.posterSrc}
            aria-label={alt}
          >
            <source src={girlsOnlyHeroMedia.videoSrc} type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-wine/70 via-wine/10 to-transparent" />
        <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <span className="inline-block rounded-full border border-cream/25 bg-cream/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-deep backdrop-blur-sm">
            {editionBadge}
          </span>
          <p className="mt-2.5 font-serif text-xl font-medium leading-tight text-cream sm:text-2xl">
            {editionTitle}
          </p>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-cream/85 sm:text-sm">
            {editionNote}
          </p>
        </figcaption>
      </div>
    </figure>
  );
}
