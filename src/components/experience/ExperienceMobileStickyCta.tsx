"use client";

import { useEffect, useState, type RefObject } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary, ExperienceItem } from "@/i18n/types";
import { canReserve, formatPerPerson } from "@/lib/experience-booking";
import { resolveFemaleOnly } from "@/lib/event-extras";
import { trackBookingStarted } from "@/lib/posthog/analytics";
import { Button } from "../ui/Button";

interface ExperienceMobileStickyCtaProps {
  experience: ExperienceItem;
  labels: Dictionary["experiencePage"];
  reserveCta: string;
  locale: Locale;
  bookingRef: RefObject<HTMLElement | null>;
}

export function ExperienceMobileStickyCta({
  experience,
  labels,
  reserveCta,
  locale,
  bookingRef,
}: ExperienceMobileStickyCtaProps) {
  const [bookingInView, setBookingInView] = useState(false);
  const isSoldOut = !canReserve(experience);
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );
  const priceLine = formatPerPerson(experience.price, labels.perPerson);

  useEffect(() => {
    const booking = bookingRef.current;
    if (!booking) return;

    const observer = new IntersectionObserver(
      ([entry]) => setBookingInView(entry.isIntersecting),
      { root: null, rootMargin: "0px 0px -72px 0px", threshold: 0.08 },
    );

    observer.observe(booking);
    return () => observer.disconnect();
  }, [bookingRef]);

  if (bookingInView) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[48] border-t shadow-[0_-10px_32px_rgba(43,13,18,0.12)] backdrop-blur-md lg:hidden ${
        isFemaleOnly
          ? "border-rose/25 bg-rose-soft/95"
          : "border-border-subtle bg-cream/95"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="region"
      aria-label={reserveCta}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p
            className={`font-serif text-base font-medium leading-tight ${
              isFemaleOnly ? "text-rose-deep" : "text-burgundy"
            }`}
          >
            {priceLine}
          </p>
          <p className="truncate text-xs text-wine/60">
            {experience.experienceName}
          </p>
        </div>
        <Button
          href="#booking"
          variant="primary"
          onClick={() => trackBookingStarted(experience, locale, "mobile_sticky")}
          className={`shrink-0 px-5 py-2.5 text-sm ${
            isSoldOut ? "pointer-events-none opacity-50" : ""
          } ${isFemaleOnly ? "bg-rose hover:bg-rose-deep" : ""}`}
        >
          {reserveCta}
        </Button>
      </div>
    </div>
  );
}
