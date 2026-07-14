"use client";

import { motion } from "framer-motion";
import type { ExperienceItem } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import {
  canReserve,
  formatFromPerPerson,
  formatSpotsBadge,
  getSpotsLeft,
} from "@/lib/experience-booking";
import { resolveFemaleOnly } from "@/lib/event-extras";
import { trackBookingStarted } from "@/lib/posthog/analytics";
import { handleBookingNavClick } from "@/lib/scroll-to-booking";
import { Button } from "../ui/Button";

interface ExperienceMidBookingCtaProps {
  experience: ExperienceItem;
  locale: Locale;
  reserveCta: string;
  eyebrow: string;
  title: string;
  trustLine: string;
  perPersonFromLabel: string;
  spotsHintLabel: string;
}

export function ExperienceMidBookingCta({
  experience,
  locale,
  reserveCta,
  eyebrow,
  title,
  trustLine,
  perPersonFromLabel,
  spotsHintLabel,
}: ExperienceMidBookingCtaProps) {
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );
  const spots = getSpotsLeft(experience);
  const bookingDisabled =
    experience.status === "closed" || !canReserve(experience);

  if (bookingDisabled) return null;

  return (
    <section
      className={`my-8 rounded-2xl border px-5 py-8 sm:my-10 sm:rounded-3xl sm:px-10 sm:py-10 ${
        isFemaleOnly
          ? "border-rose/20 bg-gradient-to-br from-rose/8 to-cream"
          : "border-border-subtle bg-gradient-to-br from-beige to-cream"
      }`}
    >
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-xs font-semibold uppercase tracking-[0.24em] text-wine/45"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-2 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl"
      >
        {title}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p
            className={`font-serif text-3xl font-medium sm:text-4xl ${
              isFemaleOnly ? "text-rose-deep" : "text-burgundy"
            }`}
          >
            {formatFromPerPerson(experience.price, perPersonFromLabel)}
          </p>
          {spots !== null && spots > 0 && spots <= 15 ? (
            <p className="mt-1 text-sm font-medium text-wine/60">
              {formatSpotsBadge(spotsHintLabel, spots)}
            </p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-wine/55 sm:text-sm">
            {trustLine}
          </p>
        </div>
        <Button
          href="#booking-mobile"
          variant="primary"
          className={
            isFemaleOnly
              ? "bg-rose hover:bg-rose-deep sm:shrink-0"
              : "sm:shrink-0"
          }
          onClick={(event) =>
            handleBookingNavClick(event, () =>
              trackBookingStarted(experience, locale, "mid_cta"),
            )
          }
        >
          {reserveCta}
        </Button>
      </motion.div>
    </section>
  );
}
