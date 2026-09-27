"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { IntroWine, SundayTableIntro } from "@/lib/sunday-table-intro";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";

const copy = {
  nl: {
    eyebrow: "Meet your table",
    title: "Maak je tafel alvast persoonlijk",
    lead: "30 seconden. Twee dagen van tevoren stellen we iedereen aan tafel aan elkaar voor. Alles is optioneel.",
    askMeAbout: "Waar mogen mensen je naar vragen?",
    askMeAboutPlaceholder: "bijv. mijn reis naar Japan",
    favoriteSpot: "Wat is jouw favoriete plek in {city}?",
    favoriteSpotPlaceholder: "bijv. een café, restaurant of park",
    wine: "Rood, wit of bubbels?",
    wines: { red: "Rood", white: "Wit", bubbles: "Bubbels" },
    intoNow: "Waar ben je nu helemaal into?",
    intoNowPlaceholder: "bijv. padel, een serie, Spaans leren",
    privacy: "Je voornaam en antwoorden delen we alleen met je tafelgenoten.",
    save: "Opslaan",
    saving: "Opslaan…",
    savedTitle: "Top, opgeslagen!",
    savedBody: "Twee dagen van tevoren krijg je een mail waarin we je tafel aan elkaar voorstellen.",
    edit: "Aanpassen",
    empty: "Vul minstens één vraag in.",
    error: "Er ging iets mis. Probeer het opnieuw.",
  },
  en: {
    eyebrow: "Meet your table",
    title: "Make your table a bit personal",
    lead: "30 seconds. Two days before, we introduce everyone at the table to each other. Everything is optional.",
    askMeAbout: "What can people ask you about?",
    askMeAboutPlaceholder: "e.g. my trip to Japan",
    favoriteSpot: "What's your favourite spot in {city}?",
    favoriteSpotPlaceholder: "e.g. a café, restaurant or park",
    wine: "Red, white or bubbles?",
    wines: { red: "Red", white: "White", bubbles: "Bubbles" },
    intoNow: "What are you really into right now?",
    intoNowPlaceholder: "e.g. padel, a series, learning Spanish",
    privacy: "We only share your first name and answers with your tablemates.",
    save: "Save",
    saving: "Saving…",
    savedTitle: "Great, saved!",
    savedBody: "Two days before, you'll get an email introducing your table to each other.",
    edit: "Edit",
    empty: "Fill in at least one question.",
    error: "Something went wrong. Please try again.",
  },
} as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-wine/15 bg-white px-3.5 py-2.5 text-sm text-wine shadow-sm transition placeholder:text-wine/35 focus:border-burgundy/40 focus:outline-none focus:ring-2 focus:ring-burgundy/10";

/** "Meet your table" questions for a Sunday Table guest. Shown right after
 * payment (identified by the checkout session) and on the page the reminder
 * email links to (identified by a signed token). */
export function SundayTableIntroForm({
  locale,
  city,
  auth,
  initial,
}: {
  locale: Locale;
  city: string;
  auth: { sessionId: string } | { token: string };
  initial?: SundayTableIntro | null;
}) {
  const t = copy[locale === "en" ? "en" : "nl"];
  const [askMeAbout, setAskMeAbout] = useState(initial?.askMeAbout ?? "");
  const [favoriteSpot, setFavoriteSpot] = useState(initial?.favoriteSpot ?? "");
  const [wine, setWine] = useState<IntroWine | null>(initial?.wine ?? null);
  const [intoNow, setIntoNow] = useState(initial?.intoNow ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!askMeAbout.trim() && !favoriteSpot.trim() && !wine && !intoNow.trim()) {
      setError(t.empty);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sunday-table/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...auth,
          // Filling in this optional form after reading the privacy line is
          // the consent to share it with the table.
          intro: { askMeAbout, favoriteSpot, wine, intoNow, shareConsent: true },
        }),
      });
      if (!res.ok) {
        setError(t.error);
        return;
      }
      trackSundayTableCtaClicked({
        cta: "intro_saved",
        source: "sessionId" in auth ? "booking_confirmation" : "intro_email",
        locale,
      });
      setSaved(true);
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="pb-12 sm:pb-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gold/30 bg-cream px-6 py-7 shadow-[0_20px_50px_rgba(43,13,18,0.06)] sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
          {t.eyebrow}
        </p>
        {saved ? (
          <div className="mt-2">
            <h2 className="font-serif text-2xl font-medium text-wine sm:text-3xl">
              {t.savedTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-wine/65">{t.savedBody}</p>
            <button
              type="button"
              onClick={() => setSaved(false)}
              className="mt-4 text-sm font-medium text-burgundy underline-offset-4 hover:underline"
            >
              {t.edit}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2">
            <h2 className="font-serif text-2xl font-medium text-wine sm:text-3xl">
              {t.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-wine/65">{t.lead}</p>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-wine">
                {t.askMeAbout}
                <input
                  type="text"
                  maxLength={140}
                  value={askMeAbout}
                  onChange={(e) => setAskMeAbout(e.target.value)}
                  placeholder={t.askMeAboutPlaceholder}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-wine">
                {t.favoriteSpot.replace("{city}", city)}
                <input
                  type="text"
                  maxLength={140}
                  value={favoriteSpot}
                  onChange={(e) => setFavoriteSpot(e.target.value)}
                  placeholder={t.favoriteSpotPlaceholder}
                  className={inputClass}
                />
              </label>
              <div>
                <span className="block text-sm font-medium text-wine">{t.wine}</span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(["red", "white", "bubbles"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={wine === value}
                      onClick={() => setWine(wine === value ? null : value)}
                      className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition ${
                        wine === value
                          ? "border-burgundy bg-burgundy text-cream"
                          : "border-wine/15 bg-white text-wine/70 hover:border-wine/30"
                      }`}
                    >
                      {t.wines[value]}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block text-sm font-medium text-wine">
                {t.intoNow}
                <input
                  type="text"
                  maxLength={140}
                  value={intoNow}
                  onChange={(e) => setIntoNow(e.target.value)}
                  placeholder={t.intoNowPlaceholder}
                  className={inputClass}
                />
              </label>
            </div>

            <p className="mt-4 text-xs text-wine/50">{t.privacy}</p>
            {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
            <button
              type="submit"
              disabled={saving}
              className="cta-lift cta-lift-burgundy mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-cream hover:bg-wine disabled:opacity-60 sm:w-auto"
            >
              {saving ? t.saving : t.save}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
