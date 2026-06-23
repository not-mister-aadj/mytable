"use client";

import Link from "next/link";
import { useState } from "react";
import { experiencePath, type Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import {
  getGirlsOnlyTestimonials,
  splitGirlsOnlyTestimonialRows,
} from "@/data/girls-only-testimonials";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Button } from "@/components/ui/Button";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { TestimonialNotificationToasts } from "@/components/girls-only/TestimonialNotificationToasts";
import { GirlsOnlyHeroMedia } from "@/components/girls-only/GirlsOnlyHeroMedia";
import { GirlsOnlyGallery } from "@/components/girls-only/GirlsOnlyGallery";
import type { GirlsOnlyGalleryItem } from "@/lib/girls-only-gallery";

interface GirlsOnlyLandingViewProps {
  labels: GirlsOnlyPageLabels;
  locale: Locale;
  allEvents: EnrichedExperience[];
  soldOut: EnrichedExperience[];
  primaryCtaHref: string;
  galleryItems: GirlsOnlyGalleryItem[];
}

const ctaClassName =
  "bg-rose text-cream hover:bg-rose-deep px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm";

const EVENT_PREVIEW_COUNT = 3;

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-rose/30 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-rose-deep shadow-sm">
      {children}
    </span>
  );
}

function GirlsOnlyCta({
  href,
  children,
  className = "",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Button href={href} className={`${ctaClassName} ${className}`} onClick={onClick}>
      <span aria-hidden className="mr-2 opacity-90">
        ›
      </span>
      {children}
    </Button>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-deep">
      {children}
    </p>
  );
}

export function GirlsOnlyLandingView({
  labels,
  locale,
  allEvents,
  soldOut,
  primaryCtaHref,
  galleryItems,
}: GirlsOnlyLandingViewProps) {
  const [showAllSoldOut, setShowAllSoldOut] = useState(false);
  const testimonials = getGirlsOnlyTestimonials(locale);
  const { top, bottom } = splitGirlsOnlyTestimonialRows(testimonials);
  const trustPills = labels.hero.trustLine.split(" · ");
  const visibleSoldOut = showAllSoldOut
    ? soldOut
    : soldOut.slice(0, EVENT_PREVIEW_COUNT);
  const hasMoreSoldOut = soldOut.length > EVENT_PREVIEW_COUNT;
  const hasMoreEventsThanPreview = allEvents.length > EVENT_PREVIEW_COUNT;

  const cardProps = {
    statusLabels: labels.status,
    femaleOnlyBadge: labels.femaleOnlyBadge,
    reserveCta: labels.reserveCta,
    viewTableCta: labels.viewTableCta,
    locale,
    socialPromise: labels.events.cardSocialPromise,
    sourceSection: "agenda_grid" as const,
  };

  return (
    <>
      {/* Hero */}
      <section
        id="top"
        className="relative scroll-mt-24 overflow-hidden border-b border-rose/20 bg-gradient-to-b from-rose-soft via-cream to-cream pt-[4.5rem] sm:pt-24"
      >
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-rose/25 blur-3xl" />
        <div className="absolute -right-16 top-32 h-72 w-72 rounded-full bg-rose-deep/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="order-2 lg:order-1">
              <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
                <SectionEyebrow>{labels.hero.eyebrow}</SectionEyebrow>
                <h1 className="mt-4 font-serif text-4xl font-medium leading-[1.06] tracking-tight text-wine sm:text-5xl lg:text-[3.35rem]">
                  {labels.hero.title}
                </h1>

                <div className="mt-7 rounded-3xl border border-rose/25 bg-white/75 px-6 py-5 text-left shadow-[0_12px_40px_rgba(157,77,111,0.08)] backdrop-blur-sm sm:px-8 sm:py-6">
                  <p className="text-sm font-semibold text-rose-deep sm:text-base">
                    {labels.hero.calloutLabel}
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-wine/80 sm:text-lg">
                    {labels.hero.calloutPain}
                  </p>
                  <p className="mt-3 font-serif text-lg font-medium text-wine sm:text-xl">
                    {labels.hero.calloutReassurance}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-wine/65 sm:text-base">
                    {labels.hero.calloutBody}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                  <GirlsOnlyCta href={primaryCtaHref}>
                    {labels.hero.cta}
                  </GirlsOnlyCta>
                  <Link
                    href="#events"
                    className="text-sm font-medium text-rose-deep underline-offset-4 hover:underline"
                  >
                    {labels.finalCta.button}
                  </Link>
                </div>

                <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  {trustPills.map((pill) => (
                    <li key={pill}>
                      <TrustBadge>{pill}</TrustBadge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
              <GirlsOnlyHeroMedia locale={locale} />
            </div>
          </div>
        </div>
      </section>

      <GirlsOnlyGallery labels={labels.gallery} items={galleryItems} />

      {/* Trust / sold-out social proof */}
      {soldOut.length > 0 ? (
        <section className="border-b border-rose/15 bg-beige/60 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
                {labels.trust.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-wine/65 sm:text-base">
                {labels.trust.subtitle}
              </p>
            </div>

            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              <li>
                <TrustBadge>{labels.trust.badges.girlsOnly}</TrustBadge>
              </li>
              <li>
                <TrustBadge>{labels.trust.badges.soldOut}</TrustBadge>
              </li>
              <li>
                <TrustBadge>{labels.trust.badges.limitedSeats}</TrustBadge>
              </li>
              <li>
                <TrustBadge>{labels.trust.badges.soloOrFriends}</TrustBadge>
              </li>
            </ul>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleSoldOut.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  href={experiencePath(locale, experience.slug)}
                  {...cardProps}
                />
              ))}
            </div>

            {(hasMoreSoldOut || hasMoreEventsThanPreview) && (
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                {hasMoreSoldOut && !showAllSoldOut ? (
                  <button
                    type="button"
                    onClick={() => setShowAllSoldOut(true)}
                    className="text-sm font-medium text-rose-deep underline-offset-4 hover:underline"
                  >
                    {labels.trust.showMoreSoldOut}
                  </button>
                ) : null}
                {hasMoreEventsThanPreview ? (
                  <GirlsOnlyCta href="#events">{labels.trust.viewAllTables}</GirlsOnlyCta>
                ) : null}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 bg-rose-soft/35 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>{labels.howItWorks.title}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
              {labels.howItWorks.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-wine/65">
              {labels.howItWorks.subtitle}
            </p>
          </div>
          <ol className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {labels.howItWorks.steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-3xl border border-rose/20 bg-beige/90 p-6 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose font-serif text-lg font-medium text-cream">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-serif text-lg font-medium text-wine">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-wine/65">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why women join */}
      <section id="why-join" className="scroll-mt-24 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>{labels.benefits.title}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
              {labels.benefits.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-wine/65">
              {labels.benefits.subtitle}
            </p>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6">
            {labels.benefits.items.map((item) => (
              <li
                key={item.title}
                className="rounded-3xl border border-rose/15 bg-gradient-to-br from-beige to-rose-soft/40 p-6 sm:p-7"
              >
                <h3 className="font-serif text-lg font-medium leading-snug text-wine">
                  <span aria-hidden className="mr-2">
                    🍒
                  </span>
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-wine/70 sm:text-[15px]">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Event list */}
      <section
        id="events"
        className="scroll-mt-24 border-y border-rose/15 bg-rose-soft/25 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>{labels.headerNav.tables}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
              {labels.events.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-wine/65">
              {labels.events.subtitle}
            </p>
          </div>

          {allEvents.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-7">
              {allEvents.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  href={experiencePath(locale, experience.slug)}
                  {...cardProps}
                />
              ))}
            </div>
          ) : (
            <p className="mx-auto mt-8 max-w-xl rounded-3xl border border-rose/20 bg-beige px-5 py-6 text-center text-base leading-relaxed text-wine/70">
              {labels.events.empty}
            </p>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <section className="overflow-hidden bg-gradient-to-b from-rose-soft/50 to-cream py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>{labels.testimonials.eyebrow}</SectionEyebrow>
              <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
                {labels.testimonials.title}
              </h2>
            </div>
          </div>
          <TestimonialMarquee
            top={top}
            bottom={bottom}
            fadeFromClassName="from-rose-soft/50"
            cardClassName="border-rose/15 bg-white/90"
          />
        </section>
      ) : null}

      {/* Final CTA */}
      <section className="border-t border-rose/20 bg-gradient-to-b from-rose-soft/70 via-rose-soft/40 to-cream py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-8 lg:px-10">
          <h2 className="mx-auto max-w-xl font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
            {labels.finalCta.title}
          </h2>
          <div className="mt-8">
            <GirlsOnlyCta href="#events">{labels.finalCta.button}</GirlsOnlyCta>
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <TestimonialNotificationToasts testimonials={testimonials} />
      ) : null}
    </>
  );
}
