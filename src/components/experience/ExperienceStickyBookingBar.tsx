"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import { canReserve, formatPerPerson } from "@/lib/experience-booking";
import { splitDateTime } from "@/lib/experience-detail";
import { Button } from "../ui/Button";

interface ExperienceStickyBookingBarProps {
  experience: ExperienceItem;
  labels: Dictionary["experiencePage"];
  reserveCta: string;
  sentinelRef: RefObject<HTMLElement | null>;
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
  sentinelRef,
}: ExperienceStickyBookingBarProps) {
  const [visible, setVisible] = useState(false);
  const { date, time } = splitDateTime(experience.dateTime);
  const priceLine = formatPerPerson(experience.price, labels.perPerson);
  const isSoldOut = !canReserve(experience);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { root: null, rootMargin: "0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="sticky-booking"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 top-[4.25rem] z-[48] border-b border-border-subtle bg-cream/95 shadow-sm backdrop-blur-md"
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
              </div>

              <Button
                href="#booking"
                variant="primary"
                className={`w-full shrink-0 px-5 py-2.5 text-sm sm:w-auto ${
                  isSoldOut ? "pointer-events-none opacity-50" : ""
                }`}
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
