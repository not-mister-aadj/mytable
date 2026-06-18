"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import { canReserve, formatPerPerson } from "@/lib/experience-booking";
import { splitDateTime } from "@/lib/experience-detail";
import {
  displayAtmosphereTags,
  resolveFemaleOnly,
} from "@/lib/event-extras";
import { trackBookingStarted } from "@/lib/posthog/analytics";
import { Button } from "../ui/Button";

interface ExperienceStickyBookingBarProps {
  experience: ExperienceItem;
  labels: Dictionary["experiencePage"];
  reserveCta: string;
  femaleOnlyBadge: string;
  locale: Locale;
  sentinelRef: RefObject<HTMLElement | null>;
  bookingRef?: RefObject<HTMLElement | null>;
}

function MetaItem({
  icon,
  children,
}: {
  icon: "calendar" | "clock" | "price";
  children: ReactNode;
}) {
  const className = "h-3.5 w-3.5 shrink-0 text-gold/90";
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon === "calendar" ? (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      ) : icon === "clock" ? (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2.5 1.5" />
        </svg>
      ) : (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        </svg>
      )}
      <span>{children}</span>
    </span>
  );
}

export function ExperienceStickyBookingBar({
  experience,
  labels,
  reserveCta,
  femaleOnlyBadge,
  locale,
  sentinelRef,
  bookingRef,
}: ExperienceStickyBookingBarProps) {
  const [heroPast, setHeroPast] = useState(false);
  const [bookingInView, setBookingInView] = useState(false);
  const { date, time } = splitDateTime(experience.dateTime);
  const priceLine = formatPerPerson(experience.price, labels.perPerson);
  const isSoldOut = !canReserve(experience);
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );
  const visibleTags = displayAtmosphereTags(
    experience.atmosphereTags,
    experience.femaleOnly,
  );
  const hasTags = isFemaleOnly || visibleTags.length > 0;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroPast(!entry.isIntersecting),
      { root: null, rootMargin: "0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);

  useEffect(() => {
    const booking = bookingRef?.current;
    if (!booking) return;

    const observer = new IntersectionObserver(
      ([entry]) => setBookingInView(entry.isIntersecting),
      { root: null, rootMargin: "-4rem 0px 0px 0px", threshold: 0.15 },
    );

    observer.observe(booking);
    return () => observer.disconnect();
  }, [bookingRef]);

  const visible = heroPast && !bookingInView;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="sticky-booking"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed inset-x-0 top-[4.25rem] z-[48] border-b shadow-sm backdrop-blur-md ${
            isFemaleOnly
              ? "border-rose/25 bg-rose-soft/95"
              : "border-border-subtle bg-cream/95"
          }`}
          role="region"
          aria-label={experience.experienceName}
        >
          <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-8 sm:py-3 lg:px-10">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-[15px] font-medium leading-tight text-wine sm:text-base">
                  {experience.experienceName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-wine/70 sm:text-[13px]">
                  <MetaItem icon="calendar">{date}</MetaItem>
                  {time ? (
                    <>
                      <span className="hidden text-wine/20 sm:inline" aria-hidden>
                        |
                      </span>
                      <MetaItem icon="clock">{time}</MetaItem>
                    </>
                  ) : null}
                  <span className="hidden text-wine/20 sm:inline" aria-hidden>
                    |
                  </span>
                  <MetaItem icon="price">{priceLine}</MetaItem>
                </div>
                {hasTags ? (
                  <ul className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {isFemaleOnly ? (
                      <li className="rounded-full bg-rose px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream sm:text-xs">
                        {femaleOnlyBadge}
                      </li>
                    ) : null}
                    {visibleTags.map((tag) => (
                      <li
                        key={tag}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium sm:text-xs ${
                          isFemaleOnly
                            ? "bg-rose/15 text-rose-deep"
                            : "bg-wine/8 text-wine/75"
                        }`}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <Button
                href="#booking"
                variant="primary"
                onClick={() =>
                  trackBookingStarted(experience, locale, "sticky_bar")
                }
                className={`w-full shrink-0 px-5 py-2.5 text-sm sm:w-auto ${
                  isSoldOut ? "pointer-events-none opacity-50" : ""
                } ${isFemaleOnly ? "bg-rose hover:bg-rose-deep" : ""}`}
              >
                {reserveCta}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
