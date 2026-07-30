"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExperienceCard } from "@/components/ExperienceCard";
import { GirlsOnlyCityPrioritySignup } from "@/components/girls-only/GirlsOnlyCityPrioritySignup";
import { Button } from "@/components/ui/Button";
import {
  experiencePath,
  girlsOnlyCityPath,
  clubmemberPath,
  joinPath,
  type Locale,
} from "@/i18n/config";
import type { GirlsOnlyCityDefinition } from "@/data/girls-only-cities";
import {
  girlsOnlyCityDisplayRegion,
  listGirlsOnlyCities,
} from "@/data/girls-only-cities";
import type { GirlsOnlyCityPageLabels } from "@/i18n/girls-only-city.types";
import type { EnrichedExperience } from "@/lib/experience-detail";

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

interface GirlsOnlyCityViewProps {
  city: GirlsOnlyCityDefinition;
  labels: GirlsOnlyCityPageLabels;
  locale: Locale;
  events: EnrichedExperience[];
  hasBookable: boolean;
  agendaHref: string;
  /** Next Sunday Table scarcity line for this city. */
  sundayScarcity?: {
    seatsLeft: number;
    dateLabel: string;
  } | null;
}

export function GirlsOnlyCityView({
  city,
  labels,
  locale,
  events,
  hasBookable,
  agendaHref,
  sundayScarcity = null,
}: GirlsOnlyCityViewProps) {
  const hasEvents = events.length > 0;
  const quizHref = joinPath(locale);
  const claimHref = `${clubmemberPath(locale)}?claim=1#happening`;
  const primaryHref =
    sundayScarcity && sundayScarcity.seatsLeft > 0
      ? claimHref
      : hasBookable
        ? "#events"
        : quizHref;
  const primaryLabel =
    sundayScarcity && sundayScarcity.seatsLeft > 0
      ? labels.hero.ctaBook
      : hasBookable
        ? labels.hero.ctaBook
        : labels.events.emptyCta;
  const otherCities = listGirlsOnlyCities().filter((c) => c.slug !== city.slug);
  const region = girlsOnlyCityDisplayRegion(city, locale);
  const homeHref = locale === "en" ? "/en" : "/";

  return (
    <>
      <section className="relative isolate min-h-[88vh] overflow-hidden bg-wine text-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={city.heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wine/75 via-wine/55 to-wine/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(197,154,91,0.14),_transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-5 pb-14 pt-28 sm:px-8 sm:pb-16 lg:px-10 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <nav
              aria-label="Breadcrumb"
              className="mb-5 text-[11px] uppercase tracking-[0.14em] text-cream/55"
            >
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li>
                  <Link href={homeHref} className="transition hover:text-cream">
                    {labels.breadcrumbHome}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <span className="text-cream/80">{region}</span>
                </li>
                <li aria-hidden>/</li>
                <li className="text-cream/90" aria-current="page">
                  {city.cityName}
                </li>
              </ol>
            </nav>

            <p className="font-serif text-2xl tracking-tight text-gold sm:text-3xl">
              MyTable
            </p>
            <h1 className="mt-2 font-serif text-[2.35rem] font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {labels.hero.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">
              {labels.hero.subheadline}
            </p>

            {sundayScarcity && sundayScarcity.seatsLeft > 0 ? (
              <p className="mt-4 text-sm font-medium tracking-wide text-gold sm:text-base">
                {labels.hero.seatsLeft
                  .replace("{count}", String(sundayScarcity.seatsLeft))
                  .replace("{city}", city.cityName)
                  .replace("{date}", sundayScarcity.dateLabel)}
              </p>
            ) : null}

            <ul className="mt-5 flex flex-wrap gap-2">
              {labels.hero.trustBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-full border border-cream/25 bg-cream/10 px-3 py-1.5 text-xs text-cream/90"
                >
                  {bullet}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                href={primaryHref}
                className="bg-wine px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-burgundy sm:text-sm"
              >
                <span aria-hidden className="mr-2 opacity-90">
                  ›
                </span>
                {primaryLabel}
              </Button>
              {hasBookable ? (
                <Button
                  href="#priority"
                  className="border border-cream/35 bg-transparent px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-cream/10 sm:text-sm"
                >
                  {labels.hero.ctaPriority}
                </Button>
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="events"
        className="scroll-mt-24 border-b border-wine/10 bg-gradient-to-b from-beige/50 via-cream to-cream py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          {hasEvents ? (
            <motion.div {...fade} className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-burgundy">
                {labels.events.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                {labels.events.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-wine/70">
                {labels.events.subtitle}
              </p>
            </motion.div>
          ) : null}

          <div className={`${hasEvents ? "mt-10" : ""} space-y-12`}>
            {!hasEvents ? (
              <motion.div id="sunday-table" {...fade} className="scroll-mt-24">
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-beige via-cream to-beige shadow-[0_28px_70px_rgba(90,15,27,0.1)]">
                  <div className="relative grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div className="relative min-h-[14rem] overflow-hidden sm:min-h-[16rem] lg:min-h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={city.heroImage}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        aria-hidden
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-wine/80 via-wine/35 to-wine/20 lg:bg-gradient-to-r lg:from-wine/15 lg:via-wine/45 lg:to-wine/75" />
                      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                          {labels.breadcrumbGirlsOnly}
                        </p>
                        <p className="mt-3 font-serif text-4xl font-medium leading-none tracking-tight text-cream sm:text-5xl">
                          {city.cityName}
                        </p>
                        <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/75">
                          {locale === "en" ? city.hookEn : city.hookNl}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:px-11 lg:py-12">
                      <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-[1.85rem] sm:leading-tight">
                        {labels.events.emptyTitle}
                      </h2>
                      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-wine/65 sm:text-[15px]">
                        {labels.events.emptyBody}
                      </p>
                      <div className="mt-7">
                        <Button
                          href={quizHref}
                          className="bg-wine px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream shadow-[0_12px_28px_rgba(90,15,27,0.22)] transition hover:bg-burgundy hover:shadow-[0_16px_32px_rgba(90,15,27,0.28)] sm:text-sm"
                        >
                          <span aria-hidden className="mr-2 opacity-90">
                            ›
                          </span>
                          {labels.events.emptyCta}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                <GirlsOnlyCityPrioritySignup
                  labels={labels.priority}
                  locale={locale}
                  cityName={city.cityName}
                  heroImage={city.heroImage}
                  hook={locale === "en" ? city.hookEn : city.hookNl}
                />

                <motion.div {...fade} className="space-y-8">
                  <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 scrollbar-none sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
                    {events.map((experience) => (
                      <div
                        key={experience.id}
                        className="w-[min(85vw,18rem)] shrink-0 snap-start lg:w-auto lg:shrink"
                      >
                        <ExperienceCard
                          experience={experience}
                          href={experiencePath(locale, experience.slug)}
                          statusLabels={labels.status}
                          femaleOnlyBadge={labels.femaleOnlyBadge}
                          reserveCta={labels.reserveCta}
                          viewTableCta={labels.viewTableCta}
                          perPersonFromLabel={labels.perPersonFrom}
                          locale={locale}
                          socialPromise={labels.socialPromise}
                          sourceSection="agenda_grid"
                          compact
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button
                      href={agendaHref}
                      className="bg-wine px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-burgundy sm:text-sm"
                    >
                      <span aria-hidden className="mr-2 opacity-90">
                        ›
                      </span>
                      {labels.events.viewAll}
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      <section
        id="included"
        className="scroll-mt-24 border-b border-wine/10 bg-beige/40 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div {...fade} className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-burgundy">
              {labels.included.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.included.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-wine/70">
              {labels.included.subtitle}
            </p>
          </motion.div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {labels.included.items.map((item) => (
              <motion.li key={item.title} {...fade}>
                <h3 className="font-serif text-xl font-medium text-wine">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-wine/70">
                  {item.description}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="local"
        className="scroll-mt-24 bg-beige/40 py-12 sm:py-16"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <motion.div {...fade}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-burgundy">
              {labels.local.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.local.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-wine/75">
              {labels.local.body}
            </p>
          </motion.div>
          <motion.ul {...fade} className="space-y-5">
            {labels.local.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-sm leading-snug text-wine/85 sm:text-base"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wine/10 text-xs text-burgundy"
                >
                  ✓
                </span>
                {point}
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-24 border-t border-wine/10 bg-cream py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div {...fade} className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-burgundy">
              {labels.howItWorks.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.howItWorks.title}
            </h2>
          </motion.div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {labels.howItWorks.steps.map((step, index) => (
              <motion.div
                key={step.title}
                {...fade}
                transition={{ ...fade.transition, delay: index * 0.08 }}
                className="relative"
              >
                <p className="font-serif text-4xl text-wine/20">{index + 1}</p>
                <h3 className="mt-2 font-medium text-wine">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-wine/70">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-24 border-t border-wine/10 bg-beige/40 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
          <h2 className="text-center font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
            {labels.faq.title}
          </h2>
          <div className="mt-8 space-y-2.5 sm:space-y-3">
            {labels.faq.items.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-wine/12 bg-white/80 px-5 py-4 transition-shadow open:shadow-sm sm:px-6"
              >
                <summary className="cursor-pointer list-none font-medium text-wine marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span className="shrink-0 font-serif text-xl text-burgundy transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-wine/70 sm:text-base">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-wine/10 bg-cream py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-8 lg:px-10">
          <h2 className="font-serif text-2xl font-medium text-wine sm:text-3xl">
            {labels.otherCities.title}
          </h2>
          <p className="mt-2 text-sm text-wine/65">{labels.otherCities.subtitle}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {otherCities.map((other) => (
              <Link
                key={other.slug}
                href={girlsOnlyCityPath(locale, other.slug)}
                className="rounded-full border border-wine/15 bg-white px-5 py-2.5 text-sm font-medium text-wine transition hover:border-burgundy/40 hover:bg-beige/50"
              >
                {other.cityName}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button
              href={clubmemberPath(locale)}
              className="bg-wine px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-burgundy sm:text-sm"
            >
              <span aria-hidden className="mr-2 opacity-90">
                ›
              </span>
              {labels.otherCities.nationalCta}
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-wine/10 bg-gradient-to-b from-beige to-cream py-14 sm:py-16">
        <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
            {labels.finalCta.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-wine/70">
            {labels.finalCta.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              href={primaryHref}
              className="bg-wine px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-burgundy sm:text-sm"
            >
              <span aria-hidden className="mr-2 opacity-90">
                ›
              </span>
              {hasBookable
                ? labels.finalCta.ctaBook
                : labels.events.emptyCta}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
