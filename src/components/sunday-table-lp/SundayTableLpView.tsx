"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { sundayTableLpCityPath, sundayTableLpPath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import { fillCity } from "@/i18n/get-sunday-table-lp";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SundayTableHeroGallery } from "@/components/sunday-table-lp/SundayTableHeroGallery";
import { SundayTableWhatsappSale } from "@/components/sunday-table-lp/SundayTableWhatsappSale";
import { SundayTableWaitlistModal } from "@/components/sunday-table-lp/SundayTableWaitlistModal";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import {
  getGirlsOnlyHeroSlideshowImages,
  getGirlsOnlyHowItWorksImage,
} from "@/data/girls-only-media";
import {
  SUNDAY_TABLE_LP_CITIES,
  type SundayTableLpCitySlug,
} from "@/data/sunday-table-lp-cities";
import { rememberPreferredCity } from "@/lib/member-onboarding";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

function PrimaryCta({
  href,
  label,
  hint,
  onClick,
  variant = "burgundy",
  className = "",
}: {
  /** Omit to render a button (opens the waitlist modal) instead of a link. */
  href?: string;
  label: string;
  hint?: string;
  onClick?: () => void;
  variant?: "burgundy" | "cream";
  className?: string;
}) {
  const isCream = variant === "cream";
  const sharedClassName = `cta-lift inline-flex min-h-[3.25rem] w-full max-w-full flex-col items-center justify-center rounded-full px-9 py-3 text-center sm:min-w-[15.5rem] sm:w-auto ${
    isCream
      ? "cta-lift-cream bg-cream text-wine shadow-[0_14px_32px_rgba(0,0,0,0.22)] hover:bg-white"
      : "cta-lift-burgundy bg-burgundy text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] hover:bg-wine"
  }`;
  const content = (
    <>
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
    </>
  );

  return (
    <div className={`w-full min-w-0 sm:w-auto ${className}`}>
      {href ? (
        <Link href={href} onClick={onClick} className={sharedClassName}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={sharedClassName}>
          {content}
        </button>
      )}
    </div>
  );
}

function GuaranteeBadge({
  name,
  text,
  variant = "light",
  className = "",
}: {
  name?: string;
  text: string;
  /** "dark" is for use on the wine-colored pricing section */
  variant?: "light" | "dark";
  className?: string;
}) {
  const isDark = variant === "dark";
  return (
    <p
      className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-xs leading-relaxed ${
        isDark ? "bg-cream/10 text-cream/80" : "bg-[#e8f3e4] text-[#2f5c2a]"
      } ${className}`}
    >
      <span aria-hidden className={`mt-0.5 shrink-0 ${isDark ? "text-gold" : ""}`}>
        ✓
      </span>
      <span>
        {name ? (
          <span className={`font-semibold ${isDark ? "text-gold" : ""}`}>
            {name}.{" "}
          </span>
        ) : null}
        <span className="font-medium">{text}</span>
      </span>
    </p>
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
  const proofImages = getGirlsOnlyHeroSlideshowImages(locale);
  const howItWorksImage = getGirlsOnlyHowItWorksImage(locale);
  const headline = cityName
    ? fillCity(labels.headlineCity, cityName)
    : labels.headline;
  const line = cityName ? fillCity(labels.lineCity, cityName) : labels.line;
  const finalTitle = cityName
    ? fillCity(labels.final.titleCity, cityName)
    : labels.final.title;
  const [saleOpen, setSaleOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  function openWaitlist(cta: string, source: string) {
    if (cityName) rememberPreferredCity(cityName);
    trackSundayTableCtaClicked({ cta, source, locale });
    setWaitlistOpen(true);
  }

  return (
    <>
      <SundayTableWhatsappSale
        labels={labels.sale}
        locale={locale}
        open={saleOpen}
        onOpenChange={setSaleOpen}
      />
      <SundayTableWaitlistModal
        labels={labels.waitlist}
        locale={locale}
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        cityName={cityName}
      />
      <Header dict={headerDict} locale={locale} className="top-[2.6rem]" />

      <div className="overflow-x-clip">
      {/* Hero: same composition as main language page — copy left, carousel right */}
      <section
        className="relative overflow-x-clip bg-white lg:min-h-[100svh]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,232,224,0.55),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(246,241,234,0.7),transparent_45%)]" />

        <div className="relative mx-auto grid min-h-0 w-full max-w-7xl items-center gap-6 px-5 pb-10 pt-[7.25rem] sm:gap-10 sm:px-8 sm:pb-16 sm:pt-36 lg:min-h-[100svh] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pb-20 lg:pt-40">
          <div className="relative z-10 order-2 w-full min-w-0 max-w-xl lg:order-1 lg:max-w-none">
            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, ease }}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45"
            >
              {labels.socialProof}
            </motion.p>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease }}
              className="mt-3 w-full max-w-full font-serif text-[1.35rem] font-medium leading-[1.15] tracking-tight text-wine/90 text-pretty sm:mt-4 sm:text-3xl lg:text-[2.15rem]"
            >
              {headline}
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.12, ease }}
              className="mt-4 w-full max-w-lg text-[0.95rem] leading-relaxed text-wine/55 text-pretty sm:mt-5 sm:text-[1.05rem]"
            >
              {line}
            </motion.p>

            <motion.ul
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16, ease }}
              className="mt-5 w-full space-y-2 sm:mt-6"
            >
              {labels.heroBenefits.map((item) => (
                <li
                  key={item.bold}
                  className="flex gap-2.5 text-sm leading-snug text-wine/65 sm:text-[0.95rem]"
                >
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-wine/35"
                  />
                  <span className="min-w-0">
                    <span className="font-semibold text-wine">{item.bold}</span>
                    {item.text}
                  </span>
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease }}
              className="mt-8 hidden flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3 lg:flex"
            >
              <div className="hidden lg:block">
                <PrimaryCta
                  label={labels.cta}
                  hint={labels.ctaHint}
                  onClick={() =>
                    openWaitlist("hero_primary", "sunday_table_hero")
                  }
                />
              </div>
              <a
                href="#included"
                onClick={() =>
                  trackSundayTableCtaClicked({
                    cta: "hero_secondary",
                    source: "sunday_table_hero",
                    locale,
                  })
                }
                className="cta-lift cta-lift-outline hidden min-h-12 items-center justify-center rounded-full border border-wine/20 bg-white/60 px-7 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-wine/75 backdrop-blur-sm hover:border-wine/40 hover:bg-white hover:text-wine lg:inline-flex"
              >
                {labels.secondaryCta}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05, ease }}
            className="relative order-1 mx-auto w-full min-w-0 max-w-full lg:order-2 lg:mx-0 lg:max-w-none lg:self-center"
          >
            <SundayTableHeroGallery locale={locale} />
          </motion.div>
        </div>
      </section>

      {/* How it works — reduces perceived effort before the value stack */}
      <section className="relative overflow-hidden border-b border-wine/8 bg-cream py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease }}
            className="max-w-xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.how.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.how.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-wine/60 sm:mt-4">
              {labels.how.body}
            </p>
          </motion.div>

          <div className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-3 sm:gap-10">
            {labels.how.steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.08, ease }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wine text-sm font-semibold text-cream">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-serif text-lg font-medium tracking-tight text-wine sm:text-xl">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-wine/55">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get — value first for conversion */}
      <section
        id="included"
        className="relative scroll-mt-24 overflow-hidden border-b border-wine/8 bg-cream py-10 sm:py-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(197,154,91,0.08),transparent_42%)]" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
            <div className="mx-auto w-full max-w-3xl lg:mx-0">
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
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 font-serif text-xs tracking-[0.06em] text-wine/50">
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

              <div className="mt-5 hidden sm:mt-6 lg:block">
                <PrimaryCta
                  label={labels.cta}
                  hint={labels.ctaHint}
                  onClick={() =>
                    openWaitlist("included_cta", "sunday_table_included")
                  }
                />
              </div>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease }}
              className="relative mx-auto hidden aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(43,13,18,0.14)] lg:block"
            >
              <Image
                src={howItWorksImage.src}
                alt={howItWorksImage.alt}
                fill
                sizes="(max-width: 1024px) 0px, 30vw"
                quality={90}
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How we match — dramatizes the real matching signals we already collect */}
      <section className="relative overflow-hidden border-b border-wine/8 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.matching.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.matching.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-wine/60 sm:mt-4">
              {labels.matching.body}
            </p>
          </motion.div>

          <div className="mt-10 grid gap-6 text-left sm:mt-12 sm:grid-cols-3 sm:gap-8">
            {labels.matching.items.map((item, index) => (
              <motion.div
                key={item.title}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.06, ease }}
                className="rounded-2xl border border-wine/10 bg-cream/60 p-5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 font-serif text-xs text-wine/50">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-lg font-medium tracking-tight text-wine">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-snug text-wine/55">
                  {item.body}
                </p>
              </motion.div>
            ))}
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
            top={people}
            bottom={[]}
            fadeFromClassName="from-white"
            cardClassName="border-wine/10 bg-cream/80"
            singleRow
          />
        </div>
        <div className="mt-8 hidden justify-center px-5 sm:mt-10 sm:px-8 lg:flex">
          <PrimaryCta
            label={labels.proof.cta}
            hint={labels.ctaHint}
            onClick={() => openWaitlist("proof_cta", "sunday_table_proof")}
          />
        </div>
      </section>

      {/* Pricing — close to value + proof on mobile */}
      <section
        id="pricing"
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

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-cream/55 sm:mt-8">
            {labels.pricing.justification}
          </p>

          <div className="mt-6 hidden sm:mt-8 lg:block">
            <PrimaryCta
              label={labels.cta}
              hint={labels.ctaHint}
              variant="cream"
              onClick={() =>
                openWaitlist("pricing_cta", "sunday_table_pricing")
              }
            />
          </div>

          <div className="mt-6 hidden max-w-md sm:mt-8 lg:block">
            <GuaranteeBadge
              name={labels.guaranteeName}
              text={labels.ctaRisk}
              variant="dark"
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

          <div className="mt-8 hidden sm:mt-10 lg:block">
            <PrimaryCta
              label={labels.cta}
              hint={labels.ctaHint}
              onClick={() => openWaitlist("tables_cta", "sunday_table_tables")}
            />
          </div>
        </div>
      </section>

      {/* FAQ — crushes last-minute objections right before the final push */}
      <section className="relative overflow-hidden border-b border-wine/8 bg-cream py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease }}
            className="text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.faq.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.faq.title}
            </h2>
          </motion.div>

          <div className="mt-10 divide-y divide-wine/10 border-y border-wine/10 sm:mt-12">
            {labels.faq.items.map((item, index) => (
              <motion.div
                key={item.question}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.05, ease }}
                className="py-5 sm:py-6"
              >
                <h3 className="font-serif text-lg font-medium tracking-tight text-wine sm:text-xl">
                  {item.question}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-wine/60 sm:text-base">
                  {item.answer}
                </p>
              </motion.div>
            ))}
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
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-wine/45 sm:mt-5">
            {labels.final.earlyNote}
          </p>
          <div className="mt-8 hidden justify-center sm:mt-10 lg:flex">
            <PrimaryCta
              label={labels.final.cta}
              hint={labels.ctaHint}
              onClick={() => openWaitlist("final_cta", "sunday_table_final")}
            />
          </div>
        </div>
      </section>

      <div className="pb-28 lg:pb-0">
        <Footer dict={footerDict} locale={locale} showSeoLinks={false} />
      </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-[48] border-t border-wine/10 bg-cream/97 shadow-[0_-12px_36px_rgba(43,13,18,0.14)] backdrop-blur-md lg:hidden"
        style={{
          paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))",
        }}
        role="region"
        aria-label={labels.cta}
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5">
          <PrimaryCta
            label={labels.cta}
            hint={labels.ctaHint}
            onClick={() =>
              openWaitlist("mobile_sticky", "sunday_table_mobile_sticky")
            }
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}
