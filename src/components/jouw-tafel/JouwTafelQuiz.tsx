"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import * as Sentry from "@sentry/nextjs";
import { sundayTableLocationPath, type Locale } from "@/i18n/config";
import { getQuizCopy, type QuizCopy } from "@/lib/jouw-tafel/copy";
import {
  bracketForAge,
  checkoutLanguage,
  cityCountFloor,
  cityWaitlistCount,
  isQuizStepId,
  mirroredWhy,
  outOfTen,
  pickQuizResult,
  QUIZ_AGE_RANGES,
  QUIZ_CITIES,
  QUIZ_STEP_IDS,
  QUIZ_WHYS,
  quizStepIndex,
  seatsFor,
  soloStop,
  spotsLeft,
  venueWithoutCity,
  type QuizAgeRange,
  type QuizCompany,
  type QuizData,
  type QuizEvent,
  type QuizLanguage,
  type QuizResult,
  type QuizStepId,
  type QuizWhy,
} from "@/lib/jouw-tafel/logic";
import { quizShareRef } from "@/lib/jouw-tafel/share-ref";
import { normalizeWaitlistCity } from "@/lib/waitlist-city";
import { shouldShowSpotsCount } from "@/lib/experience-booking";
import { formatSpotsLeftHint } from "@/lib/event-display";
import { formatSundayTableCardDate } from "@/lib/sunday-wine-table";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { trackMetaLead } from "@/lib/analytics/metaTracking";
import { getStoredUtm } from "@/lib/analytics/utm";
import { trackEmailSignupCompleted, trackQuizEvent } from "@/lib/posthog/analytics";
import { PostHogEvents } from "@/lib/posthog/events";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AMSTERDAM = "Europe/Amsterdam";
const SEARCH_MS = 1500;
const AUTO_ADVANCE_MS = 180;

type Answers = {
  city: string;
  age: QuizAgeRange | null;
  why: QuizWhy[];
  company: QuizCompany | null;
  language: QuizLanguage | null;
};

const EMPTY_ANSWERS: Answers = { city: "", age: null, why: [], company: null, language: null };

// ---------------------------------------------------------------------------
// Preview mode: ?voorbeeld=1&stad=Rotterdam&leeftijd=35_44&gezelschap=alleen&taal=both
// Renders the stops and the result from those answers without writing
// anything: no waitlist POST, no checkout, no PostHog quiz events.
// ---------------------------------------------------------------------------

type Preview = { answers: Answers; startStep: QuizStepId } | null;

function readPreview(params: URLSearchParams): Preview {
  if (params.get("voorbeeld") !== "1") return null;
  const rawAge = params.get("leeftijd") ?? "35_44";
  const age = (QUIZ_AGE_RANGES as string[]).includes(rawAge) ? (rawAge as QuizAgeRange) : "35_44";
  const rawCompany = (params.get("gezelschap") ?? "alleen").toLowerCase();
  const company: QuizCompany =
    rawCompany === "samen" || rawCompany === "met-iemand" || rawCompany === "together"
      ? "together"
      : "solo";
  const rawLang = (params.get("taal") ?? "both").toLowerCase();
  const language: QuizLanguage =
    rawLang === "nl" || rawLang === "dutch"
      ? "dutch"
      : rawLang === "en" || rawLang === "english"
        ? "english"
        : "both";
  const why = (params.get("zoekt") ?? "discover_places")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is QuizWhy => (QUIZ_WHYS as string[]).includes(v));
  const stap = params.get("stap");
  return {
    answers: {
      city: normalizeWaitlistCity(params.get("stad") ?? "Rotterdam") || "Rotterdam",
      age,
      why: why.length ? why : ["discover_places"],
      company,
      language,
    },
    startStep: isQuizStepId(stap) ? stap : "resultaat",
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function capitalize(value: string, locale: Locale): string {
  return value.charAt(0).toLocaleUpperCase(locale === "en" ? "en-GB" : "nl-NL") + value.slice(1);
}

function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "nl-NL", {
    timeZone: AMSTERDAM,
    hour: locale === "en" ? "numeric" : "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "8 november" / "8 November". */
function formatDayMonth(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: AMSTERDAM,
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

function euros(cents: number): string {
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
}

function googleCalendarUrl(event: QuizEvent, locale: Locale): string {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 3 * 3600_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Sunday Table ${event.city} (MyTable)`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details:
      locale === "en"
        ? "Booking for this table opens soon. You're on the list, so you'll hear it first by email."
        : "Aanmelden voor deze tafel opent binnenkort. Je staat op de lijst en hoort het als eerste per mail.",
    location: event.city,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function reportFailure(reason: string, extra?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    scope.setTag("flow", "jouw_tafel_quiz");
    scope.setTag("failure_reason", reason);
    scope.setFingerprint(["jouw_tafel_quiz", reason]);
    if (extra) scope.setExtras(extra);
    Sentry.captureMessage("Jouw tafel quiz failed: " + reason, "warning");
  });
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

const primaryButton =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-7 text-center text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-wine disabled:opacity-60";
const secondaryButton =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-wine/15 px-7 text-center text-xs font-semibold uppercase tracking-[0.16em] text-wine transition hover:border-wine/30";
const inputClass = (invalid: boolean) =>
  `mt-1.5 w-full rounded-2xl border px-4 py-3 text-base text-wine outline-none focus:ring-2 ${
    invalid
      ? "border-red-600 bg-red-50 ring-2 ring-red-600/25 focus:border-red-600 focus:ring-red-600/30"
      : "border-wine/10 bg-white/80 focus:border-burgundy/40 focus:ring-burgundy/15"
  }`;

function Option({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-2xl border px-5 py-4 text-left text-[0.95rem] font-medium transition ${
        selected
          ? "border-burgundy bg-burgundy text-cream"
          : "border-wine/12 bg-white text-wine hover:border-burgundy/40"
      }`}
    >
      {label}
    </button>
  );
}

function FieldError({ id, message, attempt }: { id: string; message: string; attempt: number }) {
  return (
    <span
      key={attempt}
      id={id}
      role="alert"
      className="animate-field-error-bounce mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-red-600"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="mt-px shrink-0">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a1.25 1.25 0 0 1 1.25 1.25v4.5a1.25 1.25 0 0 1-2.5 0v-4.5A1.25 1.25 0 0 1 12 7Zm0 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
      </svg>
      {message}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-serif text-[1.9rem] font-medium leading-[1.12] tracking-tight text-wine text-balance">
      {children}
    </h1>
  );
}

function focusWithError(input: HTMLElement | null) {
  if (!input) return;
  input.focus();
  input.scrollIntoView({ block: "center", behavior: "smooth" });
}

// ---------------------------------------------------------------------------
// Result: the table card and its reserve button
// ---------------------------------------------------------------------------

function TableDetails({ event, locale, copy }: { event: QuizEvent; locale: Locale; copy: QuizCopy }) {
  const left = spotsLeft(event);
  const date = capitalize(formatSundayTableCardDate(new Date(event.startsAt), locale), locale);
  const start = formatTime(event.startsAt, locale);
  const end = event.endsAt ? formatTime(event.endsAt, locale) : null;
  const venue = event.venueName ? venueWithoutCity(event.venueName, event.city) : null;
  return (
    <div className="space-y-1.5 text-[0.95rem] leading-snug text-wine/75">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
        Sunday Table · {event.bracket}
      </p>
      <p className="font-medium text-wine">{copy.result.dateTime(date, start, end)}</p>
      <p>{copy.result.venueLine(venue, event.city)}</p>
      {shouldShowSpotsCount(left, event.spotsSold) && left > 0 ? (
        <p className="font-semibold text-burgundy">{formatSpotsLeftHint(left, locale)}</p>
      ) : null}
    </div>
  );
}

function ReserveBlock({
  event,
  seats,
  nearby,
  locale,
  copy,
  language,
  email,
  initialName,
  preview,
  compact = false,
}: {
  event: QuizEvent;
  seats: 1 | 2;
  nearby: boolean;
  locale: Locale;
  copy: QuizCopy;
  language: QuizLanguage;
  email: string;
  initialName: string;
  preview: boolean;
  compact?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [englishChoice, setEnglishChoice] = useState<"dutch_ok" | "wait" | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const needsName = initialName.trim() === "";
  const dutchOnly = language === "english" && !event.englishOpen;

  const price = euros(event.priceCents * seats);
  const label = nearby
    ? copy.result.reserveNearby(event.city, price)
    : seats === 2
      ? copy.result.reserveTwo(price)
      : copy.result.reserveOne(price);
  const detailsHref = event.citySlug
    ? sundayTableLocationPath(locale, event.citySlug, event.dateIso)
    : null;

  async function reserve() {
    if (loading || preview) return;
    const nameValue = (name || nameRef.current?.value || "").trim();
    if (nameValue !== name) setName(nameValue);
    if (!nameValue) {
      setNameError(true);
      setAttempt((n) => n + 1);
      focusWithError(nameRef.current);
      return;
    }
    setNameError(false);
    setLoading(true);
    setError(null);
    trackQuizEvent(PostHogEvents.quizReserveClicked, {
      event_slug: event.slug,
      seats,
      nearby,
    });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          email,
          name: nameValue,
          seats,
          locale,
          // Said English but accepted a Dutch table: either is fine then.
          tableLanguagePreference: dutchOnly ? "both_fine" : checkoutLanguage(language),
          utm: getStoredUtm(),
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error ?? copy.result.checkoutError);
        reportFailure("checkout", { status: res.status, error: data?.error });
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (networkError) {
      setError(copy.result.checkoutError);
      reportFailure("checkout_network", {
        message: networkError instanceof Error ? networkError.message : String(networkError),
      });
      setLoading(false);
    }
  }

  if (dutchOnly && englishChoice !== "dutch_ok") {
    return (
      <div className={compact ? "mt-4" : "mt-6"}>
        <p className="text-[0.95rem] font-medium text-wine">{copy.result.dutchTableNote}</p>
        {englishChoice === "wait" ? (
          <p className="mt-3 text-[0.95rem] leading-relaxed text-wine/70">
            {copy.result.waitForEnglishBody(event.city)}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <button type="button" className={primaryButton} onClick={() => setEnglishChoice("dutch_ok")}>
              {copy.result.dutchFine}
            </button>
            <button type="button" className={secondaryButton} onClick={() => setEnglishChoice("wait")}>
              {copy.result.waitForEnglish}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "mt-4" : "mt-6"}>
      {needsName && !preview ? (
        <label className="mb-4 block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
            {copy.result.nameLabel}
          </span>
          <input
            ref={nameRef}
            type="text"
            name="given-name"
            autoComplete="given-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(false);
            }}
            placeholder={copy.result.namePlaceholder}
            aria-invalid={nameError || undefined}
            aria-describedby={nameError ? `name-error-${event.id}` : undefined}
            className={inputClass(nameError)}
          />
          {nameError ? (
            <FieldError id={`name-error-${event.id}`} message={copy.result.nameRequired} attempt={attempt} />
          ) : null}
        </label>
      ) : null}
      <button
        type="button"
        className={primaryButton}
        disabled={loading || preview}
        onClick={() => void reserve()}
      >
        {loading ? copy.result.reserving : label}
      </button>
      {preview ? (
        <p className="mt-2 text-center text-xs text-wine/50">{copy.result.previewNoCheckout}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-center text-xs text-wine/55">{copy.result.drinksNote}</p>
      {detailsHref && !compact ? (
        <p className="mt-2 text-center">
          <a href={detailsHref} className="text-sm font-medium text-burgundy underline underline-offset-4">
            {copy.result.detailsLink}
          </a>
        </p>
      ) : null}
    </div>
  );
}

const cardClass =
  "rounded-[1.75rem] border border-wine/10 bg-white p-6 shadow-[0_18px_48px_rgba(43,13,18,0.08)]";

// ---------------------------------------------------------------------------
// The quiz
// ---------------------------------------------------------------------------

export function JouwTafelQuiz({ locale, data }: { locale: Locale; data: QuizData }) {
  const copy = getQuizCopy(locale);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const [preview] = useState<Preview>(() => readPreview(new URLSearchParams(searchParams.toString())));
  const isPreview = preview !== null;
  const [answers, setAnswers] = useState<Answers>(() => preview?.answers ?? EMPTY_ANSWERS);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherCity, setOtherCity] = useState("");
  const [otherError, setOtherError] = useState(false);
  const [whyError, setWhyError] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<"email" | null>(null);
  const [fieldErrorMessage, setFieldErrorMessage] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [errorAttempt, setErrorAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(isPreview);
  const [waitInOwnCity, setWaitInOwnCity] = useState(false);
  const [shareRef, setShareRef] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const solo = useMemo(() => soloStop(data.stats), [data.stats]);
  const showSoloStop = answers.company === "solo" && solo.kind !== "skip";

  /** The screens this person will see, in order (for the progress bar). */
  const visibleSteps = useMemo(
    () => QUIZ_STEP_IDS.filter((id) => id !== "stop-alleen" || showSoloStop),
    [showSoloStop],
  );

  const rawStep = searchParams.get("stap");
  const requestedStep: QuizStepId = isQuizStepId(rawStep)
    ? rawStep
    : isPreview
      ? preview.startStep
      : "intro";

  /** Can this screen be shown with what we know? A reload loses the
   * answers, so a later step without them falls back to the intro. */
  const stepAllowed = useCallback(
    (step: QuizStepId): boolean => {
      const hasCity = answers.city !== "";
      const hasAge = hasCity && answers.age !== null;
      const hasWhy = hasAge && answers.why.length > 0;
      const hasCompany = hasWhy && answers.company !== null;
      const hasLanguage = hasCompany && answers.language !== null;
      switch (step) {
        case "intro":
        case "stad":
          return true;
        case "leeftijd":
        case "stop-stad":
          return hasCity;
        case "zoekt":
          return hasAge;
        case "stop-zoekt":
        case "gezelschap":
          return hasWhy;
        case "stop-alleen":
          return hasCompany && showSoloStop;
        case "taal":
          return hasCompany;
        case "gegevens":
          return hasLanguage;
        case "zoeken":
        case "resultaat":
          return hasLanguage && submitted;
      }
    },
    [answers, showSoloStop, submitted],
  );

  const step: QuizStepId = stepAllowed(requestedStep) ? requestedStep : "intro";
  // The screen the page opened on shows at once (it is also what the server
  // rendered as the fallback); only later screens fade in.
  const [firstStep] = useState<QuizStepId>(step);

  const buildUrl = useCallback((next: QuizStepId): string => {
    const params = new URLSearchParams(window.location.search);
    if (next === "intro") params.delete("stap");
    else params.set("stap", next);
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ""}`;
  }, []);

  /** Shallow step change: one history entry per screen, so the browser's
   * back button goes to the previous screen. */
  const go = useCallback(
    (next: QuizStepId, options?: { replace?: boolean }) => {
      const depth = Number((window.history.state as { quizDepth?: number } | null)?.quizDepth ?? 0);
      if (options?.replace) {
        window.history.replaceState({ quizDepth: depth }, "", buildUrl(next));
      } else {
        window.history.pushState({ quizDepth: depth + 1 }, "", buildUrl(next));
      }
      window.scrollTo({ top: 0 });
    },
    [buildUrl],
  );

  // Deep link or reload to a step we can't show: restart at the intro.
  useEffect(() => {
    if (rawStep && step !== requestedStep) {
      window.history.replaceState({ quizDepth: 0 }, "", buildUrl("intro"));
    }
  }, [rawStep, step, requestedStep, buildUrl]);

  function goBack() {
    const depth = Number((window.history.state as { quizDepth?: number } | null)?.quizDepth ?? 0);
    if (depth > 0) {
      window.history.back();
      return;
    }
    const index = visibleSteps.indexOf(step);
    const previous = visibleSteps[Math.max(0, index - 1)] ?? "intro";
    go(previous === "zoeken" ? "gegevens" : previous, { replace: true });
  }

  const track = useCallback(
    (
      event: Parameters<typeof trackQuizEvent>[0],
      props: Parameters<typeof trackQuizEvent>[1],
    ) => {
      if (!isPreview) trackQuizEvent(event, props);
    },
    [isPreview],
  );

  // quiz_step_viewed on every screen shown.
  const lastViewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastViewedRef.current === step) return;
    lastViewedRef.current = step;
    track(PostHogEvents.quizStepViewed, {
      step_id: step,
      step_index: quizStepIndex(step),
      total_steps: visibleSteps.length,
    });
  }, [step, visibleSteps.length, track]);

  function completed(stepId: QuizStepId, answer: string) {
    track(PostHogEvents.quizStepCompleted, {
      step_id: stepId,
      step_index: quizStepIndex(stepId),
      answer,
    });
  }

  // "We zoeken jouw tafel..." for a moment, then the result. Replaces the
  // history entry, so back from the result goes to the email step.
  useEffect(() => {
    if (step !== "zoeken") return;
    const timer = window.setTimeout(() => go("resultaat", { replace: true }), SEARCH_MS);
    return () => window.clearTimeout(timer);
  }, [step, go]);

  const result: QuizResult | null = useMemo(() => {
    if (!answers.city || !answers.age || !answers.company) return null;
    if (waitInOwnCity) return { variant: "C" };
    return pickQuizResult(data.events, {
      city: answers.city,
      age: answers.age,
      company: answers.company,
    });
  }, [answers.city, answers.age, answers.company, data.events, waitInOwnCity]);

  // quiz_result_shown, once per variant shown.
  const lastResultRef = useRef<string | null>(null);
  useEffect(() => {
    if (step !== "resultaat" || !result || !answers.age) return;
    const key = `${result.variant}:${"event" in result ? result.event.slug : ""}`;
    if (lastResultRef.current === key) return;
    lastResultRef.current = key;
    track(PostHogEvents.quizResultShown, {
      variant: result.variant,
      event_slug: "event" in result ? result.event.slug : undefined,
      city: answers.city,
      bracket: bracketForAge(answers.age),
    });
  }, [step, result, answers.city, answers.age, track]);

  // The share link's `r` code is fetched ahead of time: awaiting it inside
  // the tap would cost the user gesture that navigator.share needs on iOS.
  useEffect(() => {
    if (isPreview || !submitted || shareRef !== null || !EMAIL_PATTERN.test(email.trim())) return;
    let cancelled = false;
    quizShareRef(email.trim())
      .then((ref) => {
        if (!cancelled && ref) setShareRef(ref);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isPreview, submitted, shareRef, email]);

  // ------------------------------------------------------------------ answers

  function update(patch: Partial<Answers>) {
    setAnswers((prev) => ({ ...prev, ...patch }));
    // Changing an answer after the email step means a new result, not the
    // one we saved: send the email step again.
    if (!isPreview) setSubmitted(false);
    setWaitInOwnCity(false);
  }

  function chooseCity(city: string) {
    update({ city });
    setOtherOpen(false);
    completed("stad", city);
    window.setTimeout(() => go("leeftijd"), AUTO_ADVANCE_MS);
  }

  function submitOtherCity() {
    const value = normalizeWaitlistCity(otherCity || otherRef.current?.value || "");
    if (!value) {
      setOtherError(true);
      setErrorAttempt((n) => n + 1);
      focusWithError(otherRef.current);
      return;
    }
    setOtherError(false);
    update({ city: value });
    completed("stad", "other");
    go("leeftijd");
  }

  function chooseAge(age: QuizAgeRange) {
    update({ age });
    completed("leeftijd", age);
    window.setTimeout(() => go("stop-stad"), AUTO_ADVANCE_MS);
  }

  function toggleWhy(id: QuizWhy) {
    setWhyError(false);
    update({
      why: answers.why.includes(id) ? answers.why.filter((v) => v !== id) : [...answers.why, id],
    });
  }

  function submitWhy() {
    if (answers.why.length === 0) {
      setWhyError(true);
      setErrorAttempt((n) => n + 1);
      return;
    }
    completed("zoekt", answers.why.join(","));
    go("stop-zoekt");
  }

  function chooseCompany(company: QuizCompany) {
    update({ company });
    completed("gezelschap", company);
    const next = company === "solo" && solo.kind !== "skip" ? "stop-alleen" : "taal";
    window.setTimeout(() => go(next), AUTO_ADVANCE_MS);
  }

  function chooseLanguage(language: QuizLanguage) {
    update({ language });
    completed("taal", language);
    window.setTimeout(() => go("gegevens"), AUTO_ADVANCE_MS);
  }

  function flagEmail(message: string) {
    setFieldError("email");
    setFieldErrorMessage(message);
    setErrorAttempt((n) => n + 1);
    focusWithError(emailRef.current);
  }

  async function submitDetails() {
    if (submitting) return;
    setServerError(null);
    setFieldError(null);
    // In-app browsers (Instagram, Facebook) can autofill without firing an
    // input event: read the fields themselves as a fallback.
    const emailValue = (email || emailRef.current?.value || "").trim();
    const nameValue = (name || nameRef.current?.value || "").trim();
    if (emailValue !== email) setEmail(emailValue);
    if (nameValue !== name) setName(nameValue);

    if (!emailValue) {
      flagEmail(copy.gegevens.errorEmailEmpty);
      reportFailure("missing_email");
      return;
    }
    if (!EMAIL_PATTERN.test(emailValue)) {
      flagEmail(copy.gegevens.errorEmailInvalid);
      reportFailure("invalid_email");
      return;
    }
    if (isPreview) {
      setSubmitted(true);
      go("zoeken");
      return;
    }

    const preferences = {
      cities: [answers.city],
      ageRange: answers.age ? [answers.age] : [],
      why: answers.why,
      company: answers.company === "together" ? ["bring_friends"] : ["solo"],
      language: answers.language ? [answers.language] : [],
      tableType: ["mixed"],
      interests: ["sunday_table"],
      priceRangeSource: "self_reported",
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailValue,
          name: nameValue || undefined,
          cities: [answers.city],
          locale,
          source: "quiz",
          preferences,
          meta: { ...getMetaBrowserCookies(), eventSourceUrl: getMetaEventSourceUrl() },
        }),
      });
      if (!res.ok) {
        const failure = (await res.json().catch(() => null)) as { error?: string } | null;
        if (failure?.error === "Invalid email") {
          flagEmail(copy.gegevens.errorEmailInvalid);
        } else {
          setServerError(copy.gegevens.errorServer);
          setErrorAttempt((n) => n + 1);
        }
        reportFailure("server", { status: res.status, error: failure?.error });
        return;
      }
      const payload = (await res.json()) as { id?: string; created?: boolean };

      // Same as the waitlist modal finishing its questions: this marks the
      // signup complete, which is what sends the welcome email (once).
      void fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailValue,
          name: nameValue || undefined,
          cities: [answers.city],
          locale,
          source: "quiz",
          enrich: true,
          complete: true,
          isNewSignup: payload.created === true,
          preferences,
        }),
      }).catch(() => {});

      if (payload.id) {
        trackMetaLead({ source: "waitlist", city: answers.city, waitlistId: payload.id });
      }
      trackEmailSignupCompleted({
        email: emailValue,
        city: answers.city,
        language: locale,
        source_section: "jouw_tafel_quiz",
        source: "quiz",
      });
      track(PostHogEvents.quizEmailSubmitted, {
        city: answers.city,
        new_signup: payload.created === true,
        has_name: nameValue !== "",
      });
      completed("gegevens", "submitted");
      setSubmitted(true);
      go("zoeken");
    } catch (networkError) {
      setServerError(copy.gegevens.errorServer);
      setErrorAttempt((n) => n + 1);
      reportFailure("network", {
        message: networkError instanceof Error ? networkError.message : String(networkError),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function share() {
    track(PostHogEvents.quizShareClicked, { city: answers.city, has_ref: shareRef !== null });
    const params = new URLSearchParams({
      utm_source: "share",
      utm_medium: "quiz",
      utm_campaign: "jouw-tafel",
    });
    if (shareRef) params.set("r", shareRef);
    const url = `${window.location.origin}${pathname}?${params.toString()}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: copy.result.shareTitle, text: copy.result.shareText, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      window.prompt(copy.result.shareCopied, url);
    }
  }

  // ------------------------------------------------------------------ render

  const progressIndex = visibleSteps.indexOf(step);
  const progress = progressIndex <= 0 ? 0 : progressIndex / (visibleSteps.length - 1);
  const showBack = step !== "intro" && step !== "zoeken";
  const cityCount = cityWaitlistCount(data.stats, answers.city);
  const cityFloor = cityCountFloor(cityCount);
  const seats = answers.company ? seatsFor(answers.company) : 1;

  function renderStep() {
    switch (step) {
      case "intro":
        return (
          <div className="pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Sunday Table</p>
            <div className="mt-3">
              <Title>{copy.intro.title}</Title>
            </div>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-wine/65">{copy.intro.body}</p>
            <button
              type="button"
              className={`${primaryButton} mt-8`}
              onClick={() => {
                completed("intro", "start");
                go("stad");
              }}
            >
              {copy.intro.cta}
            </button>
          </div>
        );

      case "stad":
        return (
          <div>
            <Title>{copy.stad.title}</Title>
            <div className="mt-6 grid gap-2.5">
              {QUIZ_CITIES.map((city) => (
                <Option
                  key={city}
                  label={city}
                  selected={!otherOpen && answers.city === city}
                  onClick={() => chooseCity(city)}
                />
              ))}
              <Option
                label={copy.stad.other}
                selected={otherOpen}
                onClick={() => {
                  setOtherOpen(true);
                  window.setTimeout(() => otherRef.current?.focus(), 50);
                }}
              />
            </div>
            {otherOpen ? (
              <div className="mt-4">
                <input
                  ref={otherRef}
                  type="text"
                  name="city"
                  autoComplete="address-level2"
                  value={otherCity}
                  onChange={(e) => {
                    setOtherCity(e.target.value);
                    if (otherError) setOtherError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitOtherCity();
                  }}
                  placeholder={copy.stad.otherPlaceholder}
                  aria-label={copy.stad.otherPlaceholder}
                  aria-invalid={otherError || undefined}
                  aria-describedby={otherError ? "other-city-error" : undefined}
                  className={inputClass(otherError)}
                />
                {otherError ? (
                  <FieldError id="other-city-error" message={copy.stad.otherRequired} attempt={errorAttempt} />
                ) : null}
                <button type="button" className={`${primaryButton} mt-4`} onClick={submitOtherCity}>
                  {copy.continue}
                </button>
              </div>
            ) : null}
          </div>
        );

      case "leeftijd":
        return (
          <div>
            <Title>{copy.leeftijd.title}</Title>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {QUIZ_AGE_RANGES.map((age) => (
                <Option
                  key={age}
                  label={copy.leeftijd.options[age]}
                  selected={answers.age === age}
                  onClick={() => chooseAge(age)}
                />
              ))}
            </div>
          </div>
        );

      case "stop-stad":
        return (
          <StopScreen
            title={
              cityFloor !== null
                ? copy.stopStad.withCount(answers.city, cityFloor)
                : copy.stopStad.withoutCount(answers.city)
            }
            cta={copy.continue}
            onContinue={() => {
              completed("stop-stad", "continue");
              go("zoekt");
            }}
          />
        );

      case "zoekt":
        return (
          <div>
            <Title>{copy.zoekt.title}</Title>
            <p className="mt-2 text-[0.95rem] text-wine/55">{copy.zoekt.hint}</p>
            <div className="mt-5 grid gap-2.5">
              {QUIZ_WHYS.map((id) => (
                <Option
                  key={id}
                  label={copy.zoekt.options[id]}
                  selected={answers.why.includes(id)}
                  onClick={() => toggleWhy(id)}
                />
              ))}
            </div>
            {whyError ? <FieldError id="why-error" message={copy.zoekt.required} attempt={errorAttempt} /> : null}
            <button type="button" className={`${primaryButton} mt-6`} onClick={submitWhy}>
              {copy.continue}
            </button>
          </div>
        );

      case "stop-zoekt": {
        const mirrored = mirroredWhy(data.stats, answers.why) ?? "discover_places";
        const share = outOfTen(data.stats.why.counts[mirrored] ?? 0, data.stats.why.base);
        const answer = copy.zoekt.options[mirrored];
        return (
          <StopScreen
            title={
              share
                ? copy.stopZoekt.withShare(answer, share.tens, share.nearly)
                : copy.stopZoekt.withoutShare(answer)
            }
            cta={copy.continue}
            onContinue={() => {
              completed("stop-zoekt", "continue");
              go("gezelschap");
            }}
          />
        );
      }

      case "gezelschap":
        return (
          <div>
            <Title>{copy.gezelschap.title}</Title>
            <div className="mt-6 grid gap-2.5">
              {(["solo", "together"] as const).map((company) => (
                <Option
                  key={company}
                  label={copy.gezelschap.options[company]}
                  selected={answers.company === company}
                  onClick={() => chooseCompany(company)}
                />
              ))}
            </div>
          </div>
        );

      case "stop-alleen": {
        const title =
          solo.kind === "numeric"
            ? copy.stopAlleen.numericTitle(solo.tens)
            : solo.kind === "almostEveryone"
              ? copy.stopAlleen.almostEveryoneTitle
              : copy.stopAlleen.mostTitle;
        return (
          <StopScreen
            title={title}
            body={copy.stopAlleen.body}
            cta={copy.continue}
            onContinue={() => {
              completed("stop-alleen", "continue");
              go("taal");
            }}
          />
        );
      }

      case "taal":
        return (
          <div>
            <Title>{copy.taal.title}</Title>
            <div className="mt-6 grid gap-2.5">
              {(["dutch", "english", "both"] as const).map((language) => (
                <Option
                  key={language}
                  label={copy.taal.options[language]}
                  selected={answers.language === language}
                  onClick={() => chooseLanguage(language)}
                />
              ))}
            </div>
          </div>
        );

      case "gegevens":
        return (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submitDetails();
            }}
          >
            <Title>{copy.gegevens.title}</Title>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                  {copy.gegevens.emailLabel}
                </span>
                <input
                  ref={emailRef}
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                  placeholder={copy.gegevens.emailPlaceholder}
                  disabled={submitting}
                  aria-invalid={fieldError === "email" || undefined}
                  aria-describedby={fieldError === "email" ? "email-error" : undefined}
                  className={inputClass(fieldError === "email")}
                />
                {fieldError === "email" ? (
                  <FieldError id="email-error" message={fieldErrorMessage} attempt={errorAttempt} />
                ) : null}
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                  {copy.gegevens.nameLabel}
                </span>
                <input
                  ref={nameRef}
                  type="text"
                  name="given-name"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.gegevens.namePlaceholder}
                  disabled={submitting}
                  className={inputClass(false)}
                />
              </label>
            </div>
            {serverError ? (
              <p
                key={errorAttempt}
                role="alert"
                className="animate-field-error-bounce mt-4 text-sm font-semibold text-red-600"
              >
                {serverError}
              </p>
            ) : null}
            <button type="submit" className={`${primaryButton} mt-6`} disabled={submitting}>
              {submitting ? copy.gegevens.submitting : copy.gegevens.submit}
            </button>
            <p className="mt-3 text-center text-xs text-wine/50">{copy.gegevens.note}</p>
          </form>
        );

      case "zoeken":
        return (
          <div className="flex min-h-[50svh] flex-col items-center justify-center text-center">
            <span
              aria-hidden
              className="mb-6 h-10 w-10 animate-spin rounded-full border-2 border-burgundy/20 border-t-burgundy motion-reduce:animate-none"
            />
            <p className="max-w-xs font-serif text-[1.45rem] leading-snug text-wine" role="status">
              {answers.age && answers.language
                ? copy.zoeken.line(answers.city, bracketForAge(answers.age), answers.language)
                : null}
            </p>
          </div>
        );

      case "resultaat":
        return result && answers.language ? renderResult(result, answers.language) : null;
    }
  }

  function renderResult(res: QuizResult, language: QuizLanguage) {
    const reserveProps = {
      seats,
      locale,
      copy,
      language,
      email,
      initialName: name,
      preview: isPreview,
    };

    if (res.variant === "A") {
      return (
        <div>
          <Title>{copy.result.titleA}</Title>
          <div className={`${cardClass} mt-6`}>
            <TableDetails event={res.event} locale={locale} copy={copy} />
            <ReserveBlock event={res.event} nearby={false} {...reserveProps} />
          </div>
        </div>
      );
    }

    if (res.variant === "C+") {
      return (
        <div>
          <Title>{copy.result.titleCPlus(res.event.city)}</Title>
          <div className={`${cardClass} mt-6`}>
            <TableDetails event={res.event} locale={locale} copy={copy} />
            <ReserveBlock event={res.event} nearby {...reserveProps} />
          </div>
          <button
            type="button"
            className="mt-5 w-full text-center text-sm font-medium text-wine/60 underline underline-offset-4"
            onClick={() => setWaitInOwnCity(true)}
          >
            {copy.result.cPlusWait(answers.city)}
          </button>
        </div>
      );
    }

    if (res.variant === "B") {
      const dayMonth = formatDayMonth(res.event.startsAt, locale);
      const longDate = formatSundayTableCardDate(new Date(res.event.startsAt), locale);
      const icsHref = `/api/jouw-tafel/agenda?event=${encodeURIComponent(res.event.slug)}&locale=${locale}`;
      return (
        <div>
          <Title>{copy.result.titleB}</Title>
          <div className={`${cardClass} mt-6`}>
            <p className="text-[0.95rem] font-medium leading-snug text-wine">
              Sunday Table · {res.event.bracket} · {longDate} · {res.event.city}
            </p>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-wine/75">{copy.result.bBody}</p>
            <a
              href={icsHref}
              className={`${primaryButton} mt-6`}
              onClick={() =>
                track(PostHogEvents.quizCalendarClicked, { event_slug: res.event.slug, kind: "ics" })
              }
            >
              {copy.result.bCalendar(dayMonth)}
            </a>
            <p className="mt-3 text-center">
              <a
                href={googleCalendarUrl(res.event, locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-burgundy underline underline-offset-4"
                onClick={() =>
                  track(PostHogEvents.quizCalendarClicked, { event_slug: res.event.slug, kind: "google" })
                }
              >
                {copy.result.bGoogle}
              </a>
            </p>
          </div>
          {res.nearby ? (
            <div className={`${cardClass} mt-5`}>
              <p className="text-[0.95rem] font-medium leading-snug text-wine">
                {copy.result.bNearby(
                  res.nearby.city,
                  formatSundayTableCardDate(new Date(res.nearby.startsAt), locale),
                )}
              </p>
              <div className="mt-4">
                <TableDetails event={res.nearby} locale={locale} copy={copy} />
              </div>
              <ReserveBlock event={res.nearby} nearby compact {...reserveProps} />
            </div>
          ) : null}
        </div>
      );
    }

    // C: nothing yet.
    return (
      <div>
        <Title>{copy.result.titleC(answers.city)}</Title>
        <p className="mt-4 text-[1.05rem] leading-relaxed text-wine/70">
          {cityFloor !== null
            ? copy.result.cBodyWithCount(answers.city, cityFloor)
            : copy.result.cBodyWithoutCount}
        </p>
        <button type="button" className={`${primaryButton} mt-8`} onClick={() => void share()}>
          {copy.result.cShare}
        </button>
        {shareCopied ? (
          <p role="status" className="mt-3 text-center text-sm font-medium text-burgundy">
            {copy.result.shareCopied}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 sm:px-6">
      <div className="flex h-12 items-center gap-3">
        <div className="w-16 shrink-0">
          {showBack ? (
            <button
              type="button"
              onClick={goBack}
              className="-ml-2 inline-flex min-h-11 items-center gap-1 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-wine/50 transition hover:text-wine"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {copy.back}
            </button>
          ) : null}
        </div>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-wine/10"
          role="progressbar"
          aria-label={copy.progressAria}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="h-full rounded-full bg-burgundy transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>
        <div className="w-16 shrink-0" aria-hidden />
      </div>

      {/* A keyed motion.div (not AnimatePresence, whose exit tracking stalls
          in this React/Next version, see SundayTableWaitlistModal). */}
      <motion.div
        key={step === "resultaat" && result ? `resultaat-${result.variant}` : step}
        initial={reduceMotion || step === firstStep ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="pt-6"
      >
        {renderStep()}
      </motion.div>
    </div>
  );
}

/** Server-rendered first paint (the quiz itself needs the URL, so it renders
 * on the client). Same markup as the intro, so nothing jumps on hydration. */
export function JouwTafelIntroFallback({ locale }: { locale: Locale }) {
  const copy = getQuizCopy(locale);
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 sm:px-6">
      <div className="flex h-12 items-center gap-3">
        <div className="w-16 shrink-0" />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-wine/10">
          <div className="h-full rounded-full bg-burgundy" style={{ width: "4%" }} />
        </div>
        <div className="w-16 shrink-0" aria-hidden />
      </div>
      <div className="pt-6">
        <div className="pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Sunday Table</p>
          <div className="mt-3">
            <Title>{copy.intro.title}</Title>
          </div>
          <p className="mt-4 text-[1.05rem] leading-relaxed text-wine/65">{copy.intro.body}</p>
          <button type="button" className={`${primaryButton} mt-8`}>
            {copy.intro.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

function StopScreen({
  title,
  body,
  cta,
  onContinue,
}: {
  title: string;
  body?: string;
  cta: string;
  onContinue: () => void;
}) {
  return (
    <div className="pt-4">
      <span aria-hidden className="block h-px w-12 bg-gold" />
      <p className="mt-6 font-serif text-[1.75rem] font-medium leading-[1.18] tracking-tight text-wine text-balance">
        {title}
      </p>
      {body ? <p className="mt-4 text-[1.05rem] leading-relaxed text-wine/65">{body}</p> : null}
      <button type="button" className={`${primaryButton} mt-8`} onClick={onContinue}>
        {cta}
      </button>
    </div>
  );
}
