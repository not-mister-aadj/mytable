"use client";

import { FormEvent, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import {
  getMetaBrowserCookies,
  getMetaEventSourceUrl,
} from "@/lib/analytics/metaCookies";
import { trackMetaLead } from "@/lib/analytics/metaTracking";
import { trackEmailSignupCompleted } from "@/lib/posthog/analytics";
import { Button } from "@/components/ui/Button";

interface GirlsOnlyPresaleSignupProps {
  labels: GirlsOnlyPageLabels["presaleSignup"];
  locale: Locale;
}

export function GirlsOnlyPresaleSignup({
  labels,
  locale,
}: GirlsOnlyPresaleSignupProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  function toggleCity(city: string) {
    setSelectedCities((current) =>
      current.includes(city)
        ? current.filter((value) => value !== city)
        : [...current, city],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (selectedCities.length === 0) {
      setError(labels.citiesRequired);
      return;
    }

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
          cities: selectedCities,
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
      const citySummary = selectedCities.join(", ");

      trackEmailSignupCompleted({
        email,
        city: citySummary,
        language: locale,
        source_section: "girls_only_presale",
      });

      if (payload.id) {
        trackMetaLead({
          source: "newsletter",
          city: selectedCities[0] ?? citySummary,
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
    <section
      id="presale"
      className="scroll-mt-20 border-t border-rose/15 bg-gradient-to-b from-rose-soft/50 to-cream py-8 sm:py-12"
    >
      <div className="mx-auto max-w-2xl px-5 sm:px-8 lg:px-10">
        <div className="rounded-3xl border border-rose/25 bg-white/90 p-5 shadow-sm sm:p-7">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
              {labels.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-wine/70 sm:text-base">
              {labels.subtitle}
            </p>
          </div>

          {submitted ? (
            <p
              className="mt-6 text-center text-sm leading-relaxed text-wine/80 sm:text-base"
              role="status"
            >
              {labels.success}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="presale-name"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-deep"
                >
                  {labels.nameLabel}
                </label>
                <input
                  id="presale-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  disabled={isSubmitting}
                  placeholder={labels.namePlaceholder}
                  className="mt-2 w-full rounded-2xl border border-rose/20 bg-cream/40 px-4 py-3 text-sm text-wine outline-none transition placeholder:text-wine/40 focus:border-rose focus:ring-2 focus:ring-rose/20 disabled:opacity-60"
                />
              </div>

              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-deep">
                  {labels.citiesLabel}
                </legend>
                <p className="mt-1 text-sm text-wine/60">{labels.citiesHint}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {labels.cities.map((city) => {
                    const selected = selectedCities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        disabled={isSubmitting}
                        aria-pressed={selected}
                        onClick={() => toggleCity(city)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          selected
                            ? "border-rose bg-rose text-cream"
                            : "border-rose/25 bg-white text-wine hover:border-rose/50"
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="presale-email"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-deep"
                >
                  {labels.emailLabel}
                </label>
                <input
                  id="presale-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                  placeholder={labels.emailPlaceholder}
                  className="mt-2 w-full rounded-2xl border border-rose/20 bg-cream/40 px-4 py-3 text-sm text-wine outline-none transition placeholder:text-wine/40 focus:border-rose focus:ring-2 focus:ring-rose/20 disabled:opacity-60"
                />
              </div>

              {error ? (
                <p className="text-sm text-rose-deep" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-center pt-1">
                <Button
                  type="submit"
                  className={`bg-rose px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream hover:bg-rose-deep sm:text-sm ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
                >
                  <span aria-hidden className="mr-2 opacity-90">
                    ›
                  </span>
                  {isSubmitting ? "…" : labels.cta}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
