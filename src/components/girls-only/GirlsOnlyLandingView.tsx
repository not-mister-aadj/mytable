"use client";

import { useMemo } from "react";
import { experiencePath, type Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import {
  getGirlsOnlyTestimonials,
  splitGirlsOnlyTestimonialRows,
} from "@/data/girls-only-testimonials";
import { getGirlsOnlyToastNotifications } from "@/data/girls-only-toast-notifications";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Button } from "@/components/ui/Button";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { TestimonialNotificationToasts } from "@/components/girls-only/TestimonialNotificationToasts";
import { GirlsOnlyHeroMedia } from "@/components/girls-only/GirlsOnlyHeroMedia";
import { GirlsOnlyStickyCta } from "@/components/girls-only/GirlsOnlyStickyCta";

interface GirlsOnlyLandingViewProps {
  labels: GirlsOnlyPageLabels;
  locale: Locale;
  allEvents: EnrichedExperience[];
}

const ctaClassName =
  "bg-rose text-cream hover:bg-rose-deep px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm";

const sectionPad = "py-8 sm:py-12 lg:py-16";

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-rose/30 bg-white/70 px-3 py-1 text-[11px] font-medium text-rose-deep shadow-sm sm:px-3.5 sm:py-1.5 sm:text-xs">
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

function EventsSection({
  labels,
  locale,
  allEvents,
  cardProps,
}: {
  labels: GirlsOnlyPageLabels;
  locale: Locale;
  allEvents: EnrichedExperience[];
  cardProps: Omit<
    React.ComponentProps<typeof ExperienceCard>,
    "experience" | "href"
  >;
}) {
  return (
    <section
      id="events"
      className={`scroll-mt-20 border-t border-rose/15 bg-rose-soft/25 ${sectionPad}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>{labels.headerNav.tables}</SectionEyebrow>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-wine sm:mt-3 sm:text-4xl">
            {labels.events.title}
          </h2>
          <p className="mt-2 hidden text-base leading-relaxed text-wine/65 sm:mt-3 sm:block">
            {labels.events.subtitle}
          </p>
        </div>

        {allEvents.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-7">
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
          <p className="mx-auto mt-6 max-w-xl rounded-3xl border border-rose/20 bg-beige px-5 py-6 text-center text-base leading-relaxed text-wine/70 sm:mt-8">
            {labels.events.empty}
          </p>
        )}
      </div>
    </section>
  );
}

function HowItWorksDesktop({ labels }: { labels: GirlsOnlyPageLabels }) {
  return (
    <div className="hidden lg:block">
      <div className="mx-auto max-w-2xl text-center">
        <SectionEyebrow>{labels.howItWorks.title}</SectionEyebrow>
        <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
          {labels.howItWorks.title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-wine/65">
          {labels.howItWorks.subtitle}
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-rose/20 bg-beige/90 p-6 text-left shadow-sm sm:p-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose font-serif text-lg font-medium text-cream">
          1
        </span>
        <h3 className="mt-4 font-serif text-lg font-medium text-wine">
          {labels.howItWorks.sharedStep.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-wine/65">
          {labels.howItWorks.sharedStep.description}
        </p>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {labels.howItWorks.paths.map((path) => (
          <div
            key={path.label}
            className="rounded-3xl border border-rose/20 bg-white/80 p-6 shadow-sm sm:p-7"
          >
            <h3 className="font-serif text-lg font-medium text-wine sm:text-xl">
              {path.label}
            </h3>
            <ol className="mt-5 space-y-5">
              {path.steps.map((step, index) => (
                <li key={step.title}>
                  <div className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose/15 font-serif text-sm font-medium text-rose-deep">
                      {index + 2}
                    </span>
                    <div>
                      <h4 className="font-serif text-base font-medium text-wine">
                        {step.title}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-wine/65">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorksMobile({ labels }: { labels: GirlsOnlyPageLabels }) {
  return (
    <details className="group rounded-2xl border border-rose/20 bg-white/80 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left marker:content-none">
        <span className="font-serif text-lg font-medium text-wine">
          {labels.howItWorks.title}
        </span>
        <span
          aria-hidden
          className="text-rose-deep transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-rose/15 px-5 pb-5 pt-4">
        <p className="text-sm leading-relaxed text-wine/65">
          {labels.howItWorks.sharedStep.description}
        </p>
        <ul className="space-y-3">
          {labels.howItWorks.paths.map((path) => (
            <li
              key={path.label}
              className="rounded-xl border border-rose/15 bg-rose-soft/30 px-4 py-3"
            >
              <p className="font-medium text-wine">{path.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-wine/65">
                {path.steps.map((step) => step.title).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function TestimonialsSection({
  labels,
  top,
  bottom,
}: {
  labels: GirlsOnlyPageLabels;
  top: ReturnType<typeof splitGirlsOnlyTestimonialRows>["top"];
  bottom: ReturnType<typeof splitGirlsOnlyTestimonialRows>["bottom"];
}) {
  return (
    <section
      id="social-proof"
      className={`overflow-hidden border-b border-rose/15 bg-gradient-to-b from-rose-soft/50 to-cream ${sectionPad}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>{labels.testimonials.eyebrow}</SectionEyebrow>
          <h2 className="mt-2 font-serif text-xl font-medium tracking-tight text-wine sm:mt-3 sm:text-3xl">
            {labels.testimonials.title}
          </h2>
        </div>
      </div>
      <div className="lg:hidden">
        <TestimonialMarquee
          top={top}
          bottom={bottom}
          fadeFromClassName="from-rose-soft/50"
          cardClassName="border-rose/15 bg-white/90"
          singleRow
        />
      </div>
      <div className="hidden lg:block">
        <TestimonialMarquee
          top={top}
          bottom={bottom}
          fadeFromClassName="from-rose-soft/50"
          cardClassName="border-rose/15 bg-white/90"
        />
      </div>
    </section>
  );
}

export function GirlsOnlyLandingView({
  labels,
  locale,
  allEvents,
}: GirlsOnlyLandingViewProps) {
  const testimonials = getGirlsOnlyTestimonials(locale);
  const toastNotifications = useMemo(
    () => getGirlsOnlyToastNotifications(locale),
    [locale],
  );
  const { top, bottom } = splitGirlsOnlyTestimonialRows(testimonials);
  const trustPills = labels.hero.trustLine.split(" · ");

  const cardProps = {
    statusLabels: labels.status,
    femaleOnlyBadge: labels.femaleOnlyBadge,
    reserveCta: labels.reserveCta,
    viewTableCta: labels.viewTableCta,
    locale,
    socialPromise: labels.socialPromise,
    sourceSection: "agenda_grid" as const,
    compact: true,
  };

  return (
    <>
      <section
        id="top"
        className="relative scroll-mt-20 overflow-hidden border-b border-rose/20 bg-gradient-to-b from-rose-soft via-cream to-cream pt-[4.25rem] sm:pt-24"
      >
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-rose/25 blur-3xl" />
        <div className="absolute -right-16 top-32 h-72 w-72 rounded-full bg-rose-deep/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
          <div className="grid items-center gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
              <GirlsOnlyHeroMedia locale={locale} />
            </div>

            <div className="order-2 lg:order-1">
              <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
                <SectionEyebrow>{labels.hero.eyebrow}</SectionEyebrow>
                <h1 className="mt-3 font-serif text-[1.85rem] font-medium leading-[1.08] tracking-tight text-wine sm:mt-4 sm:text-5xl lg:text-[3.35rem]">
                  {labels.hero.title}
                </h1>

                <p className="mt-3 text-sm font-medium leading-relaxed text-rose-deep sm:mt-4 sm:text-base">
                  {labels.socialPromise}
                </p>

                <div className="mt-5 hidden rounded-3xl border border-rose/25 bg-white/75 px-6 py-5 text-left shadow-[0_12px_40px_rgba(157,77,111,0.08)] backdrop-blur-sm sm:mt-7 sm:px-8 sm:py-6 lg:block">
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

                <div className="mt-5 hidden justify-center lg:flex lg:justify-start">
                  <GirlsOnlyCta href="#events">
                    {labels.finalCta.button}
                  </GirlsOnlyCta>
                </div>

                <ul className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6 sm:gap-2 lg:mt-6 lg:justify-start">
                  {trustPills.map((pill) => (
                    <li key={pill}>
                      <TrustBadge>{pill}</TrustBadge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <TestimonialsSection labels={labels} top={top} bottom={bottom} />
      ) : null}

      <section
        id="how-it-works"
        className={`scroll-mt-20 bg-rose-soft/35 ${sectionPad}`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <HowItWorksMobile labels={labels} />
          <HowItWorksDesktop labels={labels} />
        </div>
      </section>

      <section id="why-join" className={`scroll-mt-20 ${sectionPad} hidden lg:block`}>
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

      <EventsSection
        labels={labels}
        locale={locale}
        allEvents={allEvents}
        cardProps={cardProps}
      />

      <section className="hidden border-t border-rose/20 bg-gradient-to-b from-rose-soft/70 via-rose-soft/40 to-cream py-14 sm:py-16 lg:block">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-8 lg:px-10">
          <h2 className="mx-auto max-w-xl font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
            {labels.finalCta.title}
          </h2>
          <div className="mt-8">
            <GirlsOnlyCta href="#events">{labels.finalCta.button}</GirlsOnlyCta>
          </div>
        </div>
      </section>

      <GirlsOnlyStickyCta label={labels.finalCta.button} />

      {testimonials.length > 0 ? (
        <TestimonialNotificationToasts
          items={toastNotifications}
          justNowLabel={labels.toasts.justNow}
          className="bottom-24 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm"
        />
      ) : null}
    </>
  );
}
