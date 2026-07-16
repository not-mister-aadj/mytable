"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { GirlsOnlyCityPageLabels } from "@/i18n/girls-only-city.types";
import {
  getMetaBrowserCookies,
  getMetaEventSourceUrl,
} from "@/lib/analytics/metaCookies";
import { trackMetaLead } from "@/lib/analytics/metaTracking";
import { trackEmailSignupCompleted } from "@/lib/posthog/analytics";
import { Button } from "@/components/ui/Button";

interface GirlsOnlyCityPrioritySignupProps {
  labels: GirlsOnlyCityPageLabels["priority"];
  locale: Locale;
  cityName: string;
  heroImage: string;
  hook: string;
}

export function GirlsOnlyCityPrioritySignup({
  labels,
  locale,
  cityName,
  heroImage,
  hook,
}: GirlsOnlyCityPrioritySignupProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          cities: [cityName],
          locale,
          source: "newsletter",
          signupSource: "priority_list",
          meta: {
            ...getMetaBrowserCookies(),
            eventSourceUrl: getMetaEventSourceUrl(),
          },
        }),
      });

      if (!res.ok) {
        setError(labels.error);
        return;
      }

      const payload = (await res.json()) as { id?: string };

      trackEmailSignupCompleted({
        email,
        city: cityName,
        language: locale,
        source_section: "girls_only_city_priority",
      });

      if (payload.id) {
        trackMetaLead({
          source: "newsletter",
          city: cityName,
          waitlistId: payload.id,
        });
      }

      setSubmitted(true);
    } catch {
      setError(labels.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      id="priority"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-24"
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-soft/80 via-cream to-beige shadow-[0_28px_70px_rgba(90,15,27,0.1)]">
        <div
          className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-rose/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-rose-deep/10 blur-3xl"
          aria-hidden
        />

        <div className="relative grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="relative min-h-[14rem] overflow-hidden sm:min-h-[16rem] lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wine/80 via-wine/35 to-wine/20 lg:bg-gradient-to-r lg:from-wine/15 lg:via-wine/45 lg:to-wine/75" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-soft">
                {labels.eyebrow}
              </p>
              <p className="mt-3 font-serif text-4xl font-medium leading-none tracking-tight text-cream sm:text-5xl">
                {cityName}
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/75">
                {hook}
              </p>
            </div>
          </div>

          <div className="relative flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:px-11 lg:py-12">
            <h3 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-[1.85rem] sm:leading-tight">
              {labels.title}
            </h3>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-wine/65 sm:text-[15px]">
              {labels.subtitle}
            </p>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-8 rounded-2xl border border-rose/20 bg-white/70 px-5 py-6 text-center"
                  role="status"
                >
                  <p className="font-serif text-xl text-wine">{labels.success}</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="city-priority-name"
                        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-deep"
                      >
                        {labels.nameLabel}
                      </label>
                      <input
                        id="city-priority-name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        disabled={isSubmitting}
                        placeholder={labels.namePlaceholder}
                        className="mt-2 w-full rounded-2xl border border-rose/15 bg-white/80 px-4 py-3.5 text-sm text-wine outline-none transition placeholder:text-wine/35 focus:border-rose/50 focus:bg-white focus:ring-2 focus:ring-rose/15 disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="city-priority-email"
                        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-deep"
                      >
                        {labels.emailLabel}
                      </label>
                      <input
                        id="city-priority-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        disabled={isSubmitting}
                        placeholder={labels.emailPlaceholder}
                        className="mt-2 w-full rounded-2xl border border-rose/15 bg-white/80 px-4 py-3.5 text-sm text-wine outline-none transition placeholder:text-wine/35 focus:border-rose/50 focus:bg-white focus:ring-2 focus:ring-rose/15 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {error ? (
                    <p className="text-sm text-rose-deep" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="flex flex-col items-start gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      type="submit"
                      className={`bg-rose px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream shadow-[0_12px_28px_rgba(157,77,111,0.28)] transition hover:bg-rose-deep hover:shadow-[0_16px_32px_rgba(157,77,111,0.34)] sm:text-sm ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <span aria-hidden className="mr-2 opacity-90">
                        ›
                      </span>
                      {isSubmitting ? "…" : labels.cta}
                    </Button>
                    <p className="max-w-[14rem] text-xs leading-snug text-wine/45 sm:text-right">
                      {labels.privacyNote}
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
