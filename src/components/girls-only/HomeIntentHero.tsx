"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { clubmemberPath } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { GirlsOnlyHeroMedia } from "@/components/girls-only/GirlsOnlyHeroMedia";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";

type PathId = "meet" | "culinary";

const ease = [0.22, 1, 0.36, 1] as const;

interface HomeIntentHeroProps {
  labels: GirlsOnlyPageLabels;
  locale: Locale;
  agendaHref: string;
}

export function HomeIntentHero({
  labels,
  locale,
  agendaHref,
}: HomeIntentHeroProps) {
  const [path, setPath] = useState<PathId | null>(null);
  const intent = labels.intent;
  const meetHref = clubmemberPath(locale);
  const culinaryHref = agendaHref;
  const trustPills = labels.hero.trustLine.split(" · ");
  const active = path === "meet" ? intent.meet : path === "culinary" ? intent.culinary : null;

  const selectPath = (next: PathId) => {
    setPath(next);
    trackSundayTableCtaClicked({
      cta: next === "meet" ? "intent_meet" : "intent_culinary",
      source: "home_intent",
      locale,
    });
    try {
      sessionStorage.setItem("mytable_home_intent", next);
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      id="top"
      className="relative scroll-mt-20 overflow-hidden border-b border-wine/10 bg-wine"
    >
      <div className="absolute inset-0">
        <GirlsOnlyHeroMedia locale={locale} variant="background" />
        <div className="absolute inset-0 bg-gradient-to-b from-wine/75 via-wine/82 to-wine/92" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(193,154,107,0.22),_transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 pb-14 pt-[5.5rem] sm:px-8 sm:pb-16 sm:pt-28 lg:px-10 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          className="text-center"
        >
          <p className="font-serif text-4xl font-medium tracking-tight text-cream sm:text-5xl lg:text-[3.5rem]">
            {intent.brand}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            {labels.hero.microcopy}
          </p>
          <h1 className="mt-6 font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-cream sm:text-4xl lg:text-[2.75rem]">
            {intent.question}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-cream/75 sm:text-lg">
            {intent.subtitle}
          </p>
        </motion.div>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
          {(
            [
              { key: "meet" as const, copy: intent.meet },
              { key: "culinary" as const, copy: intent.culinary },
            ] as const
          ).map(({ key, copy }, index) => {
            const selected = path === key;
            return (
              <motion.button
                key={key}
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 + index * 0.06, ease }}
                onClick={() => selectPath(key)}
                aria-pressed={selected}
                className={`group rounded-3xl border px-5 py-6 text-left transition sm:px-6 sm:py-7 ${
                  selected
                    ? "border-gold/50 bg-cream text-wine shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
                    : "border-cream/20 bg-cream/8 text-cream backdrop-blur-sm hover:border-cream/40 hover:bg-cream/14"
                }`}
              >
                <span
                  className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                    selected ? "text-gold" : "text-gold/90"
                  }`}
                >
                  {key === "meet" ? "01" : "02"}
                </span>
                <span
                  className={`mt-2 block font-serif text-2xl font-medium leading-snug sm:text-[1.65rem] ${
                    selected ? "text-wine" : "text-cream"
                  }`}
                >
                  {copy.title}
                </span>
                <span
                  className={`mt-2 block text-sm leading-relaxed sm:text-[15px] ${
                    selected ? "text-wine/70" : "text-cream/70"
                  }`}
                >
                  {copy.description}
                </span>
              </motion.button>
            );
          })}
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {trustPills.map((pill) => (
            <li
              key={pill}
              className="rounded-full border border-cream/20 bg-cream/10 px-3 py-1 text-[11px] font-medium text-cream/80 backdrop-blur-sm sm:text-xs"
            >
              {pill}
            </li>
          ))}
        </ul>

        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 14, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease }}
              className="mt-8 overflow-hidden sm:mt-10"
            >
              <div className="rounded-[1.75rem] border border-cream/15 bg-cream px-6 py-7 text-wine shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:px-9 sm:py-9">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                      {active.detailEyebrow}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
                      {active.detailTitle}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPath(null)}
                    className="text-xs font-medium text-wine/50 underline-offset-4 hover:text-wine hover:underline"
                  >
                    {intent.changePath}
                  </button>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-wine/70 sm:text-base">
                  {active.detailBody}
                </p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {active.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2.5 text-sm leading-snug text-wine/85"
                    >
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wine text-[10px] text-cream"
                      >
                        ✓
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={path === "meet" ? meetHref : culinaryHref}
                    onClick={() =>
                      trackSundayTableCtaClicked({
                        cta:
                          path === "meet"
                            ? "intent_meet_waitlist"
                            : "intent_culinary_agenda",
                        source: "home_intent_detail",
                        locale,
                      })
                    }
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-wine px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218]"
                  >
                    {active.primaryCta}
                  </Link>
                  {path === "meet" ? (
                    <a
                      href="#how-it-works"
                      className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-medium text-wine/65 underline-offset-4 hover:text-wine hover:underline"
                    >
                      {active.secondaryCta}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectPath("meet")}
                      className="inline-flex min-h-12 items-center justify-center px-2 text-sm font-medium text-wine/65 underline-offset-4 hover:text-wine hover:underline"
                    >
                      {active.secondaryCta}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
