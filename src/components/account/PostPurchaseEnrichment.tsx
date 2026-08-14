"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { clubmemberPath, localePath } from "@/i18n/config";
import { Logo } from "@/components/Logo";
import type { AccountOnboardingLabels } from "@/i18n/account.types";
import { saveMemberOnboardingPrefs } from "@/features/auth/save-onboarding";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import {
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed,
} from "@/lib/posthog/analytics";
import {
  MIN_ONBOARDING_AGE,
  ageFromBirthDate,
  buildBirthDate,
  isAtLeastMinAge,
  onboardingBirthYears,
  parseBirthDateParts,
  type MemberOnboardingPrefs,
  type OnboardingPersonalityId,
} from "@/lib/member-onboarding";
import type { WaitlistInterestId } from "@/i18n/waitlist-page.types";

const ease = [0.22, 1, 0.36, 1] as const;

type EnrichStep = "name" | "birthdate" | "personality" | "tastes";

function ChoiceButton({
  title,
  hint,
  onClick,
  selected,
  index,
}: {
  title: string;
  hint?: string;
  onClick: () => void;
  selected?: boolean;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease }}
      onClick={onClick}
      aria-pressed={selected}
      className={`block w-full rounded-3xl border px-6 py-5 text-left transition sm:px-7 sm:py-6 ${
        selected
          ? "border-wine bg-wine text-cream shadow-[0_12px_32px_rgba(43,13,18,0.18)]"
          : "border-wine/12 bg-white text-wine shadow-[0_8px_30px_rgba(43,13,18,0.05)] hover:border-burgundy/35 hover:bg-beige/60"
      }`}
    >
      <span className="block font-serif text-xl font-medium sm:text-2xl">
        {title}
      </span>
      {hint ? (
        <span
          className={`mt-1.5 block text-sm leading-relaxed ${
            selected ? "text-cream/75" : "text-wine/60"
          }`}
        >
          {hint}
        </span>
      ) : null}
    </motion.button>
  );
}

export function PostPurchaseEnrichment({
  labels,
  locale,
  initialPrefs,
}: {
  labels: AccountOnboardingLabels;
  locale: Locale;
  initialPrefs: MemberOnboardingPrefs;
}) {
  const router = useRouter();
  const { refreshAuthSession } = useAuthSession();
  const [prefs, setPrefs] = useState(initialPrefs);
  const [step, setStep] = useState<EnrichStep>(() =>
    !initialPrefs.name.trim() || !initialPrefs.birthDate
      ? "name"
      : "personality",
  );
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [birthError, setBirthError] = useState<string | null>(null);
  const birthParts = parseBirthDateParts(initialPrefs.birthDate);
  const [birthDay, setBirthDay] = useState(birthParts.day);
  const [birthMonth, setBirthMonth] = useState(birthParts.month);
  const [birthYear, setBirthYear] = useState(birthParts.year);

  const needsProfileSteps =
    !initialPrefs.name.trim() || !initialPrefs.birthDate;

  const progressSteps = useMemo(() => {
    const profileSteps: EnrichStep[] = needsProfileSteps
      ? ["name", "birthdate"]
      : [];
    return [...profileSteps, "personality" as const, "tastes" as const];
  }, [needsProfileSteps]);

  const stepNumber = Math.max(1, progressSteps.lastIndexOf(step) + 1);
  const totalSteps = progressSteps.length;
  const stepLabel = labels.stepLabel
    .replace("{current}", String(Math.min(stepNumber, totalSteps)))
    .replace("{total}", String(totalSteps));

  const birthIsoDraft = buildBirthDate(birthDay, birthMonth, birthYear);
  const birthUnderage =
    birthIsoDraft !== null &&
    !isAtLeastMinAge(birthIsoDraft, MIN_ONBOARDING_AGE);
  const computedAge = ageFromBirthDate(birthIsoDraft ?? prefs.birthDate);

  useEffect(() => {
    trackOnboardingStepViewed({
      step,
      mode: "post_purchase",
      locale,
    });
  }, [step, locale]);

  function completeStep(from: string, next: string, choice?: string) {
    trackOnboardingStepCompleted({
      step: from,
      next_step: next,
      mode: "post_purchase",
      locale,
      choice,
    });
  }

  function submitName() {
    const trimmed = prefs.name.trim();
    if (!trimmed) {
      setNameError(labels.name.required);
      return;
    }
    setNameError(null);
    setPrefs((p) => ({ ...p, name: trimmed }));
    completeStep("name", "birthdate");
    setStep("birthdate");
  }

  function submitBirthdate() {
    const iso = buildBirthDate(birthDay, birthMonth, birthYear);
    if (!iso) {
      setBirthError(labels.birthdate.invalid);
      return;
    }
    if (!isAtLeastMinAge(iso, MIN_ONBOARDING_AGE)) {
      setBirthError(labels.birthdate.underage);
      return;
    }
    setBirthError(null);
    setPrefs((p) => ({ ...p, birthDate: iso }));
    completeStep("birthdate", "personality");
    setStep("personality");
  }

  function finishWithPersonality(personality: OnboardingPersonalityId) {
    setPrefs((p) => ({ ...p, personality }));
    completeStep("personality", "tastes", personality);
    setStep("tastes");
  }

  function toggleInterest(id: WaitlistInterestId) {
    setPrefs((prev) => {
      if (prev.interests.includes(id)) {
        return { ...prev, interests: prev.interests.filter((i) => i !== id) };
      }
      if (prev.interests.length >= 3) return prev;
      return { ...prev, interests: [...prev.interests, id] };
    });
  }

  async function finishWithTastes() {
    setSaving(true);
    try {
      completeStep("tastes", "clubmember");
      await saveMemberOnboardingPrefs(prefs);
      await refreshAuthSession();
      router.replace(`${clubmemberPath(locale)}?claim=1#happening`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (step === "tastes") {
      setStep("personality");
      return;
    }
    if (step === "personality") {
      if (needsProfileSteps) setStep("birthdate");
      return;
    }
    if (step === "birthdate") {
      setStep("name");
    }
  }

  const homeHref = localePath(locale);

  return (
    <div className="flex h-[100svh] max-h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-beige via-cream to-cream">
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-3 pt-1">
            <Link
              href={homeHref}
              className="relative inline-flex shrink-0 transition-opacity hover:opacity-90"
              aria-label="MyTable"
            >
              <Logo variant="header" priority />
            </Link>
            <p className="text-[11px] font-medium tracking-wide text-wine/40">
              {stepLabel}
            </p>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-wine/10">
            <div
              className="h-full rounded-full bg-wine transition-all duration-500 ease-out"
              style={{
                width: `${(Math.min(stepNumber, totalSteps) / totalSteps) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="scrollbar-none flex min-h-0 flex-1 flex-col justify-center overflow-y-auto py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {step === "name" ? (
              <motion.div
                key="name"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
                className="w-full"
              >
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.name.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55 sm:text-base">
                  {labels.name.subtitle}
                </p>
                <label className="mt-8 block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45">
                    {labels.name.label}
                  </span>
                  <input
                    type="text"
                    value={prefs.name}
                    onChange={(e) => {
                      setNameError(null);
                      setPrefs((p) => ({ ...p, name: e.target.value }));
                    }}
                    placeholder={labels.name.placeholder}
                    autoComplete="given-name"
                    className="w-full rounded-2xl border border-wine/15 bg-white px-4 py-3.5 text-base text-wine outline-none placeholder:text-wine/35 focus:border-wine/40"
                  />
                </label>
                {nameError ? (
                  <p className="mt-2 text-center text-sm text-burgundy">
                    {nameError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={submitName}
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218]"
                >
                  {labels.continue}
                </button>
              </motion.div>
            ) : null}

            {step === "birthdate" ? (
              <motion.div
                key="birthdate"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
                className="w-full"
              >
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.birthdate.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55">
                  {labels.birthdate.subtitle}
                </p>
                <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45">
                      {labels.birthdate.day}
                    </span>
                    <select
                      value={birthDay || ""}
                      onChange={(e) => {
                        setBirthError(null);
                        setBirthDay(Number(e.target.value) || 0);
                      }}
                      className="w-full appearance-none rounded-2xl border border-wine/15 bg-white px-2 py-3.5 text-center text-sm text-wine outline-none focus:border-wine/40 sm:px-3"
                    >
                      <option value="">·</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45">
                      {labels.birthdate.month}
                    </span>
                    <select
                      value={birthMonth || ""}
                      onChange={(e) => {
                        setBirthError(null);
                        setBirthMonth(Number(e.target.value) || 0);
                      }}
                      className="w-full appearance-none rounded-2xl border border-wine/15 bg-white px-1 py-3.5 text-center text-sm text-wine outline-none focus:border-wine/40 sm:px-2"
                    >
                      <option value="">·</option>
                      {labels.birthdate.months.map((month, i) => (
                        <option key={month} value={i + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-wine/45">
                      {labels.birthdate.year}
                    </span>
                    <select
                      value={birthYear || ""}
                      onChange={(e) => {
                        setBirthError(null);
                        setBirthYear(Number(e.target.value) || 0);
                      }}
                      className="w-full appearance-none rounded-2xl border border-wine/15 bg-white px-2 py-3.5 text-center text-sm text-wine outline-none focus:border-wine/40 sm:px-3"
                    >
                      <option value="">·</option>
                      {onboardingBirthYears().map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {computedAge !== null && !birthUnderage ? (
                  <p className="mt-3 text-center text-sm text-wine/50">
                    {labels.birthdate.ageHint.replace(
                      "{age}",
                      String(computedAge),
                    )}
                  </p>
                ) : null}
                {birthError ? (
                  <p className="mt-2 text-center text-sm text-burgundy">
                    {birthError}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={!birthIsoDraft || birthUnderage}
                  onClick={submitBirthdate}
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218] disabled:opacity-40"
                >
                  {labels.continue}
                </button>
                <button
                  type="button"
                  onClick={goBack}
                  className="mt-3 block w-full text-center text-sm text-wine/45 transition hover:text-wine/70"
                >
                  {labels.back}
                </button>
              </motion.div>
            ) : null}

            {step === "personality" ? (
              <motion.div
                key="personality"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
                className="w-full"
              >
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.personality.title}
                </h1>
                <p className="mt-3 text-center text-base leading-relaxed text-wine/65">
                  {labels.personality.subtitle}
                </p>
                <div className="mt-8 grid gap-3">
                  {(
                    [
                      [
                        "introverted",
                        labels.personality.introverted,
                        labels.personality.introvertedHint,
                      ],
                      [
                        "ambivert",
                        labels.personality.ambivert,
                        labels.personality.ambivertHint,
                      ],
                      [
                        "extroverted",
                        labels.personality.extroverted,
                        labels.personality.extrovertedHint,
                      ],
                    ] as const
                  ).map(([id, title, hint], index) => (
                    <ChoiceButton
                      key={id}
                      title={title}
                      hint={hint}
                      selected={prefs.personality === id}
                      onClick={() => {
                        if (saving) return;
                        void finishWithPersonality(id);
                      }}
                      index={index}
                    />
                  ))}
                </div>
                {needsProfileSteps ? (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={saving}
                    className="mt-3 block w-full text-center text-sm text-wine/45 transition hover:text-wine/70 disabled:opacity-40"
                  >
                    {labels.back}
                  </button>
                ) : null}
              </motion.div>
            ) : null}

            {step === "tastes" ? (
              <motion.div
                key="tastes"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
                className="w-full"
              >
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.tastes.title}
                </h1>
                {labels.tastes.subtitle ? (
                  <p className="mt-2 text-center text-sm text-wine/55">
                    {labels.tastes.subtitle}
                  </p>
                ) : null}
                <p className="mt-2 text-center text-xs leading-relaxed text-wine/40">
                  {labels.tastes.note}
                </p>
                <div className="mt-8 grid gap-3">
                  {(
                    [
                      [
                        "wine_walk",
                        labels.tastes.wineWalk,
                        labels.tastes.wineWalkHint,
                      ],
                      [
                        "food_walk",
                        labels.tastes.foodWalk,
                        labels.tastes.foodWalkHint,
                      ],
                      [
                        "wine_tasting",
                        labels.tastes.tasting,
                        labels.tastes.tastingHint,
                      ],
                      [
                        "chefs_special",
                        labels.tastes.dinner,
                        labels.tastes.dinnerHint,
                      ],
                    ] as const
                  ).map(([id, title, hint], index) => (
                    <ChoiceButton
                      key={id}
                      title={title}
                      hint={hint}
                      selected={prefs.interests.includes(id)}
                      onClick={() => toggleInterest(id)}
                      index={index}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void finishWithTastes()}
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218] disabled:opacity-40"
                >
                  {labels.continue}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void finishWithTastes()}
                  className="mt-3 block w-full text-center text-sm text-wine/45 transition hover:text-wine/70 disabled:opacity-40"
                >
                  {labels.skip}
                </button>
                <button
                  type="button"
                  onClick={goBack}
                  disabled={saving}
                  className="mt-3 block w-full text-center text-sm text-wine/45 transition hover:text-wine/70 disabled:opacity-40"
                >
                  {labels.back}
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
