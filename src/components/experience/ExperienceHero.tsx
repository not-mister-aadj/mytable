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
import {
  displayAtmosphereTags,
  resolveFemaleOnly,
} from "@/lib/event-extras";
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
  femaleOnlyBadge,
  previewMode = false,
}: ExperienceHeroProps) {
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );
  const visibleTags = displayAtmosphereTags(
    experience.atmosphereTags,
    experience.femaleOnly,
  );
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

  const pills = [
    mood.dayOfWeek,
    mood.partOfDay,
    date,
    time,
    priceLabel,
    labels.pillSoloTogether,
  ].filter(Boolean);

  return (
    <section
      ref={ref}
      className={
        previewMode
          ? "relative min-h-[min(52vh,420px)] overflow-hidden sm:min-h-[min(58vh,480px)]"
          : "relative min-h-[48vh] overflow-hidden sm:min-h-[62vh] lg:min-h-[70vh]"
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
      <div className="absolute inset-0 bg-gradient-to-t from-wine/92 via-wine/55 to-wine/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-wine/65 via-wine/25 to-transparent" />

      <div
        className={
          previewMode
            ? "relative mx-auto flex min-h-[min(52vh,420px)] max-w-7xl flex-col justify-end px-5 pb-10 pt-24 sm:min-h-[min(58vh,480px)] sm:px-8 sm:pb-12 lg:px-10"
            : "relative mx-auto flex min-h-[48vh] max-w-7xl flex-col justify-end px-5 pb-8 pt-24 sm:min-h-[62vh] sm:px-8 sm:pb-12 sm:pt-32 lg:min-h-[70vh] lg:pb-16 lg:px-10"
        }
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden text-xs font-medium tracking-wide text-cream/85 sm:block"
        >
          {labels.heroTrustBar}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-gold sm:mt-6"
        >
          {experience.category}
        </motion.p>

        {isFemaleOnly ? (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mt-4 w-fit self-start rounded-full bg-rose px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-cream shadow-sm"
          >
            {femaleOnlyBadge}
          </motion.span>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-2 max-w-3xl font-serif text-3xl font-medium leading-[1.08] tracking-tight text-cream sm:mt-3 sm:text-5xl lg:text-6xl"
        >
          {experience.experienceName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-1 font-serif text-xl text-cream/90 sm:mt-2 sm:text-3xl"
        >
          {experience.city}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3 line-clamp-2 max-w-xl text-base leading-relaxed text-cream/80 sm:mt-4 sm:line-clamp-none sm:text-xl"
        >
          {tagline}
        </motion.p>

        {labels.heroBenefitBullets.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            className="mt-4 max-w-xl space-y-2"
          >
            {labels.heroBenefitBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2 text-sm leading-snug text-cream/85 sm:text-base"
              >
                <span className="mt-0.5 shrink-0 text-gold" aria-hidden>
                  ✓
                </span>
                {bullet}
              </li>
            ))}
          </motion.ul>
        ) : null}

        {visibleTags.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2"
          >
            {visibleTags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-cream"
              >
                {tag}
              </li>
            ))}
          </motion.ul>
        ) : null}

        <motion.ul
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2"
        >
          {pills.map((pill) => (
            <li
              key={pill}
              className="rounded-full border border-cream/25 bg-cream/10 px-3 py-1.5 text-[11px] font-medium tracking-wide text-cream backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm"
            >
              {pill}
            </li>
          ))}
        </motion.ul>

        {!previewMode && experience.status !== "closed" && canReserve(experience) ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-cream/25 bg-cream/10 px-4 py-3 backdrop-blur-sm lg:hidden"
          >
            <div className="min-w-0">
              <p className="font-serif text-xl font-medium text-cream">{priceLabel}</p>
              <p className="mt-0.5 truncate text-[11px] text-cream/70">
                {labels.heroTrustFooter}
              </p>
            </div>
            <Button
              href="#booking-mobile"
              variant="primary"
              className="shrink-0 px-5 py-2.5 text-sm"
              onClick={(event) =>
                handleBookingNavClick(event, () =>
                  trackBookingStarted(experience, locale, "hero"),
                )
              }
            >
              {reserveCta}
            </Button>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="mt-6 hidden flex-wrap gap-3 sm:mt-8 sm:flex"
        >
          <Button
            href="#booking-mobile"
            variant="primary"
            onClick={(event) =>
              handleBookingNavClick(event, () =>
                trackBookingStarted(experience, locale, "hero"),
              )
            }
          >
            {reserveCta}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="mt-4 hidden max-w-xl text-xs leading-relaxed text-cream/65 sm:mt-6 sm:block sm:text-sm"
        >
          {labels.heroTrustFooter}
          {spots !== null && spots > 0 && spots <= 15 ? (
            <span className="mt-1 block text-gold/90">
              · {formatSpotsBadge(labels.heroSpotsHint, spots)}
            </span>
          ) : null}
        </motion.p>
      </div>
    </section>
  );
}
