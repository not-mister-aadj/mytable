"use client";

import { motion } from "framer-motion";
import { Suspense, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { SundayTableHeroGallery } from "@/components/sunday-table-lp/SundayTableHeroGallery";
import { SundayTableWaitlistModal } from "@/components/sunday-table-lp/SundayTableWaitlistModal";
import { WaitlistAutoOpen } from "@/components/WaitlistAutoOpen";
import { Header } from "@/components/Header";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import { getFormatProofSlideshowImages } from "@/data/format-proof-media";
import { getSundayTableLpLabels } from "@/i18n/get-sunday-table-lp";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";
import type { SoldOutSunday } from "@/lib/home-sold-out";
import { ease } from "@/lib/motion";

export type FinalCaptureLabels = {
  eyebrow: string;
  headline: string;
  body: string;
  submit: string;
  privacyNote: string;
};

export type BrandLandingLabels = {
  brand: string;
  earlyAccessBadge: string;
  belief: string;
  line: string;
  whyHeadline: string;
  whyParagraphs: string[];
  /** The Sundays that are full, then how you get in. */
  soldOutEyebrow: string;
  soldOutWord: string;
  stepsEyebrow: string;
  steps: string[];
  reviewsEyebrow: string;
  finalCapture: FinalCaptureLabels;
};

interface BrandLandingViewProps {
  locale: Locale;
  headerDict: Dictionary["header"];
  labels: BrandLandingLabels;
  soldOut: SoldOutSunday[];
}

export function BrandLandingView({
  locale,
  headerDict,
  labels,
  soldOut,
}: BrandLandingViewProps) {
  const { culinary, people } = getBrandLandingTestimonialRows(locale);
  const waitlistLabels = getSundayTableLpLabels(locale).waitlist;
  const altWaitlistLabels = getSundayTableLpLabels(
    locale === "en" ? "nl" : "en",
  ).waitlist;
  const heroImages = getFormatProofSlideshowImages(locale);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  function openWaitlist(cta: string, source: string) {
    trackSundayTableCtaClicked({ cta, source, locale });
    setWaitlistOpen(true);
  }

  const dateLocale = locale === "en" ? "en-GB" : "nl-NL";
  const dayOf = new Intl.DateTimeFormat(dateLocale, { day: "numeric", timeZone: "Europe/Amsterdam" });
  const monthOf = new Intl.DateTimeFormat(dateLocale, { month: "short", timeZone: "Europe/Amsterdam" });

  return (
    <>
      <Suspense fallback={null}>
        <WaitlistAutoOpen
          onTrigger={() => openWaitlist("auto_open", "direct_link")}
        />
      </Suspense>
      <Header dict={headerDict} locale={locale} />

      {/* Hero — the belief, not a product pitch */}
      <section className="relative min-h-[100svh] overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,232,224,0.55),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(246,241,234,0.7),transparent_45%)]" />

        <div className="relative mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pb-20 lg:pt-24">
          <div className="relative z-10 max-w-xl lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-wine/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
              {labels.earlyAccessBadge}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06, ease }}
              className="mt-4 font-serif text-[1.85rem] font-medium leading-[1.15] tracking-tight text-wine text-balance sm:text-4xl lg:text-[2.55rem]"
            >
              {labels.belief}
            </motion.h1>

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
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <button
                type="button"
                onClick={() => openWaitlist("hero_primary", "brand_hero")}
                className="cta-lift cta-lift-burgundy inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition hover:bg-wine"
              >
                {headerDict.nav.waitlistCta}
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.1, ease }}
            className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none"
          >
            <SundayTableHeroGallery
              locale={locale}
              images={heroImages}
              quality={100}
            />
          </motion.div>
        </div>
      </section>

      {/* Full Sundays, then the three steps in */}
      <section className="relative overflow-hidden border-t border-wine/8 bg-cream py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(197,154,91,0.10),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:items-start lg:gap-16 lg:px-10">
          {soldOut.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                {labels.soldOutEyebrow}
              </p>
              <ul className="mt-6 overflow-hidden rounded-[1.75rem] border border-wine/10 bg-white/80 shadow-[0_18px_44px_rgba(43,13,18,0.10)]">
                {soldOut.map((sunday, index) => {
                  const date = new Date(sunday.startsAt);
                  return (
                    <li
                      key={`${sunday.city}-${sunday.startsAt}`}
                      className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${index > 0 ? "border-t border-wine/8" : ""}`}
                    >
                      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-cream text-wine">
                        <span className="font-serif text-2xl leading-none">{dayOf.format(date)}</span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-wine/50">
                          {monthOf.format(date).replace(".", "")}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 font-serif text-[1.35rem] leading-tight tracking-tight text-wine">
                        {sunday.city}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-wine/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-wine/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-burgundy" aria-hidden />
                        {labels.soldOutWord}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ) : null}

          <div className={soldOut.length > 0 ? "" : "lg:col-span-2 lg:mx-auto lg:max-w-md"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.stepsEyebrow}
            </p>
            <ol className="relative mt-6">
              <span className="absolute bottom-6 left-[1.4rem] top-6 w-px bg-gold/35" aria-hidden />
              {labels.steps.map((step, index) => (
                <motion.li
                  key={step}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease }}
                  className="relative flex items-center gap-5 py-3.5"
                >
                  <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-cream font-serif text-xl text-gold">
                    {index + 1}
                  </span>
                  <p className="font-serif text-xl leading-snug tracking-tight text-wine sm:text-[1.4rem]">
                    {step}
                  </p>
                </motion.li>
              ))}
            </ol>
            <div className="mt-8 hidden lg:block">
              <button
                type="button"
                onClick={() => openWaitlist("steps", "brand_steps")}
                className="cta-lift cta-lift-burgundy inline-flex min-h-12 items-center justify-center rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition hover:bg-wine"
              >
                {headerDict.nav.waitlistCta}
              </button>
            </div>
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

      {/* Why — the founder reason, once you already know what we offer and trust it */}
      <section className="relative overflow-hidden bg-wine py-16 text-cream sm:py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(197,154,91,0.16),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
            className="font-serif text-3xl font-medium leading-[1.15] tracking-tight text-balance sm:text-4xl lg:text-[2.35rem]"
          >
            {labels.whyHeadline}
          </motion.h2>

          <div className="space-y-5">
            {labels.whyParagraphs.map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.08, ease }}
                className="text-[15px] leading-relaxed text-cream/70 sm:text-base"
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      {/* Final capture — the last, most direct ask before the footer */}
      <section
        id="waitlist"
        className="relative scroll-mt-24 overflow-hidden border-t border-wine/8 bg-cream py-16 sm:py-20 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_100%,rgba(197,154,91,0.12),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              {labels.finalCapture.eyebrow}
            </p>
            <h2 className="mt-3 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-wine text-balance sm:text-[2.75rem]">
              {labels.finalCapture.headline}
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-wine/70">
              {labels.finalCapture.body}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.08, ease }}
            className="flex flex-col items-start justify-center gap-3 rounded-3xl border border-wine/10 bg-white/60 p-6 sm:p-8"
          >
            <button
              type="button"
              onClick={() => openWaitlist("final_capture", "brand_final")}
              className="cta-lift cta-lift-burgundy inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition hover:bg-wine"
            >
              {labels.finalCapture.submit}
            </button>
            <p className="w-full text-center text-[11px] text-wine/40">
              {labels.finalCapture.privacyNote}
            </p>
          </motion.div>
        </div>
      </section>

      <div
        className="fixed inset-x-0 bottom-0 z-[48] border-t border-wine/10 bg-cream/97 shadow-[0_-12px_36px_rgba(43,13,18,0.14)] backdrop-blur-md lg:hidden"
        style={{
          paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))",
        }}
        role="region"
        aria-label={headerDict.nav.waitlistCta}
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5">
          <button
            type="button"
            onClick={() => openWaitlist("mobile_sticky", "brand_sticky")}
            className="cta-lift cta-lift-burgundy inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] transition hover:bg-wine"
          >
            {headerDict.nav.waitlistCta}
          </button>
        </div>
      </div>

      <SundayTableWaitlistModal
        labels={waitlistLabels}
        altLabels={altWaitlistLabels}
        locale={locale}
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        // Sunday Social is what the ads sell; pre-selecting it saves the
        // visitor a choice. They can still pick other formats or untick it.
        presetInterest="sunday_table"
      />
    </>
  );
}
