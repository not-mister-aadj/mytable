"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
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
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import { getGirlsOnlyHeroSlideshowImages } from "@/data/girls-only-media";
import {
  SUNDAY_TABLE_LP_CITIES,
  type SundayTableLpCitySlug,
} from "@/data/sunday-table-lp-cities";
import { rememberPreferredCity } from "@/lib/member-onboarding";

const ease = [0.22, 1, 0.36, 1] as const;

function joinHref(locale: Locale, cityName?: string | null): string {
  const base = joinPath(locale);
  if (!cityName) return base;
  return `${base}?city=${encodeURIComponent(cityName)}`;
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

  function onClaimClick() {
    if (cityName) rememberPreferredCity(cityName);
  }

  return (
    <>
      <Header dict={headerDict} locale={locale} />

      {/* Hero: one composition, brand-first, full-bleed media */}
      <section className="relative min-h-[100svh] overflow-hidden bg-wine">
        <motion.div
          className="absolute inset-0"
          initial={reduceMotion ? false : { scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease }}
        >
          <Image
            src="/girls-only/table-group.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%]"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-wine/55 via-wine/72 to-wine/92" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(197,154,91,0.2),transparent_50%)]" />

        <div className="relative mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="font-serif text-5xl font-medium tracking-tight text-cream sm:text-6xl lg:text-[4.25rem]"
          >
            {labels.brand}
          </motion.p>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease }}
            className="mt-5 max-w-3xl font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-cream text-balance sm:text-4xl lg:text-[2.85rem]"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease }}
            className="mt-4 max-w-xl text-base leading-relaxed text-cream/75 sm:text-lg"
          >
            {line}
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease }}
            className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
          >
            <Link
              href={ctaHref}
              onClick={onClaimClick}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-cream px-8 text-xs font-semibold uppercase tracking-[0.16em] text-wine shadow-[0_14px_36px_rgba(0,0,0,0.28)] transition hover:bg-white"
            >
              {labels.cta}
            </Link>
            <a
              href="#how"
              className="inline-flex min-h-12 items-center text-xs font-semibold uppercase tracking-[0.16em] text-cream/70 transition hover:text-cream"
            >
              {labels.secondaryCta}
            </a>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how"
        className="relative scroll-mt-24 overflow-hidden border-b border-wine/8 bg-cream py-20 sm:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(197,154,91,0.1),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease }}
            className="max-w-2xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.how.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl lg:text-[2.75rem]">
              {labels.how.title}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-wine/60 sm:text-lg">
              {labels.how.body}
            </p>
          </motion.div>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {labels.how.steps.map((step, index) => (
              <motion.li
                key={step.title}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.08, ease }}
                className="relative"
              >
                <span className="font-serif text-5xl font-medium text-wine/12">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-wine/60 sm:text-base">
                  {step.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Proof: photos + quotes */}
      <section className="overflow-hidden border-b border-wine/8 bg-cream py-16 sm:py-20">
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
            <p className="mt-4 text-base leading-relaxed text-wine/60">
              {labels.proof.body}
            </p>
          </motion.div>
        </div>

        <ProofPhotoStrip images={proofImages} reduceMotion={reduceMotion} />

        <div className="mt-12">
          <TestimonialMarquee
            top={proofTop}
            bottom={proofBottom}
            fadeFromClassName="from-cream"
            cardClassName="border-wine/10 bg-white/90"
            singleRow
          />
        </div>

        <div className="mt-12 flex justify-center px-5 sm:mt-14">
          <Link
            href={ctaHref}
            onClick={onClaimClick}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_12px_28px_rgba(90,15,27,0.18)] transition hover:bg-wine"
          >
            {labels.proof.cta}
          </Link>
        </div>
      </section>

      {/* Girls only / mixed */}
      <section className="relative overflow-hidden border-b border-wine/8 bg-white py-20 sm:py-24">
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
            <p className="mt-4 max-w-lg text-base leading-relaxed text-wine/60 sm:text-lg">
              {labels.tables.body}
            </p>
          </motion.div>

          <div className="mt-14 grid gap-12 sm:grid-cols-2 sm:gap-16">
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
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-wine/60 sm:text-base">
                  {option.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative overflow-hidden bg-wine py-20 text-cream sm:py-24">
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
            <p className="mt-4 max-w-lg text-base leading-relaxed text-cream/65">
              {labels.pricing.body}
            </p>
          </motion.div>

          <div className="mt-12 divide-y divide-cream/15 border-y border-cream/15">
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
                className={`flex flex-wrap items-baseline justify-between gap-3 py-6 ${
                  plan.emphasize ? "bg-cream/[0.04]" : ""
                }`}
              >
                <div>
                  <p
                    className={`font-serif text-2xl font-medium tracking-tight ${
                      plan.emphasize ? "text-cream" : "text-cream/90"
                    }`}
                  >
                    {plan.label}
                  </p>
                  <p className="mt-1 text-sm text-cream/55">{plan.hint}</p>
                </div>
                <p className="font-serif text-3xl font-medium tracking-tight text-cream sm:text-4xl">
                  {plan.price}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href={ctaHref}
              onClick={onClaimClick}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-cream px-8 text-xs font-semibold uppercase tracking-[0.16em] text-wine transition hover:bg-white"
            >
              {labels.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Cities */}
      {!citySlug ? (
        <section className="border-b border-wine/8 bg-cream py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.cities.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.cities.title}
            </h2>
            <p className="mt-4 max-w-md text-base text-wine/60">
              {labels.cities.body}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {SUNDAY_TABLE_LP_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={sundayTableLpCityPath(locale, city.slug)}
                  className="rounded-full border border-wine/15 bg-white px-5 py-3 text-sm font-medium text-wine transition hover:border-wine/40 hover:bg-wine hover:text-cream"
                >
                  {city.name}
                </Link>
              ))}
            </div>

            <p className="mt-8 text-sm text-wine/45">
              <span className="font-semibold uppercase tracking-[0.14em] text-wine/35">
                {labels.cities.comingSoon}
              </span>
              <span className="mx-2 text-wine/25">·</span>
              {labels.cities.comingSoonCities}
            </p>
          </div>
        </section>
      ) : (
        <section className="border-b border-wine/8 bg-cream py-12">
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
      <section className="relative overflow-hidden bg-white py-24 sm:py-28">
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
          <p className="mx-auto mt-4 max-w-md text-base text-wine/55">
            {labels.final.body}
          </p>
          <div className="mt-10">
            <Link
              href={ctaHref}
              onClick={onClaimClick}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_12px_28px_rgba(90,15,27,0.22)] transition hover:bg-wine"
            >
              {labels.final.cta}
            </Link>
          </div>
        </div>
      </section>

      <Footer dict={footerDict} locale={locale} showSeoLinks={false} />
    </>
  );
}
