"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  token: string;
  city: string;
  firstName: string | null;
  alreadySubmitted: boolean;
};

type Step = "stars" | "followup" | "done";

const copy = {
  nl: {
    greeting: (name: string | null, city: string) =>
      name
        ? `${name}, hoe was Sunday Table in ${city}?`
        : `Hoe was Sunday Table in ${city}?`,
    lead: "Eén tik. Jouw gevoel helpt ons de tafels warmer te maken.",
    starsHint: "Tik op een ster",
    continue: "Verder",
    send: "Verstuur",
    thanksLow:
      "Dank je. We lezen dit met aandacht en nemen het mee naar de volgende tafel.",
    thanksHigh: "Wat fijn om te horen. Dank je wel.",
    storyTitle: "Vertel het alsof je het aan een vriendin doorgeeft",
    storyLead:
      "Wat bleef hangen? De mensen, het gesprek, de sfeer, dat ene moment. Hoe concreter, hoe mooier.",
    storyPlaceholder:
      "Bijvoorbeeld: ik kwam alleen, zat naast iemand die ook van natuurwijn houdt, en ging met drie nieuwe nummers naar huis…",
    improveTitle: "Wat kunnen we beter doen?",
    improveLead:
      "Kort en concreet is genoeg. Wat miste je, of wat zou de volgende tafel fijner maken?",
    improvePlaceholder:
      "Bijvoorbeeld: de groep voelde wat groot, of ik had graag iets meer over de wijn gehoord…",
    photoLabel: "Voeg een foto toe (optioneel)",
    photoHint: "Een sfeerbeeld van de avond. JPG, PNG of WebP, max 10 MB.",
    consent:
      "Het is oké als MyTable deze review (en foto) gebruikt op de website of socials.",
    changePhoto: "Andere foto",
    removePhoto: "Verwijderen",
    submitting: "Bezig…",
    already: "Je hebt je ervaring al gedeeld. Dank je.",
    errorGeneric: "Er ging iets mis. Probeer het opnieuw.",
  },
  en: {
    greeting: (name: string | null, city: string) =>
      name
        ? `${name}, how was Sunday Table in ${city}?`
        : `How was Sunday Table in ${city}?`,
    lead: "One tap. Your feeling helps us make the tables warmer.",
    starsHint: "Tap a star",
    continue: "Continue",
    send: "Send",
    thanksLow:
      "Thank you. We read this with care and take it to the next table.",
    thanksHigh: "So good to hear. Thank you.",
    storyTitle: "Tell it like you would to a friend",
    storyLead:
      "What stayed with you? The people, the talk, the mood, that one moment. The more concrete, the better.",
    storyPlaceholder:
      "For example: I came alone, sat next to someone who also loves natural wine, and left with three new numbers…",
    improveTitle: "What could we improve?",
    improveLead:
      "Short and concrete is enough. What was missing, or what would make the next table better?",
    improvePlaceholder:
      "For example: the group felt a bit large, or I would have loved a little more about the wine…",
    photoLabel: "Add a photo (optional)",
    photoHint: "A mood shot from the evening. JPG, PNG or WebP, max 10 MB.",
    consent:
      "It is fine if MyTable uses this review (and photo) on the website or socials.",
    changePhoto: "Another photo",
    removePhoto: "Remove",
    submitting: "Sending…",
    already: "You already shared your experience. Thank you.",
    errorGeneric: "Something went wrong. Please try again.",
  },
} as const;

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-10 w-10 sm:h-12 sm:w-12"
      aria-hidden
    >
      <path
        d="M12 2.5l2.85 6.2 6.75.75-5.05 4.55 1.4 6.55L12 17.3 6.05 20.55l1.4-6.55L2.4 9.45l6.75-.75L12 2.5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SundayTableReviewForm({
  locale,
  token,
  city,
  firstName,
  alreadySubmitted,
}: Props) {
  const t = copy[locale === "en" ? "en" : "nl"];
  const [step, setStep] = useState<Step>(alreadySubmitted ? "done" : "stars");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const isImprove = rating > 0 && rating < 4;
  const isStory = rating === 5;

  function onPickPhoto(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit(nextRating: number, withDetails: boolean) {
    setError(null);
    const form = new FormData();
    form.set("token", token);
    form.set("rating", String(nextRating));
    if (withDetails) {
      form.set("body", body.trim());
      if (nextRating === 5) {
        form.set("marketingConsent", consent ? "true" : "false");
        if (photo) form.set("photo", photo);
      }
    }

    const res = await fetch("/api/sunday-table/review", {
      method: "POST",
      body: form,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || t.errorGeneric);
    }
    setStep("done");
  }

  function onContinueFromStars() {
    if (rating < 1) return;
    startTransition(async () => {
      try {
        if (rating < 4 || rating === 5) {
          setBody("");
          setConsent(false);
          onPickPhoto(null);
          if (fileRef.current) fileRef.current.value = "";
          setStep("followup");
          return;
        }
        await submit(rating, false);
      } catch (e) {
        setError(e instanceof Error ? e.message : t.errorGeneric);
      }
    });
  }

  function onSubmitFollowup(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submit(rating, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorGeneric);
      }
    });
  }

  const active = hover || rating;

  return (
    <div className="relative mx-auto flex min-h-[min(70vh,40rem)] w-full max-w-lg flex-col justify-center px-5 py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(197,154,91,0.18),transparent_65%)]"
      />

      {step === "done" ? (
        <div className="relative text-center">
          <p className="font-serif text-4xl leading-tight text-burgundy sm:text-5xl">
            {alreadySubmitted
              ? t.already
              : rating === 5
                ? t.thanksHigh
                : t.thanksLow}
          </p>
          <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-wine/70">
            MyTable
          </p>
        </div>
      ) : null}

      {step === "stars" ? (
        <div className="relative text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-rose-deep/80">
            Sunday Table
          </p>
          <h1 className="mt-4 font-serif text-[2.15rem] leading-[1.15] text-burgundy sm:text-5xl">
            {t.greeting(firstName, city)}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-wine/70">
            {t.lead}
          </p>

          <div
            className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2"
            role="radiogroup"
            aria-label={t.starsHint}
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const filled = value <= active;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value}`}
                  className={`rounded-full p-1 transition duration-200 ${
                    filled
                      ? "scale-105 text-gold"
                      : "text-wine/25 hover:text-gold/70"
                  }`}
                  onMouseEnter={() => setHover(value)}
                  onFocus={() => setHover(value)}
                  onClick={() => setRating(value)}
                >
                  <StarIcon filled={filled} />
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-wine/45">{t.starsHint}</p>

          {error ? (
            <p className="mt-6 text-sm text-rose-deep" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={rating < 1 || pending}
            onClick={onContinueFromStars}
            className="mt-8 inline-flex min-w-[11rem] items-center justify-center rounded-full bg-burgundy px-8 py-3.5 text-sm font-medium text-cream transition hover:bg-wine disabled:opacity-40"
          >
            {pending ? t.submitting : t.continue}
          </button>
        </div>
      ) : null}

      {step === "followup" ? (
        <form onSubmit={onSubmitFollowup} className="relative">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-rose-deep/80">
            {rating} ★
          </p>
          <h1 className="mt-3 font-serif text-[2rem] leading-tight text-burgundy sm:text-4xl">
            {isImprove ? t.improveTitle : t.storyTitle}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-wine/70">
            {isImprove ? t.improveLead : t.storyLead}
          </p>

          <label className="mt-8 block">
            <span className="sr-only">
              {isImprove ? t.improveTitle : t.storyTitle}
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={20}
              rows={7}
              placeholder={
                isImprove ? t.improvePlaceholder : t.storyPlaceholder
              }
              className="w-full resize-y rounded-2xl border border-border-subtle bg-beige/80 px-4 py-3.5 text-[15px] leading-relaxed text-wine outline-none ring-burgundy/20 placeholder:text-wine/35 focus:ring-2"
            />
          </label>

          {isStory ? (
            <>
              <div className="mt-6">
                <p className="text-sm font-medium text-wine">{t.photoLabel}</p>
                <p className="mt-1 text-xs text-wine/50">{t.photoHint}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
                />
                {photoPreview ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt=""
                      className="max-h-56 w-full object-cover"
                    />
                    <div className="flex gap-3 bg-beige/90 px-3 py-2.5 text-xs">
                      <button
                        type="button"
                        className="text-burgundy underline-offset-2 hover:underline"
                        onClick={() => fileRef.current?.click()}
                      >
                        {t.changePhoto}
                      </button>
                      <button
                        type="button"
                        className="text-wine/55 underline-offset-2 hover:underline"
                        onClick={() => {
                          onPickPhoto(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                      >
                        {t.removePhoto}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-3 flex w-full items-center justify-center rounded-2xl border border-dashed border-wine/25 bg-beige/50 px-4 py-8 text-sm text-wine/60 transition hover:border-gold hover:text-wine"
                  >
                    {t.photoLabel}
                  </button>
                )}
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-snug text-wine/80">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-subtle text-burgundy focus:ring-burgundy"
                />
                <span>{t.consent}</span>
              </label>
            </>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-rose-deep" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || body.trim().length < 20}
            className="mt-8 inline-flex min-w-[11rem] items-center justify-center rounded-full bg-burgundy px-8 py-3.5 text-sm font-medium text-cream transition hover:bg-wine disabled:opacity-40"
          >
            {pending ? t.submitting : t.send}
          </button>
        </form>
      ) : null}
    </div>
  );
}
