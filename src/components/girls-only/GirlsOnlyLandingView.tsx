import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { girlsOnlyCityPath } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import {
  getGirlsOnlyTestimonials,
  splitGirlsOnlyTestimonialRows,
} from "@/data/girls-only-testimonials";
import { listGirlsOnlyCities } from "@/data/girls-only-cities";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { HomeIntentHero } from "@/components/girls-only/HomeIntentHero";
import { GirlsOnlyStickyCta } from "@/components/girls-only/GirlsOnlyStickyCta";
import { GirlsOnlyCta } from "@/components/girls-only/GirlsOnlyCta";
import { GirlsOnlyFinalCtaBanner } from "@/components/girls-only/GirlsOnlyFinalCtaBanner";
import { getGirlsOnlyHowItWorksImage } from "@/data/girls-only-media";
import { GirlsOnlyPremiumJourneySection } from "@/components/girls-only/GirlsOnlyTrackedSections";

interface GirlsOnlyLandingViewProps {
  labels: GirlsOnlyPageLabels;
  locale: Locale;
  agendaHref: string;
}

const sectionPad = "py-8 sm:py-12 lg:py-16";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
      {children}
    </p>
  );
}

function HowItWorksSection({
  labels,
  locale,
}: {
  labels: GirlsOnlyPageLabels;
  locale: Locale;
}) {
  const { howItWorks } = labels;
  const howItWorksImage = getGirlsOnlyHowItWorksImage(locale);

  return (
    <section
      id="how-it-works"
      className={`scroll-mt-20 bg-beige/60 ${sectionPad}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
          <figure className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(43,13,18,0.14)]">
              <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5]">
                <Image
                  src={howItWorksImage.src}
                  alt={howItWorksImage.alt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 480px"
                  className="object-cover"
                />
              </div>
            </div>
          </figure>

          <div className="text-center lg:text-left">
            <SectionEyebrow>{howItWorks.eyebrow}</SectionEyebrow>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              {howItWorks.title}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-wine/70 sm:text-lg lg:mx-0">
              {howItWorks.subtitle}
            </p>

            <ul className="mx-auto mt-6 max-w-md space-y-3 text-left lg:mx-0 lg:max-w-lg">
              {howItWorks.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-snug text-wine/85 sm:text-base"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wine text-[10px] text-cream"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex justify-center lg:justify-start">
              <GirlsOnlyCta href="#top" className="w-full sm:w-auto">
                {howItWorks.cta}
              </GirlsOnlyCta>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GirlsOnlyFaq({ labels }: { labels: GirlsOnlyPageLabels }) {
  return (
    <section
      id="faq"
      className={`scroll-mt-20 border-t border-wine/10 bg-beige/50 ${sectionPad}`}
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
              className="group rounded-2xl border border-wine/10 bg-white/90 px-5 py-4 transition-shadow open:shadow-sm sm:px-6"
            >
              <summary className="cursor-pointer list-none font-medium text-wine marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="shrink-0 font-serif text-xl text-burgundy transition-transform group-open:rotate-45">
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
          <p className="mt-3 text-base leading-relaxed text-wine/70">
            {labels.benefits.subtitle}
          </p>
        </div>
        <ul className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6">
          {labels.benefits.items.map((item) => (
            <li
              key={item.title}
              className="rounded-3xl border border-wine/10 bg-beige p-6 sm:p-7"
            >
              <h3 className="font-serif text-lg font-medium leading-snug text-wine">
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
      className={`overflow-hidden border-b border-wine/10 bg-beige/40 ${sectionPad}`}
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
          fadeFromClassName="from-beige/40"
          cardClassName="border-wine/10 bg-white/95"
          singleRow
        />
      </div>
      <div className="hidden lg:block">
        <TestimonialMarquee
          top={top}
          bottom={bottom}
          fadeFromClassName="from-beige/40"
          cardClassName="border-wine/10 bg-white/95"
        />
      </div>
    </section>
  );
}

export function GirlsOnlyLandingView({
  labels,
  locale,
  agendaHref,
}: GirlsOnlyLandingViewProps) {
  const testimonials = getGirlsOnlyTestimonials(locale);
  const { top, bottom } = splitGirlsOnlyTestimonialRows(testimonials);
  const howItWorksImage = getGirlsOnlyHowItWorksImage(locale);

  return (
    <>
      <HomeIntentHero
        labels={labels}
        locale={locale}
        agendaHref={agendaHref}
      />

      <HowItWorksSection labels={labels} locale={locale} />

      <GirlsOnlyPremiumJourneySection
        labels={labels}
        agendaHref={agendaHref}
        locale={locale}
      />

      {testimonials.length > 0 ? (
        <TestimonialsSection labels={labels} top={top} bottom={bottom} />
      ) : null}

      <BenefitsSection labels={labels} />

      <section
        id="cities"
        className="scroll-mt-20 border-t border-wine/10 bg-cream py-10 sm:py-12"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {locale === "nl" ? "Kies jouw stad" : "Choose your city"}
          </p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-3.5">
            {listGirlsOnlyCities().map((city) => (
              <li key={city.slug}>
                <Link
                  href={girlsOnlyCityPath(locale, city.slug)}
                  className="inline-flex min-h-11 items-center rounded-full border border-wine/12 bg-beige px-5 py-2.5 text-sm font-medium text-wine transition hover:border-burgundy/40 hover:bg-white"
                >
                  {city.cityName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <GirlsOnlyFaq labels={labels} />

      <GirlsOnlyFinalCtaBanner
        title={labels.finalCta.title}
        subtitle={labels.finalCta.subtitle}
        ctaLabel={labels.cta.choosePath}
        ctaHref="#top"
        imageAlt={howItWorksImage.alt}
      />

      <GirlsOnlyStickyCta
        label={labels.cta.choosePath}
        href="#top"
      />
    </>
  );
}
