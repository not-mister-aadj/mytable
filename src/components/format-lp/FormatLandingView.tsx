"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { FormatLpLabels } from "@/i18n/format-lp.types";
import type { WaitlistInterestId } from "@/i18n/waitlist-page.types";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SundayTableHeroGallery } from "@/components/sunday-table-lp/SundayTableHeroGallery";
import { SundayTableWaitlistModal } from "@/components/sunday-table-lp/SundayTableWaitlistModal";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";
import { getGirlsOnlyHowItWorksImage } from "@/data/girls-only-media";
import { getFormatProofSlideshowImages } from "@/data/format-proof-media";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

function PrimaryCta({
  label,
  hint,
  onClick,
  variant = "burgundy",
  className = "",
}: {
  label: string;
  hint?: string;
  onClick?: () => void;
  variant?: "burgundy" | "cream";
  className?: string;
}) {
  const isCream = variant === "cream";
  return (
    <div className={`w-full min-w-0 sm:w-auto ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`cta-lift inline-flex min-h-[3.25rem] w-full max-w-full flex-col items-center justify-center rounded-full px-9 py-3 text-center sm:min-w-[15.5rem] sm:w-auto ${
          isCream
            ? "cta-lift-cream bg-cream text-wine shadow-[0_14px_32px_rgba(0,0,0,0.22)] hover:bg-white"
            : "cta-lift-burgundy bg-burgundy text-cream shadow-[0_14px_34px_rgba(90,15,27,0.28)] hover:bg-wine"
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
      </button>
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

/** Shared landing page for the single-experience formats (wine tasting, wine
 * walk, chef's special) — a lighter sibling of SundayTableLpView, kept as a
 * separate component rather than a shared base to avoid any regression risk
 * to the already-live, tested Sunday Table funnel. */
export function FormatLandingView({
  locale,
  labels,
  headerDict,
  footerDict,
  waitlistInterest,
}: {
  locale: Locale;
  labels: FormatLpLabels;
  headerDict: Dictionary["header"];
  footerDict: Dictionary["footer"];
  waitlistInterest: WaitlistInterestId;
}) {
  const reduceMotion = useReducedMotion();
  const { culinary } = getBrandLandingTestimonialRows(locale);
  const proofImages = getFormatProofSlideshowImages(locale);
  const howItWorksImage = getGirlsOnlyHowItWorksImage(locale);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  function openWaitlist(cta: string, source: string) {
    trackSundayTableCtaClicked({ cta, source, locale });
    setWaitlistOpen(true);
  }

  return (
    <>
      <SundayTableWaitlistModal
        labels={labels.waitlist}
        locale={locale}
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        presetInterest={waitlistInterest}
      />
      <Header dict={headerDict} locale={locale} />

      <div className="overflow-x-clip">
        {/* Hero */}
        <section className="relative overflow-x-clip bg-white lg:min-h-[100svh]">
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
                {labels.headline}
              </motion.h1>

              <motion.p
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.12, ease }}
                className="mt-4 w-full max-w-lg text-[0.95rem] leading-relaxed text-wine/55 text-pretty sm:mt-5 sm:text-[1.05rem]"
              >
                {labels.line}
              </motion.p>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16, ease }}
                className="mt-8 hidden flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3 lg:flex"
              >
                <div className="hidden lg:block">
                  <PrimaryCta
                    label={labels.cta}
                    hint={labels.ctaHint}
                    onClick={() => openWaitlist("hero_primary", "format_hero")}
                  />
                </div>
                <a
                  href="#included"
                  onClick={() =>
                    trackSundayTableCtaClicked({
                      cta: "hero_secondary",
                      source: "format_hero",
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
              <SundayTableHeroGallery locale={locale} images={proofImages} />
            </motion.div>
          </div>
        </section>

        {/* Proof — real testimonials, right after the hero, before we explain anything */}
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
              top={culinary}
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
              onClick={() => openWaitlist("proof_cta", "format_proof")}
            />
          </div>
        </section>

        {/* How it works */}
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

        {/* What's included */}
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
                      openWaitlist("included_cta", "format_included")
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

        {/* FAQ */}
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
              {labels.final.title}
            </motion.h2>
            <p className="mx-auto mt-3 max-w-md text-base text-wine/55 sm:mt-4">
              {labels.final.body}
            </p>
            <div className="mt-8 hidden justify-center sm:mt-10 lg:flex">
              <PrimaryCta
                label={labels.final.cta}
                hint={labels.ctaHint}
                onClick={() => openWaitlist("final_cta", "format_final")}
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
        style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
        role="region"
        aria-label={labels.cta}
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5">
          <PrimaryCta
            label={labels.cta}
            hint={labels.ctaHint}
            onClick={() => openWaitlist("mobile_sticky", "format_mobile_sticky")}
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}
