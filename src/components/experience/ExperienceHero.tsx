"use client";

import Link from "next/link";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Dictionary, ExperienceItem, ExperienceMoodContent } from "@/i18n/types";
import { agendaPath, type Locale } from "@/i18n/config";
import {
  formatPerPerson,
  formatSpotsBadge,
  getSpotsLeft,
} from "@/lib/experience-booking";
import { getExperienceTagline, splitDateTime } from "@/lib/experience-detail";
import {
  displayAtmosphereTags,
  resolveFemaleOnly,
} from "@/lib/event-extras";
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
  const priceLabel = formatPerPerson(experience.price, labels.perPerson);
  const spots = getSpotsLeft(experience);

  const pills = [
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
          : "relative min-h-[62vh] overflow-hidden sm:min-h-[70vh]"
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
      <div
        className={`absolute inset-0 bg-gradient-to-t ${
          isFemaleOnly
            ? "from-rose-deep/90 via-rose/50 to-wine/35"
            : "from-wine/92 via-wine/55 to-wine/30"
        }`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-r ${
          isFemaleOnly
            ? "from-rose-deep/70 via-rose/30 to-transparent"
            : "from-wine/65 via-wine/25 to-transparent"
        }`}
      />

      <div
        className={
          previewMode
            ? "relative mx-auto flex min-h-[min(52vh,420px)] max-w-7xl flex-col justify-end px-5 pb-10 pt-24 sm:min-h-[min(58vh,480px)] sm:px-8 sm:pb-12 lg:px-10"
            : "relative mx-auto flex min-h-[62vh] max-w-7xl flex-col justify-end px-5 pb-12 pt-32 sm:min-h-[70vh] sm:px-8 sm:pb-16 lg:px-10"
        }
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xs font-medium tracking-wide text-cream/85"
        >
          {labels.heroTrustBar}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className={`mt-6 text-xs font-semibold uppercase tracking-[0.28em] ${
            isFemaleOnly ? "text-rose-soft" : "text-gold"
          }`}
        >
          {experience.category}
        </motion.p>

        {isFemaleOnly ? (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mt-4 inline-flex rounded-full bg-rose px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-cream shadow-sm"
          >
            {femaleOnlyBadge}
          </motion.span>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 max-w-3xl font-serif text-4xl font-medium leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-6xl"
        >
          {experience.experienceName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-2 font-serif text-2xl text-cream/90 sm:text-3xl"
        >
          {experience.city}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 max-w-xl text-lg leading-relaxed text-cream/80 sm:text-xl"
        >
          {tagline}
        </motion.p>

        {visibleTags.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {visibleTags.map((tag) => (
              <li
                key={tag}
                className={`rounded-full px-3 py-1 text-xs font-medium text-cream ${
                  isFemaleOnly ? "bg-rose/30" : "bg-gold/20"
                }`}
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
          className="mt-6 flex flex-wrap gap-2"
        >
          {pills.map((pill) => (
            <li
              key={pill}
              className="rounded-full border border-cream/25 bg-cream/10 px-4 py-2 text-xs font-medium tracking-wide text-cream backdrop-blur-sm sm:text-sm"
            >
              {pill}
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <Button href="#booking" variant="primary">
            {reserveCta}
          </Button>
          <Link
            href={agendaPath(locale)}
            className="inline-flex items-center justify-center rounded-full border border-cream/35 bg-cream/10 px-6 py-3 text-sm font-medium tracking-wide text-cream backdrop-blur-sm transition-all duration-300 hover:border-cream/55 hover:bg-cream/20"
          >
            {labels.agendaCta}
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="mt-6 max-w-xl text-xs leading-relaxed text-cream/65 sm:text-sm"
        >
          {labels.heroTrustFooter}
          {spots !== null && spots > 0 && spots <= 6 ? (
            <span className="mt-1 block text-gold/90">
              · {formatSpotsBadge(labels.heroSpotsHint, spots)}
            </span>
          ) : null}
        </motion.p>
      </div>
    </section>
  );
}
