"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import {
  sundayTableLpPath,
  wineTastingLpPath,
  wineWalkLpPath,
  chefsSpecialLpPath,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { GirlsOnlyHeroMedia } from "@/components/girls-only/GirlsOnlyHeroMedia";
import { Header } from "@/components/Header";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";

const ease = [0.22, 1, 0.36, 1] as const;

const formatCtaClassName =
  "relative mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_24px_rgba(90,15,27,0.18)] transition hover:bg-wine hover:shadow-[0_14px_28px_rgba(43,13,18,0.22)]";

export type BrandLandingFormatKey =
  | "sunday_table"
  | "wine_tasting"
  | "wine_walk"
  | "chefs_special";

export type BrandLandingLabels = {
  brand: string;
  eyebrow: string;
  belief: string;
  line: string;
  scrollCta: string;
  formatsEyebrow: string;
  formatsTitle: string;
  formatsSubtitle: string;
  formats: Array<{
    key: BrandLandingFormatKey;
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  }>;
  reviewsEyebrow: string;
};

interface BrandLandingViewProps {
  locale: Locale;
  headerDict: Dictionary["header"];
  labels: BrandLandingLabels;
}

export function BrandLandingView({
  locale,
  headerDict,
  labels,
}: BrandLandingViewProps) {
  const { culinary, people } = getBrandLandingTestimonialRows(locale);

  const hrefForFormat: Record<BrandLandingFormatKey, string> = {
    sunday_table: sundayTableLpPath(locale),
    wine_tasting: wineTastingLpPath(locale),
    wine_walk: wineWalkLpPath(locale),
    chefs_special: chefsSpecialLpPath(locale),
  };

  return (
    <>
      <Header dict={headerDict} locale={locale} />

      {/* Hero — the belief, not a product pitch */}
      <section className="relative min-h-[100svh] overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,232,224,0.55),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(246,241,234,0.7),transparent_45%)]" />

        <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pb-20 lg:pt-24">
          <div className="relative z-10 max-w-xl lg:max-w-none">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease }}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45"
            >
              {labels.eyebrow}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease }}
              className="mt-3 font-serif text-[1.85rem] font-medium leading-[1.15] tracking-tight text-wine text-balance sm:text-4xl lg:text-[2.55rem]"
            >
              {labels.belief}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.12, ease }}
              className="mt-5 max-w-lg text-base leading-relaxed text-wine/55 sm:text-[1.05rem]"
            >
              {labels.line}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease }}
              className="mt-9"
            >
              <a
                href="#formats"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-wine/20 bg-white/60 px-8 text-xs font-semibold uppercase tracking-[0.16em] text-wine/75 backdrop-blur-sm transition hover:border-wine/40 hover:bg-white hover:text-wine"
              >
                {labels.scrollCta}
                <span aria-hidden className="text-sm leading-none opacity-90">
                  ↓
                </span>
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.1, ease }}
            className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none"
          >
            <div className="relative aspect-[5/6] overflow-hidden rounded-[2.5rem] shadow-[0_28px_70px_rgba(43,13,18,0.14)] sm:aspect-[4/5] sm:rounded-[3rem] lg:min-h-[34rem] lg:aspect-auto">
              <GirlsOnlyHeroMedia locale={locale} variant="background" />
              <div className="absolute inset-0 bg-gradient-to-t from-wine/25 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Formats — how the belief plays out, one card per format */}
      <section
        id="formats"
        className="relative scroll-mt-24 overflow-hidden border-t border-wine/8 bg-cream py-20 sm:py-24 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(197,154,91,0.08),transparent_42%)]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
            className="max-w-2xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.formatsEyebrow}
            </p>
            <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-wine sm:text-5xl">
              {labels.formatsTitle}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-wine/50">
              {labels.formatsSubtitle}
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {labels.formats.map((format, index) => (
              <motion.div
                key={format.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.06, ease }}
                className="flex flex-col rounded-3xl border border-wine/10 bg-white p-6 shadow-[0_10px_32px_rgba(43,13,18,0.05)]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {format.eyebrow}
                </p>
                <h3 className="mt-2.5 font-serif text-xl font-medium tracking-tight text-wine">
                  {format.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-wine/60">
                  {format.body}
                </p>
                <Link href={hrefForFormat[format.key]} className={formatCtaClassName}>
                  {format.cta}
                  <span aria-hidden className="text-sm leading-none opacity-90">
                    ›
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="reviews"
        className="overflow-hidden border-t border-wine/8 bg-white py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            {labels.reviewsEyebrow}
          </p>
        </div>
        <TestimonialMarquee
          top={culinary}
          bottom={people}
          fadeFromClassName="from-white"
          cardClassName="border-wine/10 bg-cream/95"
        />
      </section>
    </>
  );
}
