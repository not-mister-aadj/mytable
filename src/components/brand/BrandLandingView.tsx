"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { agendaPath, joinPath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { GirlsOnlyHeroMedia } from "@/components/girls-only/GirlsOnlyHeroMedia";
import { Header } from "@/components/Header";
import { TestimonialMarquee } from "@/components/TestimonialMarquee";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { getBrandLandingTestimonialRows } from "@/data/brand-landing-testimonials";

const ease = [0.22, 1, 0.36, 1] as const;

const pathCtaClassName =
  "relative mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_10px_24px_rgba(90,15,27,0.18)] transition hover:bg-wine hover:shadow-[0_14px_28px_rgba(43,13,18,0.22)]";

export type BrandLandingLabels = {
  brand: string;
  tagline: string;
  line: string;
  cta: string;
  ctaSignedIn: string;
  agendaCta: string;
  howItWorks: {
    title: string;
    subtitle: string;
    meet: { eyebrow: string; title: string; body: string; cta: string };
    culinary: { eyebrow: string; title: string; body: string; cta: string };
  };
  reviewsEyebrow: string;
};

interface BrandLandingViewProps {
  locale: Locale;
  headerDict: Dictionary["header"];
  labels: BrandLandingLabels;
}

export function BrandLandingView({
  locale,
  headerDict,
  labels,
}: BrandLandingViewProps) {
  const { isSignedIn, loading } = useAuthSession();
  const router = useRouter();
  const { culinary, people } = getBrandLandingTestimonialRows(locale);

  function handleCta() {
    if (isSignedIn) {
      router.push(agendaPath(locale));
      return;
    }
    router.push(joinPath(locale));
  }

  return (
    <>
      <Header dict={headerDict} locale={locale} />
      <section className="relative min-h-[100svh] overflow-hidden bg-white">
        {/* Soft warm wash, still bright */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(245,232,224,0.55),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_90%,rgba(246,241,234,0.7),transparent_45%)]" />

        <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pb-20 lg:pt-24">
          <div className="relative z-10 max-w-xl lg:max-w-none">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="font-serif text-[1.85rem] font-medium leading-[1.15] tracking-tight text-wine text-balance sm:text-4xl lg:text-[2.55rem]"
            >
              {labels.tagline}
            </motion.p>

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
              className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <button
                type="button"
                onClick={handleCta}
                disabled={loading}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-burgundy px-8 text-xs font-semibold uppercase tracking-[0.16em] text-cream shadow-[0_12px_28px_rgba(90,15,27,0.22)] transition hover:bg-wine hover:shadow-[0_16px_34px_rgba(43,13,18,0.26)] disabled:opacity-60"
              >
                {isSignedIn ? labels.ctaSignedIn : labels.cta}
                <span aria-hidden className="text-sm leading-none opacity-90">
                  ›
                </span>
              </button>
              <a
                href={agendaPath(locale)}
                className="inline-flex min-h-12 items-center text-xs font-semibold uppercase tracking-[0.16em] text-wine/55 transition hover:text-wine"
              >
                {labels.agendaCta}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.1, ease }}
            className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none"
          >
            <div className="relative aspect-[5/6] overflow-hidden rounded-[2.5rem] shadow-[0_28px_70px_rgba(43,13,18,0.14)] sm:aspect-[4/5] sm:rounded-[3rem] lg:min-h-[34rem] lg:aspect-auto">
              <GirlsOnlyHeroMedia locale={locale} variant="background" />
              <div className="absolute inset-0 bg-gradient-to-t from-wine/25 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative scroll-mt-24 overflow-hidden border-t border-wine/8 bg-white py-20 sm:py-24 lg:py-28"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(197,154,91,0.08),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_80%,rgba(245,232,224,0.65),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease }}
            className="max-w-2xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              MyTable
            </p>
            <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-wine sm:text-5xl lg:text-[3.25rem]">
              {labels.howItWorks.title}
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-wine/50">
              {labels.howItWorks.subtitle}
            </p>
          </motion.div>

          <div className="mt-16 grid gap-0 sm:mt-20 lg:grid-cols-2">
            {[
              {
                key: "meet",
                item: labels.howItWorks.meet,
                index: "01",
                href: joinPath(locale),
              },
              {
                key: "culinary",
                item: labels.howItWorks.culinary,
                index: "02",
                href: agendaPath(locale),
              },
            ].map(({ key, item, index, href }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: 0.08 + i * 0.12, ease }}
                className={`relative py-10 sm:py-12 lg:px-10 lg:py-4 ${
                  i === 0
                    ? "lg:border-r lg:border-wine/10 lg:pl-0"
                    : "border-t border-wine/10 lg:border-t-0 lg:pr-0"
                }`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 right-0 font-serif text-[6.5rem] leading-none text-wine/[0.04] sm:text-[8rem] lg:right-auto lg:-left-2"
                >
                  {index}
                </span>
                <p className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
                  {item.eyebrow}
                </p>
                <h3 className="relative mt-4 font-serif text-3xl font-medium tracking-tight text-wine sm:text-[2rem]">
                  {item.title}
                </h3>
                <div className="relative mt-5 h-px w-12 bg-gold/50" />
                <p className="relative mt-5 max-w-sm text-base leading-relaxed text-wine/55">
                  {item.body}
                </p>
                <Link href={href} className={pathCtaClassName}>
                  {item.cta}
                  <span aria-hidden className="text-sm leading-none opacity-90">
                    ›
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="reviews"
        className="overflow-hidden border-t border-wine/8 bg-cream py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            {labels.reviewsEyebrow}
          </p>
        </div>
        <TestimonialMarquee
          top={culinary}
          bottom={people}
          fadeFromClassName="from-cream"
          cardClassName="border-wine/10 bg-white/95"
        />
      </section>
    </>
  );
}
