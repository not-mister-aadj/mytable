"use client";

import { PositionedImage } from "@/components/ui/PositionedImage";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Dictionary, ExperienceItem, ExperienceMoodContent } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import {
  canReserve,
  formatFromPerPerson,
  formatSpotsBadge,
  getSpotsLeft,
} from "@/lib/experience-booking";
import { getExperienceTagline, splitDateTime } from "@/lib/experience-detail";
import { trackBookingStarted } from "@/lib/posthog/analytics";
import { handleBookingNavClick } from "@/lib/scroll-to-booking";
import { Button } from "../ui/Button";

interface ExperienceHeroProps {
  experience: ExperienceItem;
  mood: ExperienceMoodContent;
  labels: Dictionary["experiencePage"];
  locale: Locale;
  reserveCta: string;
  femaleOnlyBadge: string;
  previewMode?: boolean;
}

export function ExperienceHero({
  experience,
  mood,
  labels,
  locale,
  reserveCta,
  femaleOnlyBadge: _femaleOnlyBadge,
  previewMode = false,
}: ExperienceHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    previewMode ? ["0%", "0%"] : ["0%", "12%"],
  );

  const tagline = getExperienceTagline(experience, mood);
  const { date, time } = splitDateTime(experience.dateTime);
  const priceLabel = formatFromPerPerson(experience.price, labels.perPersonFrom);
  const spots = getSpotsLeft(experience);
  const metaLine = [mood.dayOfWeek, date, time].filter(Boolean).join(" · ");

  return (
    <section
      ref={ref}
      className={
        previewMode
          ? "relative min-h-[min(52vh,420px)] overflow-hidden sm:min-h-[min(58vh,480px)]"
          : "relative min-h-[70svh] overflow-hidden sm:min-h-[62vh] lg:min-h-[70vh]"
      }
    >
      <motion.div className="absolute inset-0 scale-105" style={{ y: imageY }}>
        <PositionedImage
          src={experience.image}
          alt={`${experience.experienceName}, ${experience.city}`}
          settings={experience.heroImageSettings}
          priority
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-wine/95 via-wine/50 to-wine/25" />

      <div
        className={
          previewMode
            ? "relative mx-auto flex min-h-[min(52vh,420px)] max-w-7xl flex-col justify-end px-5 pb-10 pt-24 sm:min-h-[min(58vh,480px)] sm:px-8 sm:pb-12 lg:px-10"
            : "relative mx-auto flex min-h-[70svh] max-w-7xl flex-col justify-end px-5 pb-8 pt-24 sm:min-h-[62vh] sm:px-8 sm:pb-12 sm:pt-32 lg:min-h-[70vh] lg:px-10 lg:pb-16"
        }
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold"
        >
          {experience.category}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="mt-3 max-w-3xl font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-cream sm:mt-4 sm:text-5xl lg:text-6xl"
        >
          {experience.experienceName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-1.5 font-serif text-xl text-cream/90 sm:mt-2 sm:text-3xl"
        >
          {experience.city}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="mt-3 max-w-lg text-base leading-relaxed text-cream/75 sm:mt-4 sm:text-lg"
        >
          {tagline}
        </motion.p>

        {metaLine ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="mt-5 text-sm font-medium tracking-wide text-cream/85 sm:mt-6 sm:text-base"
          >
            {metaLine}
          </motion.p>
        ) : null}

        {!previewMode && experience.status !== "closed" && canReserve(experience) ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex items-center justify-between gap-4 sm:contents">
              <p className="font-serif text-2xl font-medium text-cream sm:text-3xl">
                {priceLabel}
              </p>
              <Button
                href="#booking-mobile"
                variant="primary"
                className="shrink-0 px-6 py-3 text-sm sm:px-8"
                onClick={(event) =>
                  handleBookingNavClick(event, () =>
                    trackBookingStarted(experience, locale, "hero"),
                  )
                }
              >
                {reserveCta}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-cream/65 sm:max-w-xs sm:text-sm">
              {labels.heroTrustFooter}
              {spots !== null && spots > 0 && spots <= 15 ? (
                <span className="mt-0.5 block text-gold/90">
                  {formatSpotsBadge(labels.heroSpotsHint, spots)}
                </span>
              ) : null}
            </p>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
