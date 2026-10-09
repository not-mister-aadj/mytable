"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { setAnalyticsConcept } from "@/lib/posthog/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as Sentry from "@sentry/nextjs";
import type { Locale } from "@/i18n/config";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import { jouwTafelKiesPath } from "@/i18n/config";
import type {
  WaitlistAllInclusivePriceId,
  WaitlistAltDayId,
  WaitlistInterestId,
  WaitlistSundayAvailabilityId,
  WaitlistTicketPriceId,
} from "@/i18n/waitlist-page.types";
import { rememberPreferredCity } from "@/lib/member-onboarding";
import { QuizQuestion, QuizScreenContext } from "@/components/jouw-tafel/quiz/quiz-screens";
import { getQuizCopy } from "@/lib/jouw-tafel/quiz-copy";
import {
  buildWaitlistPreferences,
  citiesAnswer,
  type QuizAnswers,
  type QuizStepId,
} from "@/lib/jouw-tafel/quiz-logic";
import {
  getMetaBrowserCookies,
  getMetaEventSourceUrl,
} from "@/lib/analytics/metaCookies";
import {
  trackEmailSignupCompleted,
  trackSundayTableWaitlistEnriched,
} from "@/lib/posthog/analytics";
import { VISIBLE_ONBOARDING_CITIES } from "@/lib/member-onboarding";

/** Same check as createWaitlistSignup on the server. */
/**
 * A signup that fails in the browser never reaches the server logs, so report
 * it here: which check stopped it, or what the server or network said. No
 * name or email is sent along; the user agent shows in-app browsers.
 */
function reportSignupFailure(
  reason: "missing_name" | "invalid_email" | "missing_city" | "server" | "network",
  extra?: Record<string, unknown>,
): void {
  Sentry.withScope((scope) => {
    scope.setTag("flow", "waitlist_signup");
    scope.setTag("failure_reason", reason);
    scope.setFingerprint(["waitlist_signup", reason]);
    if (extra) scope.setExtras(extra);
    Sentry.captureMessage("Waitlist signup failed: " + reason, "warning");
  });
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ease = [0.22, 1, 0.36, 1] as const;

type WaitlistLabels = SundayTableLpLabels["waitlist"];
type Phase = "capture" | "questions" | "searching" | "done";
/** The questions after the sign-up form: the "Jouw tafel" quiz questions
 * (same wording and answers, shown compact as in the settings sheet), then
 * the waitlist's own research questions. Every one can be skipped. Name,
 * cities and formats come from the form. "tafeltype" only for women, "wie"
 * only when they come with someone, "altDays" only when Sunday does not
 * suit, "allInclusivePrice" only for wine tasting or chef's table. */
type QuizStepKey = Extract<
  QuizStepId,
  "geboortedatum" | "leeftijd" | "gender" | "tafeltype" | "zoekt" | "gesprek" | "wijn" | "gezelschap" | "wie" | "taal" | "dieet" | "bron"
>;
type StepKey = QuizStepKey | "availability" | "altDays" | "ticketPrice" | "allInclusivePrice";

const QUIZ_STEP_KEYS = new Set<StepKey>([
  "geboortedatum",
  "leeftijd",
  "gender",
  "tafeltype",
  "zoekt",
  "gesprek",
  "wijn",
  "gezelschap",
  "wie",
  "taal",
  "dieet",
  "bron",
]);

function isQuizStepKey(step: StepKey): step is QuizStepKey {
  return QUIZ_STEP_KEYS.has(step);
}

function waitlistSteps(
  answers: QuizAnswers,
  sundayAvailability: WaitlistSundayAvailabilityId | null,
  interests: readonly WaitlistInterestId[],
): StepKey[] {
  const steps: StepKey[] = ["geboortedatum", "leeftijd", "gender"];
  if (answers.gender === "female") steps.push("tafeltype");
  steps.push("zoekt", "gesprek", "wijn", "gezelschap");
  if (answers.companion === "with") steps.push("wie");
  steps.push("taal", "bron", "availability");
  if (sundayAvailability === "no") steps.push("altDays");
  steps.push("ticketPrice");
  if (interests.includes("wine_tasting") || interests.includes("chefs_special")) steps.push("allInclusivePrice");
  return steps;
}

/** The waitlist's formats as the quiz's "formats" answer. */
function quizFormats(interests: readonly WaitlistInterestId[]): QuizAnswers["formats"] {
  const formats = interests.filter(
    (i): i is "wine_tasting" | "wine_walk" | "chefs_special" =>
      i === "wine_tasting" || i === "wine_walk" || i === "chefs_special",
  );
  return formats.length ? formats : undefined;
}

/** Lines for the question flow that the shared waitlist copy does not have. */
const FLOW_COPY = {
  nl: { skipQuestion: "Vraag overslaan", finish: "Klaar", searching: "We zoeken jouw tafel" },
  en: { skipQuestion: "Skip question", finish: "Done", searching: "Finding your table" },
} as const;

/** The 4 live, bookable formats — food_walk/aperitivo are waitlist-only
 * interest options elsewhere, not real products yet, so they're left out
 * of this picker. */
const FORMAT_OPTIONS: Array<{
  id: WaitlistInterestId;
  label: { nl: string; en: string };
  subtitle: { nl: string; en: string };
}> = [
  {
    id: "sunday_table",
    label: { nl: "Sunday Social", en: "Sunday Social" },
    subtitle: {
      nl: "Ontmoet nieuwe mensen aan tafel, elke maand",
      en: "Meet new people at the table, every month",
    },
  },
  {
    id: "wine_tasting",
    label: { nl: "Wijnproeverij", en: "Wine Tasting" },
    subtitle: {
      nl: "Proef bijzondere wijnen met bijpassende hapjes",
      en: "Taste special wines with matching bites",
    },
  },
  {
    id: "wine_walk",
    label: { nl: "Wijnwalk", en: "Wine Walk" },
    subtitle: {
      nl: "Wandel met je eigen groep langs de leukste wijnbars en restaurants",
      en: "Walk with your own group past the best wine bars and restaurants",
    },
  },
  {
    id: "chefs_special",
    label: { nl: "Chef's Table", en: "Chef's Table" },
    subtitle: {
      nl: "De chef kiest zijn beste gerechten in kleine porties, zodat je meer kan proeven",
      en: "The chef picks their best dishes in small portions, so you can taste more",
    },
  },
];

function ChipButton({
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
      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
        selected
          ? "border-burgundy bg-burgundy text-cream"
          : "border-wine/12 bg-white text-wine hover:border-burgundy/40"
      }`}
    >
      {label}
    </button>
  );
}

/** A short sideways shake on a field that still needs input. Runs again on
 * every failed submit, and is skipped for people who prefer less motion. */
function shakeField(input: HTMLElement | null) {
  if (!input || typeof input.animate !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  input.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(5px)" },
      { transform: "translateX(-3px)" },
      { transform: "translateX(2px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 420, easing: "ease-out" },
  );
}

export function SundayTableWaitlistModal({
  labels,
  locale,
  open,
  onOpenChange,
  cityName,
  presetInterest,
}: {
  labels: WaitlistLabels;
  /** Same waitlist copy block in the other locale (no longer used: the
   * questions follow the site's language). */
  altLabels?: WaitlistLabels;
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cityName?: string | null;
  /** Set on format pages (wine tasting, wine walk, chef's special) so the
   * signup is tagged with that interest without asking an extra question. */
  presetInterest?: WaitlistInterestId;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descId = useId();

  const [phase, setPhase] = useState<Phase>("capture");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [otherCity, setOtherCity] = useState("");
  const [showOtherCity, setShowOtherCity] = useState(false);
  const [interests, setInterests] = useState<WaitlistInterestId[]>(
    presetInterest ? [presetInterest] : [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which field the error is about, so it can be shown on that field. A line
  // above the submit button alone went unseen on phones with the keyboard
  // open: people with an empty name gave up instead of filling it in.
  const [fieldError, setFieldError] = useState<"name" | "email" | null>(null);
  // Bumped on each failed submit so the error message replays its bounce.
  const [errorAttempt, setErrorAttempt] = useState(0);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);
  /** From the capture response — whether this was a brand-new signup, not a
   * returning one. Threaded through to the completion POST so the welcome
   * email (now sent on completion, not capture) doesn't go out again to
   * someone who reopens the modal and re-finishes the flow. */
  const [isNewSignup, setIsNewSignup] = useState(false);
  /** Guards submitEnrichment against firing more than once — a real bug we
   * saw in production: the finish/skip button has no loading state, so on
   * a slow connection someone taps it repeatedly (nothing visibly happens
   * after the first tap) and each tap independently completed the
   * questionnaire, sending the welcome email once per tap. A ref (not
   * state) so the check is synchronous and can't be raced by a second tap
   * landing before React re-renders a disabled button. */
  const finishingRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [finishing, setFinishing] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  /** The quiz answers so far (name, cities and formats from the form). */
  const [quiz, setQuiz] = useState<QuizAnswers>({});
  const quizRef = useRef<QuizAnswers>({});
  const primaryActionRef = useRef<(() => void) | null>(null);
  const [ticketPrice, setTicketPrice] = useState<WaitlistTicketPriceId | null>(
    null,
  );
  const [allInclusivePrice, setAllInclusivePrice] =
    useState<WaitlistAllInclusivePriceId | null>(null);
  const [sundayAvailability, setSundayAvailability] =
    useState<WaitlistSundayAvailabilityId | null>(null);
  const [altDays, setAltDays] = useState<WaitlistAltDayId[]>([]);

  const steps = useMemo<StepKey[]>(
    () => waitlistSteps(quiz, sundayAvailability, interests),
    [quiz, sundayAvailability, interests],
  );
  const questionLabels: WaitlistLabels = labels;
  const quizCopy = getQuizCopy(locale);
  const flowCopy = FLOW_COPY[locale];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  // The waitlist funnel (A/B concept "waitlist"): from opening the modal
  // on, PostHog events carry that concept.
  useEffect(() => {
    if (open) setAnalyticsConcept("waitlist");
  }, [open]);

  // Reset to a fresh capture form each time the modal is reopened.
  useEffect(() => {
    if (!open) return;
    setPhase("capture");
    setName("");
    setEmail("");
    setSelectedCities([]);
    setOtherCity("");
    setShowOtherCity(false);
    setInterests(presetInterest ? [presetInterest] : []);
    setError(null);
    setFieldError(null);
    setWaitlistId(null);
    setIsNewSignup(false);
    setQuestionIndex(0);
    setQuiz({});
    quizRef.current = {};
    setTicketPrice(null);
    setAllInclusivePrice(null);
    setSundayAvailability(null);
    setAltDays([]);
  }, [open, cityName, presetInterest]);

  // Multi-select: any known cities they tapped, plus one free-text "other
  // city" if they filled it in. cityName (a city-specific LP route) pins
  // this to a single city and hides the picker entirely.
  const effectiveCities = cityName
    ? [cityName]
    : Array.from(
        new Set(
          [...selectedCities, otherCity.trim()].filter(
            (c): c is string => c.length > 0,
          ),
        ),
      );

  function toggleInterest(id: WaitlistInterestId) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  function toggleCity(c: string) {
    setSelectedCities((prev) =>
      prev.includes(c) ? prev.filter((v) => v !== c) : [...prev, c],
    );
  }

  function flagField(field: "name" | "email", message: string) {
    setError(message);
    setFieldError(field);
    setErrorAttempt((n) => n + 1);
    const input = field === "name" ? nameInputRef.current : emailInputRef.current;
    input?.focus();
    input?.scrollIntoView({ block: "center", behavior: "smooth" });
    shakeField(input);
  }

  async function submitCapture() {
    setError(null);
    setFieldError(null);
    // In-app browsers (Instagram, Facebook) can autofill these fields without
    // firing an input event, leaving React state empty while the field shows a
    // value. Read the field itself as a fallback, and put the value back into
    // state for the follow-up preference POSTs.
    const nameValue = (name || nameInputRef.current?.value || "").trim();
    const emailValue = (email || emailInputRef.current?.value || "").trim();
    if (nameValue !== name) setName(nameValue);
    if (emailValue !== email) setEmail(emailValue);

    // Say what is missing instead of a generic error.
    if (!nameValue) {
      flagField("name", labels.errorName);
      reportSignupFailure("missing_name");
      return;
    }
    if (!EMAIL_PATTERN.test(emailValue)) {
      flagField("email", labels.errorEmail);
      reportSignupFailure("invalid_email", { empty: emailValue.length === 0 });
      return;
    }
    if (effectiveCities.length === 0) {
      setError(labels.errorCity);
      setErrorAttempt((n) => n + 1);
      reportSignupFailure("missing_city");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailValue,
          name: nameValue,
          cities: effectiveCities,
          locale,
          source: "waitlist",
          meta: {
            ...getMetaBrowserCookies(),
            eventSourceUrl: getMetaEventSourceUrl(),
          },
        }),
      });
      if (!res.ok) {
        const failure = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(
          failure?.error === "Invalid email" ? labels.errorEmail : labels.error,
        );
        reportSignupFailure("server", {
          status: res.status,
          error: failure?.error,
        });
        return;
      }
      const payload = (await res.json()) as { id?: string; created?: boolean };
      for (const c of effectiveCities) {
        rememberPreferredCity(c);
        trackEmailSignupCompleted({
          email: emailValue,
          city: c,
          language: locale,
          source_section: "sunday_table_lp_waitlist",
        });
      }
      setWaitlistId(payload.id ?? null);
      setIsNewSignup(payload.created === true);
      const seeded: QuizAnswers = {
        name: nameValue,
        ...citiesAnswer(effectiveCities),
        ...(quizFormats(interests) ? { formats: quizFormats(interests) } : {}),
      };
      quizRef.current = seeded;
      setQuiz(seeded);
      setPhase("questions");
    } catch (networkError) {
      setError(labels.error);
      reportSignupFailure("network", {
        message:
          networkError instanceof Error ? networkError.message : String(networkError),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Saves whatever has been answered so far, called on every answer, not
  // just the last one, so an abandoned modal still leaves us with partial
  // answers instead of nothing. `overrides` carries a value whose state
  // update has not landed yet (an answer tapped just now).
  async function savePreferences(
    overrides?: {
      quiz?: QuizAnswers;
      sundayAvailability?: WaitlistSundayAvailabilityId | null;
      ticketPrice?: WaitlistTicketPriceId | null;
      allInclusivePrice?: WaitlistAllInclusivePriceId | null;
    },
    /** Set only by submitEnrichment: marks this as the save that actually
     * finishes the flow (whether by completing every question or hitting
     * "Klaar"), which is what triggers the welcome email server-side. Every
     * other call is just a per-step autosave. */
    opts?: { final?: boolean },
  ) {
    const answers = overrides?.quiz ?? quizRef.current;
    const effectiveSundayAvailability =
      overrides && "sundayAvailability" in overrides
        ? overrides.sundayAvailability
        : sundayAvailability;
    const effectiveTicketPrice =
      overrides && "ticketPrice" in overrides
        ? overrides.ticketPrice
        : ticketPrice;
    const effectiveAllInclusivePrice =
      overrides && "allInclusivePrice" in overrides
        ? overrides.allInclusivePrice
        : allInclusivePrice;
    // The quiz's own mapping onto the waitlist fields, without its version
    // key (that marks a row as made by the account quiz).
    const { quizVersion: _quizVersion, ...fromQuiz } = buildWaitlistPreferences(answers);
    void _quizVersion;
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          cities: effectiveCities,
          locale,
          enrich: true,
          ...(opts?.final
            ? { complete: true, isNewSignup }
            : {}),
          preferences: {
            ...fromQuiz,
            // Only what they answered: no defaults for skipped questions.
            tableType: answers.gender === "female" && answers.tableType ? fromQuiz.tableType : [],
            interests,
            priceRanges: {
              ticket: effectiveTicketPrice ? [effectiveTicketPrice] : [],
              allInclusive: effectiveAllInclusivePrice
                ? [effectiveAllInclusivePrice]
                : [],
            },
            priceRangeSource: "self_reported",
            sundayAvailability: effectiveSundayAvailability
              ? [effectiveSundayAvailability]
              : [],
            altDays,
            quizAnswers: answers,
          },
        }),
      });
    } catch {
      // Non-blocking: the next step (or the final submit) retries with
      // the latest answers either way, and the person is on the list
      // regardless.
    }
  }

  function answeredCount() {
    const a = quizRef.current;
    return (
      [a.birthDate, a.ageMatters, a.gender, a.tableType, a.why?.length, a.conversation, a.wine, a.companion, a.companionWho, a.language, a.dietary?.length, a.heardFrom].filter(Boolean).length +
      (ticketPrice ? 1 : 0) +
      (allInclusivePrice ? 1 : 0) +
      (sundayAvailability ? 1 : 0) +
      (altDays.length > 0 ? 1 : 0)
    );
  }

  async function submitEnrichment(skipped: boolean) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    await savePreferences(undefined, { final: true });
    for (const c of effectiveCities) {
      trackSundayTableWaitlistEnriched({
        city: c,
        locale,
        answered_count: answeredCount(),
        skipped,
      });
    }
    // On to "Kies je zondag" with these answers when a Sunday Table is open
    // in one of their cities (the quiz there only asks what was skipped).
    // Format pages (a wine walk, a tasting) stay with their own message.
    if (!presetInterest || presetInterest === "sunday_table") {
      try {
        const res = await fetch("/api/jouw-tafel/guest/from-waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), locale, answers: quizRef.current }),
        });
        const data = (await res.json().catch(() => ({}))) as { kies?: boolean };
        if (data.kies) {
          setPhase("searching");
          window.setTimeout(() => window.location.assign(jouwTafelKiesPath(locale)), 1400);
          return;
        }
      } catch {
        // Then simply the "you are on the list" screen.
      }
    }
    setPhase("done");
  }

  /** Next question after `from` (the steps as they are with `answers`), or
   * the end. */
  function advanceFrom(from: StepKey, answers: QuizAnswers = quizRef.current, availability = sundayAvailability) {
    const list = waitlistSteps(answers, availability, interests);
    const next = list.indexOf(from) + 1;
    if (next <= 0 || next >= list.length) {
      void submitEnrichment(false);
      return;
    }
    setQuestionIndex(next);
  }

  function advanceQuestion() {
    void savePreferences();
    advanceFrom(currentStep);
  }

  /** A quiz question answered: store, save, go on (single choice waits a
   * beat so the tap shows). */
  function answerQuiz(patch: Partial<QuizAnswers>, options?: { delay?: number }) {
    const from = currentStep;
    const next: QuizAnswers = { ...quizRef.current, ...patch };
    for (const key of Object.keys(next) as Array<keyof QuizAnswers>) {
      if (next[key] === undefined) delete next[key];
    }
    quizRef.current = next;
    setQuiz(next);
    void savePreferences({ quiz: next });
    const go = () => advanceFrom(from, next);
    if (options?.delay) window.setTimeout(go, options.delay);
    else go();
  }

  function selectAvailability(id: WaitlistSundayAvailabilityId) {
    const from = currentStep;
    setSundayAvailability(id);
    void savePreferences({ sundayAvailability: id });
    window.setTimeout(() => advanceFrom(from, quizRef.current, id), 180);
  }

  function selectTicketPrice(id: WaitlistTicketPriceId) {
    const from = currentStep;
    setTicketPrice(id);
    void savePreferences({ ticketPrice: id });
    window.setTimeout(() => advanceFrom(from), 180);
  }

  function selectAllInclusivePrice(id: WaitlistAllInclusivePriceId) {
    const from = currentStep;
    setAllInclusivePrice(id);
    void savePreferences({ allInclusivePrice: id });
    window.setTimeout(() => advanceFrom(from), 180);
  }

  function toggleAltDay(id: WaitlistAltDayId) {
    setAltDays((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  // Defensive clamp: if someone goes back and changes gender, `steps` can
  // shrink out from under a questionIndex that was set against the longer
  // array — this keeps the render in bounds either way.
  const currentStepIndex = Math.min(questionIndex, steps.length - 1);
  const currentStep = steps[currentStepIndex]!;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="waitlist-overlay"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-wine/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-6"
          role="presentation"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            aria-label={labels.dialogAria}
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease }}
            className="relative w-full max-w-md overflow-hidden rounded-t-[1.75rem] bg-cream shadow-[0_32px_80px_rgba(43,13,18,0.28)] sm:rounded-[1.75rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_at_50%_0%,rgba(197,154,91,0.22),transparent_65%)]"
            />

            <div className="relative px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                    {phase === "capture" ? labels.eyebrow : questionLabels.eyebrow}
                  </p>
                  <h2
                    id={titleId}
                    className="mt-2.5 font-serif text-[1.65rem] font-medium leading-[1.15] tracking-tight text-wine text-balance sm:text-[1.85rem]"
                  >
                    {phase === "questions"
                      ? questionLabels.questionsTitle
                      : phase === "done" || phase === "searching"
                        ? questionLabels.title
                        : labels.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wine/12 text-wine/45 transition hover:border-wine/25 hover:text-wine"
                  aria-label={phase === "capture" ? labels.close : questionLabels.close}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {phase === "capture" ? (
                <>
                  <p
                    id={descId}
                    className="mt-3 text-[0.95rem] leading-relaxed text-wine/55"
                  >
                    {labels.body}
                  </p>

                  <div className="mt-6 space-y-3">
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                        {labels.nameLabel}
                      </span>
                      <input
                        ref={nameInputRef}
                        type="text"
                        name="name"
                        autoComplete="given-name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldError === "name") {
                            setFieldError(null);
                            setError(null);
                          }
                        }}
                        placeholder={labels.namePlaceholder}
                        disabled={isSubmitting}
                        aria-invalid={fieldError === "name" ? true : undefined}
                        aria-describedby={fieldError === "name" ? "waitlist-field-error" : undefined}
                        className={`mt-1.5 w-full rounded-2xl border px-4 py-3 text-sm text-wine outline-none focus:ring-2 ${
                          fieldError === "name"
                            ? "border-red-600 bg-red-50 ring-2 ring-red-600/25 focus:border-red-600 focus:ring-red-600/30"
                            : "border-wine/10 bg-white/80 focus:border-burgundy/40 focus:ring-burgundy/15"
                        }`}
                      />
                      {fieldError === "name" && error ? (
                        <span key={errorAttempt} id="waitlist-field-error" role="alert" className="animate-field-error-bounce mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-red-600">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="mt-px shrink-0"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a1.25 1.25 0 0 1 1.25 1.25v4.5a1.25 1.25 0 0 1-2.5 0v-4.5A1.25 1.25 0 0 1 12 7Zm0 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" /></svg>
                          {error}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                        {labels.emailLabel}
                      </span>
                      <input
                        ref={emailInputRef}
                        type="email"
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldError === "email") {
                            setFieldError(null);
                            setError(null);
                          }
                        }}
                        placeholder={labels.emailPlaceholder}
                        disabled={isSubmitting}
                        aria-invalid={fieldError === "email" ? true : undefined}
                        aria-describedby={fieldError === "email" ? "waitlist-field-error" : undefined}
                        className={`mt-1.5 w-full rounded-2xl border px-4 py-3 text-sm text-wine outline-none focus:ring-2 ${
                          fieldError === "email"
                            ? "border-red-600 bg-red-50 ring-2 ring-red-600/25 focus:border-red-600 focus:ring-red-600/30"
                            : "border-wine/10 bg-white/80 focus:border-burgundy/40 focus:ring-burgundy/15"
                        }`}
                      />
                      {fieldError === "email" && error ? (
                        <span key={errorAttempt} id="waitlist-field-error" role="alert" className="animate-field-error-bounce mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-red-600">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="mt-px shrink-0"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a1.25 1.25 0 0 1 1.25 1.25v4.5a1.25 1.25 0 0 1-2.5 0v-4.5A1.25 1.25 0 0 1 12 7Zm0 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" /></svg>
                          {error}
                        </span>
                      ) : null}
                    </label>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                        {labels.formatLabel}
                      </span>
                      {/* On a phone these are small pills again, so the whole
                          form fits on one screen with the submit button in
                          view (the stacked cards with subtitles pushed it
                          below the fold and sign-ups dropped). The subtitles
                          only show from tablet width up. */}
                      <div className="mt-1.5 flex flex-wrap gap-2 sm:grid sm:grid-cols-2">
                        {FORMAT_OPTIONS.map((format) => {
                          const selected = interests.includes(format.id);
                          return (
                            <button
                              key={format.id}
                              type="button"
                              onClick={() => toggleInterest(format.id)}
                              className={`rounded-full border px-4 py-2 text-left transition sm:rounded-2xl sm:py-3 ${
                                selected
                                  ? "border-burgundy bg-burgundy text-cream"
                                  : "border-wine/12 bg-white text-wine hover:border-burgundy/40"
                              }`}
                            >
                              <span className="block text-sm font-medium sm:font-semibold">
                                {format.label[locale === "en" ? "en" : "nl"]}
                              </span>
                              <span
                                className={`mt-0.5 hidden text-xs leading-snug sm:block ${
                                  selected ? "text-cream/75" : "text-wine/55"
                                }`}
                              >
                                {format.subtitle[locale === "en" ? "en" : "nl"]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!cityName ? (
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                          {labels.cityLabel}
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {VISIBLE_ONBOARDING_CITIES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => toggleCity(c)}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                selectedCities.includes(c)
                                  ? "border-burgundy bg-burgundy text-cream"
                                  : "border-wine/12 bg-white text-wine hover:border-burgundy/40"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setShowOtherCity((v) => !v)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              showOtherCity
                                ? "border-burgundy bg-burgundy text-cream"
                                : "border-wine/12 bg-white text-wine hover:border-burgundy/40"
                            }`}
                          >
                            {labels.cityOther}
                          </button>
                        </div>
                        {showOtherCity ? (
                          <input
                            type="text"
                            value={otherCity}
                            onChange={(e) => setOtherCity(e.target.value)}
                            placeholder={labels.cityOtherPlaceholder}
                            disabled={isSubmitting}
                            className="mt-2 w-full rounded-2xl border border-wine/10 bg-white/80 px-4 py-3 text-sm text-wine outline-none focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/15"
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {error && !fieldError ? (
                    <p key={errorAttempt} className="animate-field-error-bounce mt-3 flex items-start gap-1.5 text-sm font-semibold text-red-600" role="alert">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="mt-px shrink-0"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a1.25 1.25 0 0 1 1.25 1.25v4.5a1.25 1.25 0 0 1-2.5 0v-4.5A1.25 1.25 0 0 1 12 7Zm0 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" /></svg>
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void submitCapture()}
                    className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-wine ${
                      isSubmitting ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {isSubmitting ? labels.submitting : labels.submit}
                  </button>
                  <p className="mt-3 text-center text-xs text-wine/45">
                    {labels.privacyNote}
                  </p>
                </>
              ) : null}

              {phase === "questions" ? (
                <>
                  <p
                    id={descId}
                    className="mt-3 text-[0.95rem] leading-relaxed text-wine/55"
                  >
                    {questionLabels.questionsBody}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-wine/35">
                      {questionLabels.progress
                        .replace("{n}", String(currentStepIndex + 1))
                        .replace("{total}", String(steps.length))}
                    </p>
                    <button
                      type="button"
                      onClick={() => void submitEnrichment(true)}
                      disabled={finishing}
                      className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy transition hover:text-wine disabled:opacity-60"
                    >
                      {flowCopy.finish}
                    </button>
                  </div>

                  {/* Not wrapped in AnimatePresence: in this React/Next
                      version, its exit tracking never resolves here, which
                      permanently blocks the next step from ever rendering.
                      A plain keyed motion.div still animates each step in. */}
                  <motion.div
                    key={currentStep}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3"
                  >
                      {isQuizStepKey(currentStep) ? (
                        <QuizScreenContext.Provider
                          value={{
                            locale,
                            copy: quizCopy,
                            step: currentStep,
                            answers: quiz,
                            accountFirstName: quiz.name ?? "",
                            geoCity: null,
                            cityCounts: {},
                            subsetCounts: {},
                            testimonials: [],
                            reduceMotion: Boolean(reduceMotion),
                            answerAndNext: answerQuiz,
                            continueFrom: () => advanceFrom(currentStep),
                            primaryActionRef,
                            variant: "sheet",
                            submitLabel: questionLabels.continueCta,
                          }}
                        >
                          <QuizQuestion step={currentStep} />
                        </QuizScreenContext.Provider>
                      ) : null}

                      {currentStep === "availability" ? (
                        <>
                          <h3 className="font-serif text-lg text-wine">
                            {questionLabels.availability.title}
                          </h3>
                          <div className="mt-3 grid gap-2">
                            {questionLabels.availability.options.map((option) => (
                              <ChipButton
                                key={option.id}
                                label={option.label}
                                selected={sundayAvailability === option.id}
                                onClick={() => selectAvailability(option.id)}
                              />
                            ))}
                          </div>
                        </>
                      ) : null}

                      {currentStep === "altDays" ? (
                        <>
                          <h3 className="font-serif text-lg text-wine">
                            {questionLabels.altDays.title}
                          </h3>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {questionLabels.altDays.options.map((option) => (
                              <ChipButton
                                key={option.id}
                                label={option.label}
                                selected={altDays.includes(option.id)}
                                onClick={() => toggleAltDay(option.id)}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={advanceQuestion}
                            disabled={finishing}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-wine disabled:opacity-60"
                          >
                            {questionLabels.continueCta}
                          </button>
                        </>
                      ) : null}

                      {currentStep === "ticketPrice" ? (
                        <>
                          <h3 className="font-serif text-lg text-wine">
                            {questionLabels.ticketPrice.title}
                          </h3>
                          <div className="mt-3 grid gap-2">
                            {questionLabels.ticketPrice.options.map((option) => (
                              <ChipButton
                                key={option.id}
                                label={option.label}
                                selected={ticketPrice === option.id}
                                onClick={() => selectTicketPrice(option.id)}
                              />
                            ))}
                          </div>
                        </>
                      ) : null}

                      {currentStep === "allInclusivePrice" ? (
                        <>
                          <h3 className="font-serif text-lg text-wine">
                            {questionLabels.allInclusivePrice.title}
                          </h3>
                          <div className="mt-3 grid gap-2">
                            {questionLabels.allInclusivePrice.options.map(
                              (option) => (
                                <ChipButton
                                  key={option.id}
                                  label={option.label}
                                  selected={allInclusivePrice === option.id}
                                  onClick={() =>
                                    selectAllInclusivePrice(option.id)
                                  }
                                />
                              ),
                            )}
                          </div>
                        </>
                      ) : null}
                    </motion.div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={questionIndex === 0 || finishing}
                      className="font-semibold uppercase tracking-[0.14em] text-wine/40 transition hover:text-wine disabled:opacity-0"
                    >
                      {questionLabels.back}
                    </button>
                    <button
                      type="button"
                      onClick={() => advanceFrom(currentStep)}
                      disabled={finishing}
                      className="font-semibold uppercase tracking-[0.14em] text-wine/40 transition hover:text-wine disabled:opacity-60"
                    >
                      {flowCopy.skipQuestion}
                    </button>
                  </div>
                </>
              ) : null}

              {phase === "searching" ? (
                <div role="status" className="mt-6 flex flex-col items-center gap-4 py-6 text-center">
                  <span aria-hidden className="flex gap-2">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-2.5 w-2.5 animate-pulse rounded-full bg-burgundy/70 motion-reduce:animate-none"
                        style={{ animationDelay: `${dot * 180}ms` }}
                      />
                    ))}
                  </span>
                  <p id={descId} className="font-serif text-lg text-wine">
                    {flowCopy.searching}
                  </p>
                </div>
              ) : null}

              {phase === "done" ? (
                <>
                  <p
                    id={descId}
                    className="mt-3 text-[0.95rem] leading-relaxed text-wine/55"
                  >
                    {questionLabels.successBody}
                  </p>

                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-wine/15 px-7 text-xs font-semibold uppercase tracking-[0.16em] text-wine transition hover:border-wine/30"
                  >
                    {questionLabels.close}
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
