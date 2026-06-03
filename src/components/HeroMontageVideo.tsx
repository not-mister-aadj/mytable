"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { heroMontage } from "@/data/videos";
import { images } from "@/data/images";

const FADE_MS = 600;
const POSTER = images.restaurantDining;

interface HeroMontageVideoProps {
  alt: string;
}

export function HeroMontageVideo({ alt }: HeroMontageVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [clipIndex, setClipIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setEnabled(!reduceMotion);
  }, []);

  const advance = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => {
      setClipIndex((i) => (i + 1) % heroMontage.length);
      setVisible(true);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    video.load();
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  }, [clipIndex, enabled]);

  const clip = heroMontage[clipIndex];

  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={enabled ? clip.poster : POSTER}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          enabled ? "opacity-0" : "opacity-100"
        }`}
      />
      {enabled ? (
        <video
          ref={videoRef}
          key={clip.src}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          playsInline
          preload="metadata"
          poster={clip.poster}
          aria-label={alt}
          onEnded={advance}
        >
          <source src={clip.src} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
