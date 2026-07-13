"use client";

import type { Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import {
  getGirlsOnlyTestimonials,
  splitGirlsOnlyTestimonialRows,
} from "@/data/girls-only-testimonials";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { Button } from "@/components/ui/Button";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { GirlsOnlyHeroMedia } from "@/components/girls-only/GirlsOnlyHeroMedia";
import { GirlsOnlyUpcomingEvents } from "@/components/girls-only/GirlsOnlyUpcomingEvents";
import { GirlsOnlyStickyCta, GIRLS_ONLY_HERO_CTA_ID } from "@/components/girls-only/GirlsOnlyStickyCta";

interface GirlsOnlyLandingViewProps {
  labels: GirlsOnlyPageLabels;
  locale: Locale;
  upcomingEvents: EnrichedExperience[];
  agendaHref: string;
  primaryCta: {
    href: string;
    label: string;
  };
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

function HowItWorksSection({
  labels,
  upcomingEvents,
  locale,
  agendaHref,
}: {
  labels: GirlsOnlyPageLabels;
  upcomingEvents: EnrichedExperience[];
  locale: Locale;
  agendaHref: string;
}) {
  return (
    <section
      id="how-it-works"
      className={`scroll-mt-20 bg-rose-soft/35 ${sectionPad}`}
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
            {labels.howItWorks.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-wine/65 sm:text-base">
            {labels.howItWorks.subtitle}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-rose/20 bg-white/90 p-5 sm:mt-6 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">
            {labels.howItWorks.includedTitle}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {labels.howItWorks.includedItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm leading-snug text-wine/80"
              >
                <span aria-hidden className="mt-0.5 text-rose-deep">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="my-5 border-t border-rose/15" />

          <ol className="space-y-4">
            {labels.howItWorks.steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose font-serif text-sm font-medium text-cream">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-medium text-wine">{step.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-wine/65">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="px-5 sm:px-8 lg:px-10">
        <GirlsOnlyUpcomingEvents
          events={upcomingEvents}
          locale={locale}
          labels={labels}
          agendaHref={agendaHref}
        />
      </div>
    </section>
  );
}

function GirlsOnlyFaq({ labels }: { labels: GirlsOnlyPageLabels }) {
  return (
    <section
      id="faq"
      className={`scroll-mt-20 border-t border-rose/15 bg-beige/40 ${sectionPad}`}
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
            {labels.faq.title}
          </h2>
        </div>
        <div className="mt-6 space-y-2.5 sm:mt-10 sm:space-y-3">
          {labels.faq.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-rose/20 bg-white/80 px-5 py-4 transition-shadow open:shadow-sm sm:px-6"
            >
              <summary className="cursor-pointer list-none font-medium text-wine marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="shrink-0 font-serif text-xl text-rose-deep transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 pb-1 text-sm leading-relaxed text-wine/75">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection({ labels }: { labels: GirlsOnlyPageLabels }) {
  return (
    <section id="why-join" className={`scroll-mt-20 ${sectionPad}`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
            {labels.benefits.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-wine/65">
            {labels.benefits.subtitle}
          </p>
        </div>
        <ul className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6">
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
  );
}

function HeroCtaBlock({
  primaryCta,
}: {
  primaryCta: GirlsOnlyLandingViewProps["primaryCta"];
}) {
  return (
    <div
      id={GIRLS_ONLY_HERO_CTA_ID}
      className="mt-5 flex flex-col items-center gap-3 sm:mt-6 lg:items-start"
    >
      <GirlsOnlyCta href={primaryCta.href} className="w-full sm:w-auto">
        {primaryCta.label}
      </GirlsOnlyCta>
    </div>
  );
}

function FounderStorySection({ labels }: { labels: GirlsOnlyPageLabels }) {
  return (
    <section
      id="founder"
      className={`scroll-mt-20 border-t border-rose/15 bg-cream ${sectionPad}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="order-2 lg:order-1">
            <SectionEyebrow>{labels.founderStory.eyebrow}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
              {labels.founderStory.title}
            </h2>
            <div className="mt-4 space-y-4">
              {labels.founderStory.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-relaxed text-wine/75 sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <p className="mt-5 font-serif text-base font-medium text-rose-deep sm:text-lg">
              {labels.founderStory.signOff}
            </p>
          </div>

          <figure className="order-1 mx-auto w-full max-w-md overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(157,77,111,0.18)] lg:order-2 lg:max-w-none">
            <div className="aspect-[4/5] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/girls-only/elif-siraadj.png"
                alt={labels.founderStory.imageAlt}
                className="h-full w-full object-cover object-[42%_45%]"
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
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
  upcomingEvents,
  agendaHref,
  primaryCta,
}: GirlsOnlyLandingViewProps) {
  const testimonials = getGirlsOnlyTestimonials(locale);
  const { top, bottom } = splitGirlsOnlyTestimonialRows(testimonials);
  const trustPills = labels.hero.trustLine.split(" · ");

  return (
    <>
      <section
        id="top"
        className="relative scroll-mt-20 overflow-hidden border-b border-rose/20 bg-gradient-to-b from-rose-soft via-cream to-cream pt-[4.25rem] sm:pt-24"
      >
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-rose/25 blur-3xl" />
        <div className="absolute -right-16 top-32 h-72 w-72 rounded-full bg-rose-deep/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-12 lg:px-10 lg:py-16">
          <div className="grid items-start gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div className="order-2 lg:order-1">
              <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
                <SectionEyebrow>{labels.hero.eyebrow}</SectionEyebrow>
                <h1 className="mt-3 font-serif text-[1.85rem] font-medium leading-[1.08] tracking-tight text-wine sm:mt-4 sm:text-5xl lg:text-[3.35rem]">
                  {labels.hero.headlineLine1}
                  <br />
                  {labels.hero.headlineLine2}
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-wine/80 sm:mt-4 sm:text-lg">
                  {labels.hero.subtitle}
                </p>

                <p className="mt-3 text-sm font-medium leading-relaxed text-wine sm:text-base">
                  {labels.hero.painHeadline}
                </p>

                <HeroCtaBlock primaryCta={primaryCta} />

                <ul className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6 sm:gap-2 lg:justify-start">
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

      <HowItWorksSection
        labels={labels}
        upcomingEvents={upcomingEvents}
        locale={locale}
        agendaHref={agendaHref}
      />

      {testimonials.length > 0 ? (
        <TestimonialsSection labels={labels} top={top} bottom={bottom} />
      ) : null}

      <BenefitsSection labels={labels} />

      <GirlsOnlyFaq labels={labels} />

      <FounderStorySection labels={labels} />

      <section className="hidden border-t border-rose/20 bg-gradient-to-b from-rose-soft/70 via-rose-soft/40 to-cream py-14 sm:py-16 lg:block">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-8 lg:px-10">
          <h2 className="mx-auto max-w-xl font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
            {labels.finalCta.title}
          </h2>
          <div className="mt-8">
            <GirlsOnlyCta href={primaryCta.href}>{primaryCta.label}</GirlsOnlyCta>
          </div>
        </div>
      </section>

      <GirlsOnlyStickyCta label={primaryCta.label} href={primaryCta.href} />
    </>
  );
}
