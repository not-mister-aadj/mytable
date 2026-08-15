"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import type {
  WaitlistAgeRangeId,
  WaitlistBudgetId,
  WaitlistCompanyId,
  WaitlistExperienceId,
  WaitlistGenderId,
  WaitlistInterestId,
  WaitlistLanguageId,
  WaitlistTableTypeId,
  WaitlistVibeId,
  WaitlistWhyId,
} from "@/i18n/waitlist-page.types";
import {
  GIRLS_WHATSAPP_GROUP_URL,
  MIXED_WHATSAPP_GROUP_URL,
  rememberPreferredCity,
} from "@/lib/member-onboarding";
import {
  getMetaBrowserCookies,
  getMetaEventSourceUrl,
} from "@/lib/analytics/metaCookies";
import {
  trackEmailSignupCompleted,
  trackSundayTableWaitlistEnriched,
} from "@/lib/posthog/analytics";
import { VISIBLE_ONBOARDING_CITIES } from "@/lib/member-onboarding";

const ease = [0.22, 1, 0.36, 1] as const;

type WaitlistLabels = SundayTableLpLabels["waitlist"];
type Phase = "capture" | "questions" | "done";
/** "profile" (gender + age) and "match" (vibe + budget + experience) are
 * grouped multi-question screens — a few quick taps, not a whole extra
 * screen per data point. "tableType" only appears for gender === "female",
 * see `useSteps` below. "language" always comes first — it also decides
 * which language the rest of the questionnaire renders in. */
type StepKey = "language" | "profile" | "why" | "company" | "tableType" | "match";

/** The 4 live, bookable formats — food_walk/aperitivo are waitlist-only
 * interest options elsewhere, not real products yet, so they're left out
 * of this picker. */
const FORMAT_OPTIONS: Array<{
  id: WaitlistInterestId;
  label: { nl: string; en: string };
}> = [
  { id: "sunday_table", label: { nl: "Sunday Table", en: "Sunday Table" } },
  { id: "wine_tasting", label: { nl: "Wijnproeverij", en: "Wine Tasting" } },
  { id: "wine_walk", label: { nl: "Wijnwalk", en: "Wine Walk" } },
  { id: "chefs_special", label: { nl: "Chef's Table", en: "Chef's Table" } },
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

/** Compact single-select row of pills, for grouping a few quick-tap
 * questions onto one screen (gender+age, vibe+budget+experience). */
function PillRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: T; label: string }>;
  value: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
        {label}
      </span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              value === option.id
                ? "border-burgundy bg-burgundy text-cream"
                : "border-wine/12 bg-white text-wine hover:border-burgundy/40"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SundayTableWaitlistModal({
  labels,
  altLabels,
  locale,
  open,
  onOpenChange,
  cityName,
  presetInterest,
}: {
  labels: WaitlistLabels;
  /** Same waitlist copy block, in the other locale — the language question
   * (first in the flow) can switch the rest of the questionnaire to it. */
  altLabels: WaitlistLabels;
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
  const [waitlistId, setWaitlistId] = useState<string | null>(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [why, setWhy] = useState<WaitlistWhyId[]>([]);
  const [whyOther, setWhyOther] = useState("");
  const [company, setCompany] = useState<WaitlistCompanyId[]>([]);
  const [tableType, setTableType] = useState<WaitlistTableTypeId | null>(null);
  const [gender, setGender] = useState<WaitlistGenderId | null>(null);
  const [ageRange, setAgeRange] = useState<WaitlistAgeRangeId | null>(null);
  const [vibe, setVibe] = useState<WaitlistVibeId | null>(null);
  const [budget, setBudget] = useState<WaitlistBudgetId | null>(null);
  const [experience, setExperience] = useState<WaitlistExperienceId | null>(
    null,
  );
  const [language, setLanguage] = useState<WaitlistLanguageId | null>(null);

  // "Which table?" only makes sense once we know they're choosing between
  // girls-only and mixed — men and "prefer not to say" skip straight to
  // the match-preferences step. "language" always comes first.
  const steps = useMemo<StepKey[]>(() => {
    const base: StepKey[] = ["language", "profile", "why", "company"];
    if (gender === "female") base.push("tableType");
    base.push("match");
    return base;
  }, [gender]);

  // Which locale's copy to show for the question flow — switches once the
  // language question is answered "english" or "dutch"; "both" (or not yet
  // answered) keeps the site's own locale.
  const questionLabels: WaitlistLabels =
    language === "english"
      ? locale === "en"
        ? labels
        : altLabels
      : language === "dutch"
        ? locale === "nl"
          ? labels
          : altLabels
        : labels;

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
    setWaitlistId(null);
    setQuestionIndex(0);
    setWhy([]);
    setWhyOther("");
    setCompany([]);
    setTableType(null);
    setGender(null);
    setAgeRange(null);
    setVibe(null);
    setBudget(null);
    setExperience(null);
    setLanguage(null);
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

  async function submitCapture() {
    setError(null);
    if (!name.trim() || !email.trim() || effectiveCities.length === 0) {
      setError(labels.error);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
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
        setError(labels.error);
        return;
      }
      const payload = (await res.json()) as { id?: string };
      for (const c of effectiveCities) {
        rememberPreferredCity(c);
        trackEmailSignupCompleted({
          email: email.trim(),
          city: c,
          language: locale,
          source_section: "sunday_table_lp_waitlist",
        });
      }
      setWaitlistId(payload.id ?? null);
      setPhase("questions");
    } catch {
      setError(labels.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Saves whatever has been answered so far — called on every "Verder", not
  // just the final one, so an abandoned modal still leaves us with partial
  // answers instead of nothing. `overrides` covers selectTableType, whose
  // auto-advance timer would otherwise read tableType from a closure
  // snapshotted before the click's state update lands.
  async function savePreferences(overrides?: {
    tableType?: WaitlistTableTypeId | null;
    language?: WaitlistLanguageId | null;
  }) {
    const effectiveTableType =
      overrides && "tableType" in overrides ? overrides.tableType : tableType;
    const effectiveLanguage =
      overrides && "language" in overrides ? overrides.language : language;
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          cities: effectiveCities,
          locale,
          enrich: true,
          preferences: {
            why,
            whyOther: why.includes("other") ? whyOther.trim() : "",
            company,
            tableType: effectiveTableType ? [effectiveTableType] : [],
            interests,
            gender: gender ? [gender] : [],
            ageRange: ageRange ? [ageRange] : [],
            vibe: vibe ? [vibe] : [],
            budget: budget ? [budget] : [],
            experience: experience ? [experience] : [],
            language: effectiveLanguage ? [effectiveLanguage] : [],
          },
        }),
      });
    } catch {
      // Non-blocking — the next step (or the final submit) retries with
      // the latest answers either way, and the person is on the list
      // regardless.
    }
  }

  function answeredCount() {
    return (
      (why.length > 0 ? 1 : 0) +
      (company.length > 0 ? 1 : 0) +
      (tableType ? 1 : 0) +
      (gender ? 1 : 0) +
      (ageRange ? 1 : 0) +
      (vibe ? 1 : 0) +
      (budget ? 1 : 0) +
      (experience ? 1 : 0) +
      (language ? 1 : 0)
    );
  }

  async function submitEnrichment(skipped: boolean) {
    await savePreferences();
    for (const c of effectiveCities) {
      trackSundayTableWaitlistEnriched({
        city: c,
        locale,
        answered_count: answeredCount(),
        skipped,
      });
    }
    setPhase("done");
  }

  function advanceQuestion() {
    if (questionIndex < steps.length - 1) {
      void savePreferences();
      setQuestionIndex((i) => i + 1);
    } else {
      void submitEnrichment(false);
    }
  }

  function toggleWhy(id: WaitlistWhyId) {
    setWhy((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  function toggleCompany(id: WaitlistCompanyId) {
    setCompany((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  function selectTableType(id: WaitlistTableTypeId) {
    setTableType(id);
    void savePreferences({ tableType: id });
    // tableType is never the last step (match always follows it) — advance
    // directly instead of going through advanceQuestion, whose closure here
    // would still see the pre-click tableType value.
    window.setTimeout(() => {
      setQuestionIndex((i) => Math.min(i + 1, steps.length - 1));
    }, 180);
  }

  function selectLanguage(id: WaitlistLanguageId) {
    setLanguage(id);
    void savePreferences({ language: id });
    // language is always the first step, never the last — same reasoning
    // as selectTableType above.
    window.setTimeout(() => {
      setQuestionIndex((i) => Math.min(i + 1, steps.length - 1));
    }, 180);
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
                      : phase === "done"
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
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={labels.namePlaceholder}
                        disabled={isSubmitting}
                        className="mt-1.5 w-full rounded-2xl border border-wine/10 bg-white/80 px-4 py-3 text-sm text-wine outline-none focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/15"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                        {labels.emailLabel}
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={labels.emailPlaceholder}
                        disabled={isSubmitting}
                        className="mt-1.5 w-full rounded-2xl border border-wine/10 bg-white/80 px-4 py-3 text-sm text-wine outline-none focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/15"
                      />
                    </label>

                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                        {labels.formatLabel}
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {FORMAT_OPTIONS.map((format) => (
                          <button
                            key={format.id}
                            type="button"
                            onClick={() => toggleInterest(format.id)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              interests.includes(format.id)
                                ? "border-burgundy bg-burgundy text-cream"
                                : "border-wine/12 bg-white text-wine hover:border-burgundy/40"
                            }`}
                          >
                            {format.label[locale === "en" ? "en" : "nl"]}
                          </button>
                        ))}
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

                  {error ? (
                    <p className="mt-3 text-sm text-burgundy" role="alert">
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
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-wine/35">
                    {questionLabels.progress
                      .replace("{n}", String(currentStepIndex + 1))
                      .replace("{total}", String(steps.length))}
                  </p>

                  {/* Not wrapped in AnimatePresence: in this React/Next
                      version, its exit tracking never resolves here, which
                      permanently blocks the next step from ever rendering.
                      A plain keyed motion.div still animates each step in. */}
                  <motion.div
                    key={currentStep}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={
                      currentStep === "profile" || currentStep === "match"
                        ? "mt-3 space-y-4"
                        : "mt-3"
                    }
                  >
                      {currentStep === "language" ? (
                        <>
                          <h3 className="font-serif text-lg text-wine">
                            {questionLabels.language.title}
                          </h3>
                          <div className="mt-3 grid gap-2">
                            {questionLabels.language.options.map((option) => (
                              <ChipButton
                                key={option.id}
                                label={option.label}
                                selected={language === option.id}
                                onClick={() => selectLanguage(option.id)}
                              />
                            ))}
                          </div>
                        </>
                      ) : null}

                      {currentStep === "profile" ? (
                        <>
                          <PillRow
                            label={questionLabels.gender.title}
                            options={questionLabels.gender.options}
                            value={gender}
                            onChange={setGender}
                          />
                          <PillRow
                            label={questionLabels.ageRange.title}
                            options={questionLabels.ageRange.options}
                            value={ageRange}
                            onChange={setAgeRange}
                          />
                          <button
                            type="button"
                            onClick={advanceQuestion}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-wine"
                          >
                            {questionLabels.continueCta}
                          </button>
                        </>
                      ) : null}

                      {currentStep === "why" ? (
                        <>
                          <h3 className="font-serif text-lg text-wine">
                            {questionLabels.why.title}
                          </h3>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {questionLabels.why.options.map((option) => (
                              <ChipButton
                                key={option.id}
                                label={option.label}
                                selected={why.includes(option.id)}
                                onClick={() => toggleWhy(option.id)}
                              />
                            ))}
                          </div>
                          {why.includes("other") ? (
                            <input
                              type="text"
                              value={whyOther}
                              onChange={(e) => setWhyOther(e.target.value)}
                              placeholder={questionLabels.why.otherPlaceholder}
                              className="mt-2 w-full rounded-2xl border border-wine/10 bg-white/80 px-4 py-3 text-sm text-wine outline-none focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/15"
                            />
                          ) : null}
                          <button
                            type="button"
                            onClick={advanceQuestion}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-wine"
                          >
                            {questionLabels.continueCta}
                          </button>
                        </>
                      ) : null}

                      {currentStep === "company" ? (
                        <>
                          <h3 className="font-serif text-lg text-wine">
                            {questionLabels.company.title}
                          </h3>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {questionLabels.company.options.map((option) => (
                              <ChipButton
                                key={option.id}
                                label={option.label}
                                selected={company.includes(option.id)}
                                onClick={() => toggleCompany(option.id)}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={advanceQuestion}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-wine"
                          >
                            {questionLabels.continueCta}
                          </button>
                        </>
                      ) : null}

                      {currentStep === "tableType" ? (
                        <>
                          <h3 className="font-serif text-lg text-wine">
                            {questionLabels.tableType.title}
                          </h3>
                          <div className="mt-3 grid gap-2">
                            {questionLabels.tableType.options.map((option) => (
                              <ChipButton
                                key={option.id}
                                label={option.label}
                                selected={tableType === option.id}
                                onClick={() => selectTableType(option.id)}
                              />
                            ))}
                          </div>
                        </>
                      ) : null}

                      {currentStep === "match" ? (
                        <>
                          <PillRow
                            label={questionLabels.vibe.title}
                            options={questionLabels.vibe.options}
                            value={vibe}
                            onChange={setVibe}
                          />
                          <PillRow
                            label={questionLabels.budget.title}
                            options={questionLabels.budget.options}
                            value={budget}
                            onChange={setBudget}
                          />
                          <PillRow
                            label={questionLabels.experience.title}
                            options={questionLabels.experience.options}
                            value={experience}
                            onChange={setExperience}
                          />
                          <button
                            type="button"
                            onClick={advanceQuestion}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-wine"
                          >
                            {questionLabels.continueCta}
                          </button>
                        </>
                      ) : null}
                    </motion.div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={questionIndex === 0}
                      className="font-semibold uppercase tracking-[0.14em] text-wine/40 transition hover:text-wine disabled:opacity-0"
                    >
                      {questionLabels.back}
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitEnrichment(true)}
                      className="font-semibold uppercase tracking-[0.14em] text-wine/40 transition hover:text-wine"
                    >
                      {questionLabels.skip}
                    </button>
                  </div>
                </>
              ) : null}

              {phase === "done" ? (
                <>
                  <p
                    id={descId}
                    className="mt-3 text-[0.95rem] leading-relaxed text-wine/55"
                  >
                    {questionLabels.successBody}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-wine/45">
                    {questionLabels.successNext}
                  </p>

                  <div className="mt-6 space-y-3">
                    <a
                      href={GIRLS_WHATSAPP_GROUP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-wine/10 bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(43,13,18,0.06)] transition hover:border-[#25D366]/35"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                        →
                      </span>
                      <span className="text-sm font-semibold text-wine">
                        {questionLabels.whatsappGirlsLabel}
                      </span>
                    </a>
                    <a
                      href={MIXED_WHATSAPP_GROUP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-wine/10 bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(43,13,18,0.06)] transition hover:border-[#25D366]/35"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wine text-cream">
                        →
                      </span>
                      <span className="text-sm font-semibold text-wine">
                        {questionLabels.whatsappMixedLabel}
                      </span>
                    </a>
                  </div>

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
