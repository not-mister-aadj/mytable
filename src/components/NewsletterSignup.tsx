"use client";

import { FormEvent, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { AnalyticsSourceSection } from "@/lib/posthog/events";
import {
  trackCityFilterChanged,
  trackEmailSignupCompleted,
} from "@/lib/posthog/analytics";
import { trackMetaLead } from "@/lib/analytics/metaTracking";
import {
  getMetaBrowserCookies,
  getMetaEventSourceUrl,
} from "@/lib/analytics/metaCookies";
import { Button } from "./ui/Button";
import { SectionHeading } from "./ui/SectionHeading";

interface NewsletterSignupProps {
  dict: Dictionary["newsletter"];
  locale: Locale;
  sourceSection?: AnalyticsSourceSection;
}

export function NewsletterSignup({
  dict,
  locale,
  sourceSection = "home",
}: NewsletterSignupProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState(dict.cities[0] ?? "");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const selectedCity = String(data.get("city") ?? city).trim();

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          city: selectedCity,
          locale,
          source: sourceSection === "home" ? "newsletter" : "waitlist",
          meta: {
            ...getMetaBrowserCookies(),
            eventSourceUrl: getMetaEventSourceUrl(),
          },
        }),
      });

      if (!res.ok) {
        setError(dict.error);
        return;
      }

      const data = (await res.json()) as { id?: string };

      trackEmailSignupCompleted({
        email,
        city: selectedCity,
        language: locale,
        source_section: sourceSection,
      });
      if (data.id) {
        trackMetaLead({
          source: sourceSection === "home" ? "newsletter" : "waitlist",
          city: selectedCity,
          waitlistId: data.id,
        });
      }
      setSubmitted(true);
    } catch {
      setError(dict.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCityChange(nextCity: string) {
    trackCityFilterChanged({
      selected_city: nextCity,
      previous_city: city,
      page_path: window.location.pathname,
    });
    setCity(nextCity);
  }

  return (
    <section id="newsletter" className="scroll-mt-24 py-8 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-burgundy px-5 py-8 text-cream shadow-[0_24px_60px_rgba(90,15,27,0.2)] sm:rounded-3xl sm:px-12 sm:py-16">
          <div className="mx-auto max-w-xl text-center">
            <SectionHeading
              title={dict.title}
              subtitle={dict.subtitle}
              align="center"
              compact
              className="[&_h2]:text-cream [&_p]:text-cream/80"
            />

            {submitted ? (
              <p className="mt-6 text-base text-cream/90 sm:mt-8 sm:text-lg" role="status">
                {dict.success}
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-end sm:justify-center sm:gap-4"
              >
                <div className="flex-1 text-left sm:max-w-xs">
                  <label htmlFor="email" className="sr-only">
                    {dict.emailLabel}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    placeholder={dict.emailPlaceholder}
                    className="w-full rounded-full border border-cream/20 bg-cream/10 px-5 py-3 text-cream placeholder:text-cream/50 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
                  />
                </div>
                <div className="flex-1 text-left sm:max-w-[180px]">
                  <label htmlFor="city" className="sr-only">
                    {dict.cityLabel}
                  </label>
                  <select
                    id="city"
                    name="city"
                    required
                    disabled={isSubmitting}
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full appearance-none rounded-full border border-cream/20 bg-cream/10 px-5 py-3 text-cream outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
                  >
                    {dict.cities.map((cityOption) => (
                      <option key={cityOption} value={cityOption} className="text-wine">
                        {cityOption}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className={`shrink-0 bg-cream text-burgundy hover:bg-beige ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
                >
                  {isSubmitting ? "…" : dict.cta}
                </Button>
                {error ? (
                  <p className="w-full text-sm text-gold sm:col-span-3" role="alert">
                    {error}
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
