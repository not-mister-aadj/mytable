"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GirlsOnlyToastItem } from "@/data/girls-only-toast-notifications";
import type { TestimonialAvatar } from "@/data/testimonials";

const MAX_TOASTS = 6;
const INITIAL_DELAY_MS = 12_000;
const BETWEEN_TOASTS_MS = 40_000;
const VISIBLE_MS = 7_000;
const EXIT_MS = 320;

const avatarStyles: Record<TestimonialAvatar, string> = {
  burgundy: "bg-burgundy text-cream",
  gold: "bg-gold text-wine",
  rose: "bg-rose-deep text-cream",
  wine: "bg-wine text-cream",
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

interface TestimonialNotificationToastsProps {
  items: GirlsOnlyToastItem[];
  justNowLabel: string;
}

export function TestimonialNotificationToasts({
  items,
  justNowLabel,
}: TestimonialNotificationToastsProps) {
  const [active, setActive] = useState<GirlsOnlyToastItem | null>(null);
  const [exiting, setExiting] = useState(false);

  const queueRef = useRef<GirlsOnlyToastItem[]>([]);
  const shownCountRef = useRef(0);
  const firstTriggeredRef = useRef(false);
  const isVisibleRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    hideTimerRef.current = null;
    exitTimerRef.current = null;
    nextTimerRef.current = null;
  }, []);

  const dismissActive = useCallback(() => {
    if (!isVisibleRef.current) return;

    setExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setActive(null);
      setExiting(false);
      isVisibleRef.current = false;
      shownCountRef.current += 1;

      if (shownCountRef.current < MAX_TOASTS) {
        nextTimerRef.current = setTimeout(() => {
          showNextRef.current();
        }, BETWEEN_TOASTS_MS);
      }
    }, EXIT_MS);
  }, []);

  const showNextRef = useRef<() => void>(() => {});

  showNextRef.current = () => {
    if (
      isVisibleRef.current ||
      shownCountRef.current >= MAX_TOASTS ||
      queueRef.current.length === 0
    ) {
      return;
    }

    const next = queueRef.current.shift();
    if (!next) return;

    isVisibleRef.current = true;
    setActive(next);
    setExiting(false);

    hideTimerRef.current = setTimeout(() => {
      dismissActive();
    }, VISIBLE_MS);
  };

  const triggerFirst = useCallback(() => {
    if (firstTriggeredRef.current) return;
    firstTriggeredRef.current = true;
    showNextRef.current();
  }, []);

  useEffect(() => {
    if (items.length === 0) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    queueRef.current = shuffle(items).slice(0, MAX_TOASTS);

    const initialTimer = setTimeout(triggerFirst, INITIAL_DELAY_MS);

    const earlySections = ["how-it-works", "events"];
    const observers = earlySections
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
      .map((section) => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              triggerFirst();
              observer.disconnect();
            }
          },
          { threshold: 0.12 },
        );
        observer.observe(section);
        return observer;
      });

    return () => {
      clearTimeout(initialTimer);
      observers.forEach((observer) => observer.disconnect());
      clearTimers();
    };
  }, [items, triggerFirst, clearTimers]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 right-4 z-40 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <article
        className={`rounded-2xl border border-rose/20 bg-beige/95 p-4 shadow-[0_12px_40px_rgba(43,13,18,0.12)] backdrop-blur-sm ${
          exiting ? "animate-toast-out" : "animate-toast-in"
        }`}
      >
        <header className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold tracking-tight ${avatarStyles[active.avatar]}`}
            aria-hidden
          >
            {active.initials}
          </span>
          <div className="min-w-0 flex-1">
            {active.kind === "booking" ? (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/50">
                    {justNowLabel}
                  </p>
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-wine">
                  {active.message}
                </p>
              </>
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-wine">
                  {active.name}
                </p>
                <p className="truncate text-xs text-wine/55">{active.detail}</p>
              </>
            )}
          </div>
        </header>
        {active.kind === "review" ? (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-wine/75">
            {active.quote}
          </p>
        ) : null}
      </article>
    </div>
  );
}
