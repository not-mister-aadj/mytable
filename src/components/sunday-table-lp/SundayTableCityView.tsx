"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { sundayTableLpCityPath, sundayTableLpPath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import type { SundayTableCityLabels } from "@/i18n/sunday-table-city.types";
import { fillCity, getSundayTableLpLabels } from "@/i18n/get-sunday-table-lp";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FastLink } from "@/components/ui/FastLink";
import { SundayTableHeroGallery } from "@/components/sunday-table-lp/SundayTableHeroGallery";
import { SundayTableWaitlistModal } from "@/components/sunday-table-lp/SundayTableWaitlistModal";
import { WaitlistAutoOpen } from "@/components/WaitlistAutoOpen";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { PrimaryCta } from "@/components/format-lp/PrimaryCta";
import { ProofPhotoStrip } from "@/components/format-lp/ProofPhotoStrip";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import { getGirlsOnlyHowItWorksImage } from "@/data/girls-only-media";
import { getFormatProofSlideshowImages } from "@/data/format-proof-media";
import {
  SUNDAY_TABLE_LP_CITIES,
  type SundayTableLpCitySlug,
} from "@/data/sunday-table-lp-cities";
import type { SundayTableCityDate } from "@/lib/sunday-table-city-dates";
import { formatSundayTableTime } from "@/lib/sunday-wine-table";
import { rememberPreferredCity } from "@/lib/member-onboarding";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";
import { ease } from "@/lib/motion";

const bookButtonClass =
  "cta-lift cta-lift-burgundy inline-flex min-h-[3.25rem] w-full max-w-full flex-col items-center justify-center rounded-full bg-burgundy px-9 py-3 text-center text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] hover:bg-wine sm:min-w-[15.5rem] sm:w-auto";

/** Same look as PrimaryCta, but a real link: booking happens on the date page. */
function BookLink({
  href,
  label,
  hint,
  onClick,
  className = "",
}: {
  href: string;
  label: string;
  hint?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <FastLink href={href} onClick={onClick} className={`${bookButtonClass} ${className}`}>
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
        {label}
      </span>
      {hint ? (
        <span className="mt-0.5 text-[11px] font-medium normal-case tracking-normal text-cream/70">
          {hint}
        </span>
      ) : null}
    </FastLink>
  );
}

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function dayAndMonth(tableDate: string, locale: Locale) {
  const date = new Date(`${tableDate}T12:00:00Z`);
  return {
    day: date.getUTCDate(),
    month: new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
      month: "short",
      timeZone: "UTC",
    })
      .format(date)
      .replace(".", ""),
  };
}

export function SundayTableCityView({
  locale,
  lpLabels,
  labels,
  headerDict,
  footerDict,
  cityName,
  citySlug,
  dates,
  nextTables,
}: {
  locale: Locale;
  /** Shared Sunday Table copy: the waitlist modal and the testimonial block. */
  lpLabels: SundayTableLpLabels;
  labels: SundayTableCityLabels;
  headerDict: Dictionary["header"];
  footerDict: Dictionary["footer"];
  cityName: string;
  citySlug: SundayTableLpCitySlug;
  /** Every upcoming table in this city, soonest first. */
  dates: SundayTableCityDate[];
  /** The soonest bookable table per age group, for the hero buttons. */
  nextTables: SundayTableCityDate[];
}) {
  const reduceMotion = useReducedMotion();
  const { people } = getBrandLandingTestimonialRows(locale);
  const proofImages = getFormatProofSlideshowImages(locale);
  const whatImage = getGirlsOnlyHowItWorksImage(locale);
  const altWaitlistLabels = getSundayTableLpLabels(
    locale === "en" ? "nl" : "en",
  ).waitlist;
  const timeLabel = formatSundayTableTime(locale);
  const city = (text: string) => fillCity(text, cityName);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  function openWaitlist(cta: string, source: string) {
    rememberPreferredCity(cityName);
    trackSundayTableCtaClicked({ cta, source, locale });
    setWaitlistOpen(true);
  }

  function trackBook(cta: string, source: string) {
    trackSundayTableCtaClicked({ cta, source, locale });
  }

  function bookLabel(table: SundayTableCityDate) {
    return table.ageBracket
      ? fill(labels.hero.bookCta, { bracket: table.ageBracket })
      : labels.hero.bookCtaNoBracket;
  }

  function bookHint(table: SundayTableCityDate) {
    return fill(labels.hero.bookHint, {
      date: table.dateLabel,
      price: table.priceEuros,
    });
  }

  const waitlistLink = (source: string, className = "") => (
    <button
      type="button"
      onClick={() => openWaitlist("waitlist_secondary", source)}
      className={`text-sm font-medium text-wine/60 underline decoration-wine/25 underline-offset-4 transition hover:text-wine hover:decoration-wine/60 ${className}`}
    >
      {labels.hero.waitlistCta}
    </button>
  );

  return (
    <>
      <Suspense fallback={null}>
        <WaitlistAutoOpen
          onTrigger={() => openWaitlist("auto_open", "direct_link")}
        />
      </Suspense>
      <SundayTableWaitlistModal
        labels={lpLabels.waitlist}
        altLabels={altWaitlistLabels}
        locale={locale}
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        cityName={cityName}
        presetInterest="sunday_table"
      />
      <Header dict={headerDict} locale={locale} />
      <div className="overflow-x-clip">
        {/* Hero: what it is in one line, then straight to "your" next table */}
        <section className="relative overflow-x-clip bg-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,232,224,0.55),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(246,241,234,0.7),transparent_45%)]" />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-12 pt-[7.25rem] sm:gap-10 sm:px-8 sm:pb-16 sm:pt-36 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pb-20 lg:pt-40">
            <div className="relative z-10 order-2 w-full min-w-0 max-w-xl lg:order-1 lg:max-w-none">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                {city(labels.hero.eyebrow)}
              </p>
              <h1 className="mt-3 max-w-xl font-serif text-[1.75rem] font-medium leading-[1.12] tracking-tight text-wine text-balance sm:mt-4 sm:text-4xl lg:text-[2.85rem]">
                {city(labels.hero.headline)}
              </h1>
              <p className="mt-4 max-w-lg text-[0.98rem] leading-relaxed text-wine/60 text-pretty sm:mt-5 sm:text-[1.05rem]">
                {labels.hero.line}
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {labels.hero.facts.map((fact) => (
                  <li
                    key={fact}
                    className="rounded-full border border-wine/12 bg-cream/70 px-3 py-1.5 text-xs font-medium text-wine/75"
                  >
                    {fact}
                  </li>
                ))}
              </ul>

              {nextTables.length > 0 ? (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {nextTables.map((table) => (
                    <BookLink
                      key={table.tableDate}
                      href={table.href}
                      label={bookLabel(table)}
                      hint={bookHint(table)}
                      onClick={() => trackBook("hero_book", "sunday_table_city_hero")}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-8">
                  <p className="font-serif text-lg text-wine">
                    {city(labels.hero.noDatesTitle)}
                  </p>
                  <p className="mt-1 text-sm text-wine/55">{labels.hero.noDatesBody}</p>
                  <PrimaryCta
                    label={labels.dates.waitlistCta}
                    hint={lpLabels.ctaHint}
                    onClick={() => openWaitlist("hero_waitlist", "sunday_table_city_hero")}
                    className="mt-5"
                  />
                </div>
              )}
              {nextTables.length > 0 ? (
                <div className="mt-4">{waitlistLink("sunday_table_city_hero")}</div>
              ) : null}
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.05, ease }}
              className="relative order-1 mx-auto w-full min-w-0 max-w-full lg:order-2 lg:mx-0 lg:max-w-none lg:self-center"
            >
              <SundayTableHeroGallery locale={locale} images={proofImages} />
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-wine/8 bg-cream py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.how.eyebrow}
            </p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl font-medium tracking-tight text-wine text-balance sm:text-4xl">
              {labels.how.title}
            </h2>
            <ol className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
              {labels.how.steps.map((step, index) => (
                <li key={step.title}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wine text-sm font-semibold text-cream">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 font-serif text-lg font-medium tracking-tight text-wine sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-wine/60">
                    {city(step.body)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Dates: every upcoming table, each with its own sign-up button */}
        <section
          id="data"
          className="scroll-mt-24 border-b border-wine/8 bg-white py-14 sm:py-20"
        >
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.dates.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine text-balance sm:text-4xl">
              {city(labels.dates.title)}
            </h2>
            <p className="mt-3 text-base text-wine/60">{labels.dates.body}</p>

            {dates.length > 0 ? (
              <ul className="mt-8 flex flex-col gap-3 sm:mt-10">
                {dates.map((table) => {
                  const { day, month } = dayAndMonth(table.tableDate, locale);
                  const bookable = table.status === "available";
                  const statusLabel =
                    table.status === "soldOut"
                      ? labels.dates.soldOut
                      : table.status === "comingSoon"
                        ? labels.dates.comingSoon
                        : table.spotsLeft !== null
                          ? fill(labels.dates.spotsLeft, { count: table.spotsLeft })
                          : null;
                  return (
                    <li
                      key={table.tableDate}
                      className="flex flex-col gap-4 rounded-2xl border border-wine/10 bg-cream/40 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5"
                    >
                      <div className="flex items-center gap-4 sm:contents">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-wine text-cream">
                          <span className="font-serif text-2xl leading-none">{day}</span>
                          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/75">
                            {month}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-lg leading-snug text-wine">
                            {table.dateLabel}
                          </p>
                          <p className="mt-0.5 text-sm text-wine/55">
                            {timeLabel} · {table.venueName}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {table.ageBracket ? (
                              <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold text-wine">
                                {fill(labels.dates.ageLabel, { bracket: table.ageBracket })}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-wine/[0.06] px-2.5 py-1 text-[11px] font-semibold text-wine/70">
                              {labels.dates.mixedLabel}
                            </span>
                            {statusLabel ? (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  bookable ? "bg-burgundy/10 text-burgundy" : "bg-wine/[0.06] text-wine/55"
                                }`}
                              >
                                {statusLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-wine/8 pt-3 sm:flex-col sm:items-end sm:gap-2 sm:border-0 sm:pt-0">
                        <p className="text-sm text-wine/55">
                          <span className="font-serif text-xl text-wine">€{table.priceEuros}</span>{" "}
                          {locale === "en" ? "per seat" : "per plek"}
                        </p>
                        <FastLink
                          href={table.href}
                          onClick={() => trackBook("date_row", "sunday_table_city_dates")}
                          className={
                            bookable
                              ? "cta-lift cta-lift-burgundy inline-flex min-h-11 items-center justify-center rounded-full bg-burgundy px-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-cream hover:bg-wine"
                              : "inline-flex min-h-11 items-center justify-center rounded-full border border-wine/20 px-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-wine/70 transition hover:border-wine/40 hover:text-wine"
                          }
                        >
                          {bookable ? labels.dates.bookCta : labels.dates.viewCta}
                        </FastLink>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-8 rounded-2xl border border-wine/10 bg-cream/40 p-6 sm:p-8">
                <p className="font-serif text-xl text-wine">{labels.dates.emptyTitle}</p>
                <p className="mt-2 text-sm text-wine/60">{city(labels.dates.emptyBody)}</p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-beige/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="max-w-md">
                <p className="font-serif text-lg text-wine">{labels.dates.missingTitle}</p>
                <p className="mt-1 text-sm text-wine/60">{city(labels.dates.missingBody)}</p>
              </div>
              <button
                type="button"
                onClick={() => openWaitlist("dates_waitlist", "sunday_table_city_dates")}
                className="cta-lift cta-lift-outline inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-wine/25 bg-white px-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-wine hover:border-wine/45"
              >
                {labels.dates.waitlistCta}
              </button>
            </div>
          </div>
        </section>

        {/* Proof: real testimonials */}
        <section className="overflow-hidden border-b border-wine/8 bg-cream py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                {lpLabels.proof.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                {lpLabels.proof.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-wine/60 sm:mt-4">
                {lpLabels.proof.body}
              </p>
            </div>
          </div>
          <ProofPhotoStrip images={proofImages} reduceMotion={reduceMotion} />
          <div className="mt-10 sm:mt-12">
            <TestimonialMarquee
              top={people}
              bottom={[]}
              fadeFromClassName="from-cream"
              cardClassName="border-wine/10 bg-white/80"
              singleRow
            />
          </div>
        </section>

        {/* What it is, for anyone who scrolled past the hero still unsure */}
        <section className="border-b border-wine/8 bg-white py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center lg:gap-14 lg:px-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                {labels.what.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine text-balance sm:text-4xl">
                {labels.what.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-wine/60">
                {city(labels.what.body)}
              </p>
              <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {labels.what.items.map((item) => (
                  <div key={item.title} className="border-t border-wine/10 pt-4">
                    <dt className="font-serif text-lg font-medium tracking-tight text-wine">
                      {item.title}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed text-wine/60">
                      {city(item.body)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative mx-auto hidden aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(43,13,18,0.14)] lg:block">
              <Image
                src={whatImage.src}
                alt={whatImage.alt}
                fill
                sizes="(max-width: 1024px) 0px, 30vw"
                quality={90}
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* FAQ: price first, like people actually ask it */}
        <section className="border-b border-wine/8 bg-cream py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                {labels.faq.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                {labels.faq.title}
              </h2>
            </div>
            <div className="mt-10 divide-y divide-wine/10 border-y border-wine/10 sm:mt-12">
              {labels.faq.items.map((item) => (
                <div key={item.question} className="py-5 sm:py-6">
                  <h3 className="font-serif text-lg font-medium tracking-tight text-wine sm:text-xl">
                    {item.question}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-wine/60 sm:text-base">
                    {city(item.answer)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Other cities */}
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
                      {locale === "en" && c.name === "Den Haag" ? "The Hague" : c.name}
                    </Link>
                  </span>
                ),
              )}
            </p>
            <Link
              href={sundayTableLpPath(locale)}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-wine/45 transition hover:text-wine"
            >
              {lpLabels.cities.title}
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-white py-14 sm:py-24 lg:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(245,232,224,0.9),transparent_55%)]" />
          <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-wine text-balance sm:text-4xl lg:text-[2.75rem]">
              {city(labels.final.title)}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-wine/55 sm:mt-4">
              {labels.final.body}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center">
              {nextTables.length > 0 ? (
                nextTables.map((table) => (
                  <BookLink
                    key={table.tableDate}
                    href={table.href}
                    label={bookLabel(table)}
                    hint={bookHint(table)}
                    onClick={() => trackBook("final_book", "sunday_table_city_final")}
                  />
                ))
              ) : (
                <PrimaryCta
                  label={labels.dates.waitlistCta}
                  hint={lpLabels.ctaHint}
                  onClick={() => openWaitlist("final_waitlist", "sunday_table_city_final")}
                />
              )}
            </div>
            {nextTables.length > 0 ? (
              <div className="mt-4">{waitlistLink("sunday_table_city_final")}</div>
            ) : null}
          </div>
        </section>

        <div className="pb-24 lg:pb-0">
          <Footer dict={footerDict} locale={locale} showSeoLinks={false} />
        </div>
      </div>

      {/* Mobile: one tap to sign up. With one age group it goes straight to
          that table, with several it jumps to the dates to pick one. */}
      <div
        className="fixed inset-x-0 bottom-0 z-[48] border-t border-wine/10 bg-cream/97 shadow-[0_-12px_36px_rgba(43,13,18,0.14)] backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
        role="region"
        aria-label={labels.stickyCta}
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5">
          {nextTables.length === 1 ? (
            <BookLink
              href={nextTables[0].href}
              label={bookLabel(nextTables[0])}
              hint={bookHint(nextTables[0])}
              onClick={() => trackBook("mobile_sticky", "sunday_table_city_mobile_sticky")}
              className="w-full"
            />
          ) : nextTables.length > 1 ? (
            <a
              href="#data"
              onClick={() => trackBook("mobile_sticky", "sunday_table_city_mobile_sticky")}
              className={`${bookButtonClass} w-full`}
            >
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
                {labels.stickyCta}
              </span>
              <span className="mt-0.5 text-[11px] font-medium normal-case tracking-normal text-cream/70">
                {labels.final.datesCta}
              </span>
            </a>
          ) : (
            <PrimaryCta
              label={labels.dates.waitlistCta}
              hint={lpLabels.ctaHint}
              onClick={() => openWaitlist("mobile_sticky", "sunday_table_city_mobile_sticky")}
              className="w-full"
            />
          )}
        </div>
      </div>
    </>
  );
}
