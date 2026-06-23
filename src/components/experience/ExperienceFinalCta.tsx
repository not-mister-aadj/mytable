"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { agendaPath, type Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { images } from "@/data/images";
import { trackBookingStarted } from "@/lib/posthog/analytics";
import { Button } from "../ui/Button";

interface ExperienceFinalCtaProps {
  experience: ExperienceItem;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  locale: Locale;
}

export function ExperienceFinalCta({
  experience,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  locale,
}: ExperienceFinalCtaProps) {
  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl sm:mt-8 sm:rounded-3xl lg:mt-12">
      <div className="absolute inset-0">
        <Image
          src={images.cheers}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-wine/90 via-wine/75 to-wine/50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative px-5 py-12 text-cream sm:px-12 sm:py-20 lg:px-16"
      >
        <h2 className="max-w-xl font-serif text-2xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {headline}
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-cream/80 sm:mt-4 sm:text-lg">
          {subheadline}
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
          <Button
            href="#booking"
            variant="primary"
            className="bg-cream text-wine hover:bg-beige"
            onClick={() => trackBookingStarted(experience, locale, "final_cta")}
          >
            {primaryCta}
          </Button>
          <Button
            href={agendaPath(locale)}
            variant="outline"
            className="border-cream/40 text-cream hover:bg-cream hover:text-wine"
          >
            {secondaryCta}
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
