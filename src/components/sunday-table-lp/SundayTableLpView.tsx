"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import {
  joinPath,
  sundayTableLpCityPath,
  sundayTableLpPath,
} from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import { fillCity } from "@/i18n/get-sunday-table-lp";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GirlsOnlyHeroMedia } from "@/components/girls-only/GirlsOnlyHeroMedia";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import { getGirlsOnlyHeroSlideshowImages } from "@/data/girls-only-media";
import {
  SUNDAY_TABLE_LP_CITIES,
  type SundayTableLpCitySlug,
} from "@/data/sunday-table-lp-cities";
import { rememberPreferredCity } from "@/lib/member-onboarding";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

function joinHref(locale: Locale, cityName?: string | null): string {
  const base = joinPath(locale);
  if (!cityName) return base;
  return `${base}?city=${encodeURIComponent(cityName)}`;
}

function PrimaryCta({
  href,
  label,
  hint,
  onClick,
  variant = "burgundy",
  className = "",
}: {
  href: string;
  label: string;
  hint?: string;
  onClick?: () => void;
  variant?: "burgundy" | "cream";
  className?: string;
}) {
  const isCream = variant === "cream";
  return (
    <div className={`w-full sm:w-auto ${className}`}>
      <Link
        href={href}
        onClick={onClick}
        className={`inline-flex min-h-[3.25rem] w-full flex-col items-center justify-center rounded-full px-9 py-3 text-center transition sm:min-w-[15.5rem] sm:w-auto ${
          isCream
            ? "bg-cream text-wine shadow-[0_14px_32px_rgba(0,0,0,0.22)] hover:bg-white hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
            : "bg-burgundy text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] hover:bg-wine hover:shadow-[0_18px_40px_rgba(43,13,18,0.32)]"
        }`}
      >
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
          {label}
        </span>
        {hint ? (
          <span
            className={`mt-0.5 text-[11px] font-medium normal-case tracking-normal ${
              isCream ? "text-wine/55" : "text-cream/70"
            }`}
          >
            {hint}
          </span>
        ) : null}
      </Link>
    </div>
  );
}

function ProofPhotoStrip({
  images,
  reduceMotion,
}: {
  images: Array<{ src: string; alt: string }>;
  reduceMotion: boolean | null;
}) {
  const track = [...images, ...images];

  return (
    <div className="mt-10">
      <div className="relative overflow-hidden">
        <div
          className={`flex w-max gap-3 pl-5 sm:gap-4 sm:pl-8 lg:gap-5 lg:pl-10 ${
            reduceMotion ? "" : "animate-photo-marquee-right"
          }`}
        >
          {track.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="relative h-56 w-44 shrink-0 overflow-hidden sm:h-64 sm:w-48 lg:h-[17.5rem] lg:w-[13.5rem]"
            >
              <Image
                src={image.src}
                alt={index < images.length ? image.alt : ""}
                fill
                sizes="(max-width: 640px) 176px, (max-width: 1024px) 240px, 360px"
                quality={90}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SundayTableLpView({
  locale,
  labels,
  headerDict,
  footerDict,
  cityName,
  citySlug,
}: {
  locale: Locale;
  labels: SundayTableLpLabels;
  headerDict: Dictionary["header"];
  footerDict: Dictionary["footer"];
  cityName?: string | null;
  citySlug?: SundayTableLpCitySlug | null;
}) {
  const reduceMotion = useReducedMotion();
  const { people } = getBrandLandingTestimonialRows(locale);
  const proofTop = people.slice(0, Math.ceil(people.length / 2));
  const proofBottom = people.slice(Math.ceil(people.length / 2));
  const proofImages = getGirlsOnlyHeroSlideshowImages(locale);
  const headline = cityName
    ? fillCity(labels.headlineCity, cityName)
    : labels.headline;
  const line = cityName ? fillCity(labels.lineCity, cityName) : labels.line;
  const finalTitle = cityName
    ? fillCity(labels.final.titleCity, cityName)
    : labels.final.title;
  const ctaHref = joinHref(locale, cityName);
  const heroRef = useRef<HTMLElement>(null);
  const pricingBlockRef = useRef<HTMLElement>(null);
  const finalCtaRef = useRef<HTMLDivElement>(null);
  const [heroPast, setHeroPast] = useState(false);
  const [primaryCtaInView, setPrimaryCtaInView] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroPast(!entry.isIntersecting),
      { root: null, rootMargin: "-72px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const targets = [pricingBlockRef.current, finalCtaRef.current].filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (targets.length === 0) return;

    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setPrimaryCtaInView(visible.size > 0);
      },
      { root: null, rootMargin: "0px 0px -72px 0px", threshold: 0.12 },
    );

    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const showMobileSticky = heroPast && !primaryCtaInView;

  function onClaimClick(cta: string, source: string) {
    if (cityName) rememberPreferredCity(cityName);
    trackSundayTableCtaClicked({ cta, source, locale });
  }

  return (
    <>
      <Header dict={headerDict} locale={locale} />

      {/* Hero: same composition as main language page — copy left, carousel right */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-white lg:min-h-[100svh]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,232,224,0.55),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(246,241,234,0.7),transparent_45%)]" />

        <div className="relative mx-auto grid min-h-0 max-w-7xl items-center gap-8 px-5 pb-10 pt-24 sm:gap-10 sm:px-8 sm:pb-16 sm:pt-28 lg:min-h-[100svh] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pb-20 lg:pt-24">
          <div className="relative z-10 max-w-xl lg:max-w-none">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="font-serif text-[1.85rem] font-medium leading-[1.15] tracking-tight text-wine text-balance sm:text-4xl lg:text-[2.55rem]"
            >
              {labels.brand}
            </motion.p>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease }}
              className="mt-4 max-w-xl font-serif text-[1.55rem] font-medium leading-[1.15] tracking-tight text-wine/90 text-balance sm:mt-5 sm:text-3xl lg:text-[2.15rem]"
            >
              {headline}
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.12, ease }}
              className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-wine/55 sm:mt-5 sm:text-[1.05rem]"
            >
              {line}
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease }}
              className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3"
            >
              <PrimaryCta
                href={ctaHref}
                label={labels.cta}
                hint={labels.ctaHint}
                onClick={() => onClaimClick("hero_primary", "sunday_table_hero")}
              />
              <a
                href="#included"
                onClick={() =>
                  trackSundayTableCtaClicked({
                    cta: "hero_secondary",
                    source: "sunday_table_hero",
                    locale,
                  })
                }
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-wine/20 bg-white/60 px-7 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-wine/75 backdrop-blur-sm transition hover:border-wine/40 hover:bg-white hover:text-wine sm:w-auto"
              >
                {labels.secondaryCta}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.1, ease }}
            className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none"
          >
            <div className="relative mx-auto aspect-[4/5] max-h-[18rem] w-full max-w-sm overflow-hidden rounded-[2rem] shadow-[0_28px_70px_rgba(43,13,18,0.14)] sm:max-h-[28rem] sm:max-w-lg sm:rounded-[2.5rem] lg:mx-0 lg:max-h-none lg:min-h-[34rem] lg:max-w-none lg:aspect-auto lg:rounded-[3rem]">
              <GirlsOnlyHeroMedia locale={locale} variant="background" />
              <div className="absolute inset-0 bg-gradient-to-t from-wine/25 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* What you get — value first for conversion */}
      <section
        id="included"
        className="relative scroll-mt-24 overflow-hidden border-b border-wine/8 bg-cream py-10 sm:py-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(197,154,91,0.08),transparent_42%)]" />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
              {labels.included.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
              {labels.included.title}
            </h2>
          </motion.div>

          <ul className="mt-5 divide-y divide-wine/10 border-y border-wine/10 sm:mt-6">
            {labels.included.items.map((item, index) => (
              <motion.li
                key={item.title}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: index * 0.03, ease }}
                className="flex gap-3 py-3 sm:gap-4 sm:py-3.5"
              >
                <span className="mt-0.5 shrink-0 font-serif text-xs tracking-[0.06em] text-wine/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="font-serif text-base font-medium tracking-tight text-wine sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-sm leading-snug text-wine/55">
                    {item.body}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>

          <p className="mt-4 max-w-xl text-xs leading-relaxed text-wine/40 sm:mt-5 sm:text-sm">
            {labels.included.note}
          </p>

          <div className="mt-5 sm:mt-6">
            <PrimaryCta
              href={ctaHref}
              label={labels.cta}
              hint={labels.ctaHint}
              onClick={() =>
                onClaimClick("included_cta", "sunday_table_included")
              }
            />
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="overflow-hidden border-b border-wine/8 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease }}
            className="max-w-xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.proof.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.proof.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-wine/60 sm:mt-4">
              {labels.proof.body}
            </p>
          </motion.div>
        </div>

        <ProofPhotoStrip images={proofImages} reduceMotion={reduceMotion} />

        <div className="mt-10 sm:mt-12">
          <TestimonialMarquee
            top={proofTop}
            bottom={proofBottom}
            fadeFromClassName="from-white"
            cardClassName="border-wine/10 bg-cream/80"
            singleRow
          />
        </div>
        <div className="mt-8 flex justify-center px-5 sm:mt-10 sm:px-8">
          <PrimaryCta
            href={ctaHref}
            label={labels.proof.cta}
            hint={labels.ctaHint}
            onClick={() => onClaimClick("proof_cta", "sunday_table_proof")}
          />
        </div>
      </section>

      {/* Pricing — close to value + proof on mobile */}
      <section
        id="pricing"
        ref={pricingBlockRef}
        className="relative scroll-mt-24 overflow-hidden bg-wine py-14 text-cream sm:py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(197,154,91,0.18),transparent_40%)]" />
        <div className="relative mx-auto max-w-4xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.pricing.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              {labels.pricing.title}
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-cream/65 sm:mt-4">
              {labels.pricing.body}
            </p>
          </motion.div>

          <div className="mt-8 divide-y divide-cream/15 border-y border-cream/15 sm:mt-12">
            {(
              [
                {
                  label: labels.pricing.trialLabel,
                  price: labels.pricing.trialPrice,
                  hint: labels.pricing.trialHint,
                  emphasize: false,
                },
                {
                  label: labels.pricing.popularLabel,
                  price: labels.pricing.popularPrice,
                  hint: labels.pricing.popularHint,
                  emphasize: true,
                },
                {
                  label: labels.pricing.yearLabel,
                  price: labels.pricing.yearPrice,
                  hint: labels.pricing.yearHint,
                  emphasize: false,
                },
              ] as const
            ).map((plan) => (
              <div
                key={plan.label}
                className={`flex flex-wrap items-baseline justify-between gap-3 py-5 sm:py-6 ${
                  plan.emphasize
                    ? "-mx-5 border-l-2 border-gold bg-cream/[0.06] px-5 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
                    : ""
                }`}
              >
                <div>
                  <p
                    className={`font-serif text-xl font-medium tracking-tight sm:text-2xl ${
                      plan.emphasize ? "text-cream" : "text-cream/90"
                    }`}
                  >
                    {plan.label}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      plan.emphasize ? "text-gold/90" : "text-cream/55"
                    }`}
                  >
                    {plan.hint}
                  </p>
                </div>
                <p className="font-serif text-3xl font-medium tracking-tight text-cream sm:text-4xl">
                  {plan.price}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10">
            <PrimaryCta
              href={ctaHref}
              label={labels.cta}
              hint={labels.ctaHint}
              variant="cream"
              onClick={() =>
                onClaimClick("pricing_cta", "sunday_table_pricing")
              }
            />
          </div>
        </div>
      </section>

      {/* Table choice — after price, before final commit */}
      <section
        id="tables"
        className="relative scroll-mt-24 overflow-hidden border-b border-wine/8 bg-white py-14 sm:py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(197,154,91,0.08),transparent_40%)]" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease }}
            className="max-w-2xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.tables.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl lg:text-[2.75rem]">
              {labels.tables.title}
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-wine/60 sm:mt-4 sm:text-lg">
              {labels.tables.body}
            </p>
          </motion.div>

          <div className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-2 sm:gap-16">
            {(
              [
                {
                  title: labels.tables.girlsOnlyTitle,
                  body: labels.tables.girlsOnlyBody,
                },
                {
                  title: labels.tables.mixedTitle,
                  body: labels.tables.mixedBody,
                },
              ] as const
            ).map((option, index) => (
              <motion.div
                key={option.title}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.08, ease }}
              >
                <h3 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
                  {option.title}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-wine/60 sm:mt-3 sm:text-base">
                  {option.body}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10">
            <PrimaryCta
              href={ctaHref}
              label={labels.cta}
              hint={labels.ctaHint}
              onClick={() => onClaimClick("tables_cta", "sunday_table_tables")}
            />
          </div>
        </div>
      </section>

      {/* Cities */}
      {!citySlug ? (
        <section className="border-b border-wine/8 bg-cream py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.cities.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.cities.title}
            </h2>
            <p className="mt-3 max-w-md text-base text-wine/60 sm:mt-4">
              {labels.cities.body}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
              {SUNDAY_TABLE_LP_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={sundayTableLpCityPath(locale, city.slug)}
                  onClick={() =>
                    trackSundayTableCtaClicked({
                      cta: "city_chip",
                      source: "sunday_table_cities",
                      locale,
                    })
                  }
                  className="rounded-full border border-wine/15 bg-white px-5 py-3 text-sm font-medium text-wine transition hover:border-wine/40 hover:bg-wine hover:text-cream"
                >
                  {city.name}
                </Link>
              ))}
            </div>

            <p className="mt-6 text-sm text-wine/45 sm:mt-8">
              <span className="font-semibold uppercase tracking-[0.14em] text-wine/35">
                {labels.cities.comingSoon}
              </span>
              <span className="mx-2 text-wine/25">·</span>
              {labels.cities.comingSoonCities}
            </p>
          </div>
        </section>
      ) : (
        <section className="border-b border-wine/8 bg-cream py-10 sm:py-12">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
            <p className="text-sm text-wine/55">
              {SUNDAY_TABLE_LP_CITIES.filter((c) => c.slug !== citySlug).map(
                (c, i) => (
                  <span key={c.slug}>
                    {i > 0 ? <span className="mx-2 text-wine/25">·</span> : null}
                    <Link
                      href={sundayTableLpCityPath(locale, c.slug)}
                      className="underline-offset-4 transition hover:text-wine hover:underline"
                    >
                      {c.name}
                    </Link>
                  </span>
                ),
              )}
            </p>
            <Link
              href={sundayTableLpPath(locale)}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-wine/45 transition hover:text-wine"
            >
              {labels.cities.title}
            </Link>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-white py-14 pb-28 sm:py-24 sm:pb-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(245,232,224,0.9),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease }}
            className="font-serif text-3xl font-medium tracking-tight text-wine text-balance sm:text-4xl lg:text-[2.75rem]"
          >
            {finalTitle}
          </motion.h2>
          <p className="mx-auto mt-3 max-w-md text-base text-wine/55 sm:mt-4">
            {labels.final.body}
          </p>
          <div ref={finalCtaRef} className="mt-8 flex justify-center sm:mt-10">
            <PrimaryCta
              href={ctaHref}
              label={labels.final.cta}
              hint={labels.ctaHint}
              onClick={() => onClaimClick("final_cta", "sunday_table_final")}
            />
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showMobileSticky ? (
          <motion.div
            key="sunday-table-sticky"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease }}
            className="fixed inset-x-0 bottom-0 z-[48] border-t border-wine/10 bg-cream/97 shadow-[0_-12px_36px_rgba(43,13,18,0.14)] backdrop-blur-md lg:hidden"
            style={{
              paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))",
            }}
            role="region"
            aria-label={labels.cta}
          >
            <div className="mx-auto max-w-7xl px-4 py-2.5">
              <PrimaryCta
                href={ctaHref}
                label={labels.cta}
                hint={labels.ctaHint}
                onClick={() =>
                  onClaimClick("mobile_sticky", "sunday_table_mobile_sticky")
                }
                className="w-full"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Footer dict={footerDict} locale={locale} showSeoLinks={false} />
    </>
  );
}
