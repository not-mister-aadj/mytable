"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import {
  accountPath,
  agendaPath,
  clubmemberPath,
  joinPath,
  localePath,
} from "@/i18n/config";
import { Logo } from "@/components/Logo";
import type { AccountAuthLabels, AccountOnboardingLabels } from "@/i18n/account.types";
import type { WaitlistInterestId } from "@/i18n/waitlist-page.types";
import { useAuthSession } from "@/features/auth/AuthSessionContext";
import { AuthSignupForm } from "@/features/auth/AuthSignupForm";
import {
  clearMemberOnboardingCompleted,
  saveMemberOnboardingPrefs,
} from "@/features/auth/save-onboarding";
import { syncMemberCustomerClient } from "@/features/auth/sync-customer-client";
import { requestWomenWelcomeEmail } from "@/features/auth/request-women-welcome-email";
import {
  EMPTY_ONBOARDING_PREFS,
  MIN_ONBOARDING_AGE,
  VISIBLE_ONBOARDING_CITIES,
  ageFromBirthDate,
  buildBirthDate,
  canChooseGirlsOnly,
  isActiveOnboardingCity,
  isAtLeastMinAge,
  isComingSoonOnboardingCity,
  onboardingBirthYears,
  parseBirthDateParts,
  postLoginPath,
  readOnboardingFromMetadata,
  readPreferredCity,
  sanitizeOnboardingCities,
  wantsMeetPath,
  writeOnboardingToSession,
  clearJoinPending,
  markJoinPending,
  type MemberOnboardingPrefs,
  type OnboardingGenderId,
  type OnboardingLanguageId,
  type OnboardingPersonalityId,
  type OnboardingTableTypeId,
} from "@/lib/member-onboarding";

const ease = [0.22, 1, 0.36, 1] as const;

type FlowStep =
  | "language"
  | "brand"
  | "name"
  | "birthdate"
  | "intent"
  | "story"
  | "goal"
  | "city"
  | "gender"
  | "tableType"
  | "personality"
  | "signup"
  | "tastes"
  | "done"
  | "welcomeBack";

const FLOW_ORDER: FlowStep[] = [
  "language",
  "brand",
  "name",
  "birthdate",
  "intent",
  "story",
  "goal",
  "tastes",
  "city",
  "gender",
  "tableType",
  "personality",
  "signup",
  "done",
];

interface MemberOnboardingProps {
  labels: AccountOnboardingLabels;
  locale: Locale;
  email: string;
  initialStep?: FlowStep;
  alreadyCompleted?: boolean;
  initialPrefs?: MemberOnboardingPrefs;
  /** Pre-auth funnel: skip profile, end with signup */
  mode?: "account" | "join";
  authLabels?: AccountAuthLabels;
  /** After /join signup: only collect name/birth then done */
  resumeProfileOnly?: boolean;
}

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

function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "mt-8",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function MemberOnboarding({
  labels,
  locale,
  email,
  initialStep,
  alreadyCompleted = false,
  initialPrefs,
  mode = "account",
  authLabels,
  resumeProfileOnly = false,
}: MemberOnboardingProps) {
  const isJoin = mode === "join";
  const router = useRouter();
  const { signOut, refreshAuthSession, user } = useAuthSession();
  const [step, setStep] = useState<FlowStep>(
    initialStep ??
      (alreadyCompleted ? "welcomeBack" : "language"),
  );
  const [prefs, setPrefs] = useState<MemberOnboardingPrefs>(() => {
    const base = initialPrefs ?? { ...EMPTY_ONBOARDING_PREFS };
    return { ...base, cities: sanitizeOnboardingCities(base.cities) };
  });
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [birthError, setBirthError] = useState<string | null>(null);
  const birthParts = parseBirthDateParts(prefs.birthDate);
  const [birthDay, setBirthDay] = useState(birthParts.day);
  const [birthMonth, setBirthMonth] = useState(birthParts.month);
  const [birthYear, setBirthYear] = useState(birthParts.year);
  const [storyIndex, setStoryIndex] = useState(0);
  const choiceStepRef = useRef<FlowStep | null>(null);

  /** Never show a pre-selected choice — clear when entering a choice step. */
  useEffect(() => {
    if (choiceStepRef.current === step) return;
    choiceStepRef.current = step;

    if (step === "language") {
      setPrefs((p) => ({ ...p, languages: [] }));
      return;
    }
    if (step === "intent") {
      setPrefs((p) => {
        const preferred = readPreferredCity();
        return p.joinIntent === null
          ? p
          : {
              ...p,
              joinIntent: null,
              gender: null,
              tableType: null,
              personality: null,
              interests: [],
              cities: preferred ? [preferred] : [],
              cityFlexible: false,
              company: null,
            };
      });
      return;
    }
    if (step === "gender") {
      setPrefs((p) =>
        p.gender === null && p.tableType === null && p.personality === null
          ? p
          : { ...p, gender: null, tableType: null, personality: null },
      );
      return;
    }
    if (step === "tableType") {
      setPrefs((p) =>
        p.tableType === null ? p : { ...p, tableType: null },
      );
      return;
    }
    if (step === "personality") {
      setPrefs((p) =>
        p.personality === null ? p : { ...p, personality: null },
      );
      return;
    }
    if (step === "tastes") {
      setPrefs((p) =>
        p.interests.length === 0 ? p : { ...p, interests: [] },
      );
      return;
    }
    if (step === "city") {
      setPrefs((p) => {
        const preferred = readPreferredCity();
        if (preferred) {
          return { ...p, cities: [preferred], cityFlexible: false };
        }
        return p.cities.length === 0 && !p.cityFlexible
          ? p
          : { ...p, cities: [], cityFlexible: false };
      });
    }
  }, [step]);

  useEffect(() => {
    if (!isJoin) return;
    writeOnboardingToSession(prefs);
  }, [isJoin, prefs]);

  const pathKey =
    prefs.joinIntent === "with_group"
      ? "culinary"
      : prefs.joinIntent === "both"
        ? "both"
        : "meet";

  const storyCards = labels.stories[pathKey];

  const progressSteps = useMemo(() => {
    if (resumeProfileOnly) {
      return ["name", "birthdate", "done"] as FlowStep[];
    }
    const base: FlowStep[] = isJoin
      ? ["language", "intent"]
      : ["language", "brand", "name", "birthdate", "intent"];
    const storySlots = storyCards.map(() => "story" as FlowStep);
    const tail: FlowStep[] = isJoin ? [] : ["done"];

    if (prefs.joinIntent === "with_group") {
      const culinarySteps: FlowStep[] = ["tastes", "city", "gender"];
      if (canChooseGirlsOnly(prefs.gender)) {
        culinarySteps.push("tableType");
      }
      return [...base, ...storySlots, ...culinarySteps, ...tail];
    }
    if (prefs.joinIntent === "both") {
      const meetSteps: FlowStep[] = ["goal", "tastes", "city", "gender"];
      if (canChooseGirlsOnly(prefs.gender)) {
        meetSteps.push("tableType");
      }
      meetSteps.push("personality");
      return [...base, ...storySlots, ...meetSteps, ...tail];
    }
    if (prefs.joinIntent === "meet_new") {
      const meetSteps: FlowStep[] = ["goal", "city", "gender"];
      if (canChooseGirlsOnly(prefs.gender)) {
        meetSteps.push("tableType");
      }
      meetSteps.push("personality");
      return [...base, ...storySlots, ...meetSteps, ...tail];
    }
    return [...base, ...tail];
  }, [prefs.joinIntent, prefs.gender, isJoin, resumeProfileOnly, storyCards]);

  const stepNumber =
    step === "story"
      ? Math.max(1, progressSteps.indexOf("story") + storyIndex + 1)
      : Math.max(1, progressSteps.lastIndexOf(step) + 1);
  const totalSteps = progressSteps.length;
  const stepLabel = labels.stepLabel
    .replace("{current}", String(Math.min(stepNumber, totalSteps)))
    .replace("{total}", String(totalSteps));

  const computedAge = ageFromBirthDate(
    buildBirthDate(birthDay, birthMonth, birthYear) ?? prefs.birthDate,
  );
  const birthIsoDraft = buildBirthDate(birthDay, birthMonth, birthYear);
  const birthUnderage =
    birthIsoDraft !== null && !isAtLeastMinAge(birthIsoDraft, MIN_ONBOARDING_AGE);

  async function goAfterPrefs(overrides?: Partial<MemberOnboardingPrefs>) {
    const merged = { ...prefs, ...overrides };
    const next: MemberOnboardingPrefs = {
      ...merged,
      communityInterest:
        merged.joinIntent === "meet_new" || merged.joinIntent === "both"
          ? true
          : merged.communityInterest,
    };
    setPrefs(next);

    if (isJoin) {
      writeOnboardingToSession(next);
      markJoinPending();
      router.replace(accountPath(locale));
      return;
    }

    setSaving(true);
    try {
      await saveMemberOnboardingPrefs(next);
      clearJoinPending();
      await refreshAuthSession();
      if (next.gender === "woman") {
        requestWomenWelcomeEmail(locale);
      }
      setStep("done");
    } catch {
      // Keep the done step reachable so the user can retry via CTA.
      setStep("done");
    } finally {
      setSaving(false);
    }
  }

  async function finishAndGo(destination: "meet" | "culinary") {
    setSaving(true);
    try {
      await saveMemberOnboardingPrefs(prefs);
      clearJoinPending();
      await refreshAuthSession();
      await syncMemberCustomerClient(locale, { recordOnboarding: true });
      if (prefs.gender === "woman") {
        requestWomenWelcomeEmail(locale);
      }
      router.refresh();
      if (destination === "meet") {
        router.push(clubmemberPath(locale));
      } else {
        const q =
          prefs.interests.length > 0
            ? `?interest=${prefs.interests.join(",")}`
            : "";
        router.push(`${agendaPath(locale)}${q}`);
      }
    } finally {
      setSaving(false);
    }
  }

  function stepAfterLanguage(): FlowStep {
    if (isJoin) return user ? "intent" : "signup";
    return "brand";
  }

  function selectLanguage(nextLocale: OnboardingLanguageId) {
    const nextPrefs: MemberOnboardingPrefs = {
      ...prefs,
      languages: [nextLocale],
    };
    setPrefs(nextPrefs);
    if (isJoin) {
      writeOnboardingToSession(nextPrefs);
    }

    const nextStep = stepAfterLanguage();
    if (nextLocale === locale) {
      setTimeout(() => setStep(nextStep), 180);
      return;
    }

    const path = isJoin ? joinPath(nextLocale) : accountPath(nextLocale);
    router.replace(`${path}?step=${nextStep}`);
  }

  function startStories() {
    setStoryIndex(0);
    setStep("story");
  }

  function afterStories() {
    if (prefs.joinIntent === "with_group") {
      setStep("tastes");
      return;
    }
    setStep("goal");
  }

  function advanceStory() {
    if (storyIndex < storyCards.length - 1) {
      setStoryIndex((i) => i + 1);
      return;
    }
    afterStories();
  }

  function goNext(from: FlowStep) {
    if (from === "brand" && isJoin) {
      setStep("intent");
      return;
    }
    if (from === "goal") {
      if (prefs.joinIntent === "both") {
        setStep("tastes");
        return;
      }
      setStep("city");
      return;
    }
    if (from === "city") {
      setStep("gender");
      return;
    }
    if (from === "tableType") {
      if (prefs.joinIntent === "with_group") {
        void goAfterPrefs();
        return;
      }
      setStep("personality");
      return;
    }
    if (from === "personality") {
      void goAfterPrefs();
      return;
    }
    const idx = FLOW_ORDER.indexOf(from);
    const next = FLOW_ORDER[idx + 1];
    if (next) setStep(next);
  }

  function selectGender(gender: OnboardingGenderId) {
    const girlsOnly = canChooseGirlsOnly(gender);
    const tableType = girlsOnly ? prefs.tableType : ("mixed" as const);
    setPrefs((p) => ({
      ...p,
      gender,
      tableType,
    }));
    setTimeout(() => {
      if (girlsOnly) {
        setStep("tableType");
        return;
      }
      if (prefs.joinIntent === "with_group") {
        void goAfterPrefs({ gender, tableType });
        return;
      }
      setStep("personality");
    }, 180);
  }

  function selectPersonality(personality: OnboardingPersonalityId) {
    setPrefs((p) => ({ ...p, personality }));
    setTimeout(() => void goAfterPrefs({ personality }), 180);
  }

  function goBack() {
    if (step === "language") {
      return;
    }
    if (step === "brand") {
      setStep("language");
      return;
    }
    if (step === "intent" && isJoin) {
      setStep("language");
      return;
    }
    if (step === "signup") {
      setStep("language");
      return;
    }
    if (step === "story") {
      if (storyIndex > 0) {
        setStoryIndex((i) => i - 1);
        return;
      }
      setStep("intent");
      return;
    }
    if (step === "goal") {
      setStoryIndex(Math.max(0, storyCards.length - 1));
      setStep("story");
      return;
    }
    if (step === "tastes") {
      if (prefs.joinIntent === "with_group") {
        setStoryIndex(Math.max(0, storyCards.length - 1));
        setStep("story");
      } else {
        setStep("goal");
      }
      return;
    }
    if (step === "city") {
      setStep(
        prefs.joinIntent === "with_group" || prefs.joinIntent === "both"
          ? "tastes"
          : "goal",
      );
      return;
    }
    if (step === "gender") {
      setStep("city");
      return;
    }
    if (step === "tableType") {
      setStep("gender");
      return;
    }
    if (step === "personality") {
      setStep(canChooseGirlsOnly(prefs.gender) ? "tableType" : "gender");
      return;
    }
    if (step === "done") {
      setStep(
        resumeProfileOnly
          ? "birthdate"
          : wantsMeetPath(prefs.joinIntent)
            ? "personality"
            : "city",
      );
      return;
    }
    if (step === "birthdate" && resumeProfileOnly) {
      setStep("name");
      return;
    }
    if (step === "name" && resumeProfileOnly) {
      return;
    }
    const idx = FLOW_ORDER.indexOf(step);
    if (idx > 0) setStep(FLOW_ORDER[idx - 1]!);
  }

  function submitName() {
    const trimmed = prefs.name.trim();
    if (!trimmed) {
      setNameError(labels.name.required);
      return;
    }
    setNameError(null);
    setPrefs((p) => ({ ...p, name: trimmed }));
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
    // Returning from /join funnel — prefs already collected
    if (prefs.joinIntent) {
      setStep("done");
      return;
    }
    setStep("intent");
  }

  function toggleCity(city: string) {
    if (!isActiveOnboardingCity(city)) return;
    setPrefs((prev) => {
      if (prev.cityFlexible) {
        return { ...prev, cityFlexible: false, cities: [city] };
      }
      if (prev.cities.includes(city)) {
        return { ...prev, cities: prev.cities.filter((c) => c !== city) };
      }
      if (prev.cities.length >= 2) return prev;
      return { ...prev, cities: [...prev.cities, city] };
    });
  }

  function toggleInterest(id: WaitlistInterestId) {
    setPrefs((prev) => {
      if (prev.interests.includes(id)) {
        return {
          ...prev,
          interests: prev.interests.filter((i) => i !== id),
        };
      }
      if (prev.interests.length >= 3) return prev;
      return { ...prev, interests: [...prev.interests, id] };
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace(localePath(locale));
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  async function redoOnboarding() {
    await clearMemberOnboardingCompleted();
    await refreshAuthSession();
    setPrefs({ ...EMPTY_ONBOARDING_PREFS });
    setBirthDay(0);
    setBirthMonth(0);
    setBirthYear(0);
    setNameError(null);
    setBirthError(null);
    setStep("brand");
    router.replace(accountPath(locale));
    router.refresh();
  }

  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (prefs.name.trim()) {
      lines.push(labels.done.summaryName.replace("{name}", prefs.name.trim()));
    }
    const age = ageFromBirthDate(prefs.birthDate);
    if (age !== null) {
      lines.push(labels.done.summaryAge.replace("{age}", String(age)));
    }
    if (prefs.joinIntent === "meet_new") {
      lines.push(labels.done.summaryIntentMeet);
    } else if (prefs.joinIntent === "with_group") {
      lines.push(labels.done.summaryIntentCulinary);
    } else if (prefs.joinIntent === "both") {
      lines.push(labels.done.summaryIntentBoth);
    }
    if (prefs.cityFlexible) {
      lines.push(labels.done.summaryFlexible);
    } else if (prefs.cities.length > 0) {
      lines.push(
        labels.done.summaryCities.replace("{cities}", prefs.cities.join(", ")),
      );
    }
    if (prefs.tableType === "girls_only") {
      lines.push(labels.done.summaryTableGirls);
    } else if (prefs.tableType === "mixed") {
      lines.push(labels.done.summaryTableMixed);
    } else if (prefs.tableType === "no_preference") {
      lines.push(labels.done.summaryTableAny);
    }
    if (prefs.personality === "introverted") {
      lines.push(labels.done.summaryPersonalityIntroverted);
    } else if (prefs.personality === "ambivert") {
      lines.push(labels.done.summaryPersonalityAmbivert);
    } else if (prefs.personality === "extroverted") {
      lines.push(labels.done.summaryPersonalityExtroverted);
    }
    if (prefs.communityInterest) {
      lines.push(labels.done.summaryCommunity);
    }
    if (prefs.interests.length > 0) {
      const tasteLabels: Record<string, string> = {
        wine_walk: labels.tastes.wineWalk,
        food_walk: labels.tastes.foodWalk,
        wine_tasting: labels.tastes.tasting,
        chefs_special: labels.tastes.dinner,
      };
      lines.push(
        labels.done.summaryTastes.replace(
          "{tastes}",
          prefs.interests.map((i) => tasteLabels[i] ?? i).join(", "),
        ),
      );
    }
    return lines;
  }, [prefs, labels]);

  const showChrome = step !== "welcomeBack" && step !== "signup";
  const homeHref = localePath(locale);

  return (
    <div className="flex h-[100svh] max-h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-beige via-cream to-cream">
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8">
        {showChrome ? (
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
        ) : (
          <div className="flex shrink-0 justify-center pt-2">
            <Link
              href={homeHref}
              className="relative inline-flex shrink-0 transition-opacity hover:opacity-90"
              aria-label="MyTable"
            >
              <Logo variant="header" priority />
            </Link>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {step === "language" ? (
              <StepShell key="language">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.language.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55">
                  {labels.language.subtitle}
                </p>
                <div className="mt-8 space-y-3">
                  <ChoiceButton
                    title={labels.language.dutch}
                    onClick={() => selectLanguage("nl")}
                    selected={prefs.languages.includes("nl")}
                    index={0}
                  />
                  <ChoiceButton
                    title={labels.language.english}
                    onClick={() => selectLanguage("en")}
                    selected={prefs.languages.includes("en")}
                    index={1}
                  />
                </div>
              </StepShell>
            ) : null}

            {step === "brand" ? (
              <StepShell key="brand">
                <p className="text-center font-serif text-3xl font-medium italic leading-snug tracking-tight text-wine sm:text-4xl">
                  {labels.brand.tagline}
                </p>
                <p className="mx-auto mt-5 max-w-sm text-center text-base leading-relaxed text-wine/65">
                  {labels.brand.body}
                </p>
                <PrimaryButton onClick={() => goNext("brand")}>
                  {labels.continue}
                </PrimaryButton>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "name" ? (
              <StepShell key="name">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.name.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55">
                  {labels.name.subtitle}
                </p>
                <label className="mt-8 block">
                  <span className="sr-only">{labels.name.label}</span>
                  <input
                    type="text"
                    autoComplete="given-name"
                    autoFocus
                    value={prefs.name}
                    onChange={(e) => {
                      setNameError(null);
                      setPrefs((p) => ({ ...p, name: e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitName();
                      }
                    }}
                    placeholder={labels.name.placeholder}
                    className="w-full rounded-2xl border border-wine/15 bg-white px-5 py-4 text-center font-serif text-2xl text-wine outline-none transition placeholder:text-wine/30 focus:border-wine/40"
                  />
                </label>
                {nameError ? (
                  <p className="mt-3 text-center text-sm text-burgundy">
                    {nameError}
                  </p>
                ) : null}
                <PrimaryButton onClick={submitName}>
                  {labels.continue}
                </PrimaryButton>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "birthdate" ? (
              <StepShell key="birthdate">
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
                      {labels.birthdate.months.map((monthLabel, i) => (
                        <option key={monthLabel} value={i + 1}>
                          {monthLabel}
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
                {computedAge !== null && !birthError && !birthUnderage ? (
                  <p className="mt-3 text-center text-sm text-wine/55">
                    {labels.birthdate.ageHint.replace(
                      "{age}",
                      String(computedAge),
                    )}
                  </p>
                ) : null}
                {birthUnderage || birthError ? (
                  <p className="mt-3 text-center text-sm text-burgundy">
                    {birthError ?? labels.birthdate.underage}
                  </p>
                ) : null}
                <PrimaryButton
                  disabled={!birthIsoDraft || birthUnderage}
                  onClick={submitBirthdate}
                >
                  {labels.continue}
                </PrimaryButton>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "intent" ? (
              <StepShell key="intent">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.intent.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55 sm:text-base">
                  {labels.intent.subtitle}
                </p>
                <div className="mt-8 grid gap-3">
                  <ChoiceButton
                    title={labels.intent.meetTitle}
                    hint={labels.intent.meetHint}
                    selected={prefs.joinIntent === "meet_new"}
                    onClick={() => {
                      setPrefs((p) => ({ ...p, joinIntent: "meet_new" }));
                      setTimeout(() => startStories(), 180);
                    }}
                    index={0}
                  />
                  <ChoiceButton
                    title={labels.intent.culinaryTitle}
                    hint={labels.intent.culinaryHint}
                    selected={prefs.joinIntent === "with_group"}
                    onClick={() => {
                      setPrefs((p) => ({
                        ...p,
                        joinIntent: "with_group",
                      }));
                      setTimeout(() => startStories(), 180);
                    }}
                    index={1}
                  />
                  <ChoiceButton
                    title={labels.intent.bothTitle}
                    hint={labels.intent.bothHint}
                    selected={prefs.joinIntent === "both"}
                    onClick={() => {
                      setPrefs((p) => ({ ...p, joinIntent: "both" }));
                      setTimeout(() => startStories(), 180);
                    }}
                    index={2}
                  />
                </div>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "story" && storyCards[storyIndex] ? (
              <StepShell key={`story-${pathKey}-${storyIndex}`}>
                <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-[1.5rem] shadow-[0_16px_40px_rgba(43,13,18,0.1)]">
                  <Image
                    src={storyCards[storyIndex]!.image}
                    alt={storyCards[storyIndex]!.imageAlt}
                    fill
                    sizes="(max-width: 640px) 90vw, 384px"
                    className="object-cover object-center"
                    priority
                  />
                </div>
                <div className="mt-5 shrink-0 sm:mt-6">
                  <div className="flex justify-center gap-1.5">
                    {storyCards.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === storyIndex
                            ? "w-6 bg-wine"
                            : "w-1.5 bg-wine/20"
                        }`}
                      />
                    ))}
                  </div>
                  <h1 className="mt-4 text-center font-serif text-[1.65rem] font-medium leading-snug tracking-tight text-wine sm:mt-5 sm:text-3xl">
                    {storyCards[storyIndex]!.title}
                  </h1>
                  <p className="mt-2 text-center text-sm leading-snug text-wine/65 sm:text-base sm:leading-relaxed">
                    {storyCards[storyIndex]!.subtitle}
                  </p>
                  <PrimaryButton
                    className="mt-6 sm:mt-7"
                    onClick={advanceStory}
                  >
                    {storyCards[storyIndex]!.cta}
                  </PrimaryButton>
                  <TextLink className="mt-3" onClick={goBack}>
                    {labels.back}
                  </TextLink>
                </div>
              </StepShell>
            ) : null}

            {step === "goal" ? (
              <StepShell key="goal">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.goal.title}
                </h1>
                <ul className="mt-8 space-y-4">
                  {labels.goal.lines.map((line, index) => (
                    <motion.li
                      key={line}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.06 * index,
                        ease,
                      }}
                      className="text-center font-serif text-xl font-medium leading-snug text-wine sm:text-2xl"
                    >
                      {line}
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-8 text-center text-sm font-medium tracking-wide text-wine/45">
                  {labels.goal.notDating}
                </p>
                <PrimaryButton onClick={() => goNext("goal")}>
                  {labels.goal.cta}
                </PrimaryButton>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "city" ? (
              <StepShell key="city">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.city.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55">
                  {labels.city.subtitle}
                </p>
                <p className="mt-1 text-center text-xs text-wine/40">
                  {labels.city.maxHint}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {VISIBLE_ONBOARDING_CITIES.map((city) => {
                    const comingSoon = isComingSoonOnboardingCity(city);
                    const selected = prefs.cities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        disabled={comingSoon}
                        onClick={() => toggleCity(city)}
                        className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                          comingSoon
                            ? "cursor-not-allowed border-wine/10 bg-wine/[0.03] text-wine/35"
                            : selected
                              ? "border-wine bg-wine text-cream"
                              : "border-wine/15 bg-white text-wine hover:border-burgundy/40"
                        }`}
                      >
                        {city}
                        {comingSoon ? (
                          <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
                            {labels.city.comingSoon}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPrefs((p) => ({
                      ...p,
                      cityFlexible: !p.cityFlexible,
                      cities: !p.cityFlexible ? [] : p.cities,
                    }))
                  }
                  className={`mt-4 w-full rounded-2xl border px-4 py-3.5 text-sm font-medium transition ${
                    prefs.cityFlexible
                      ? "border-wine bg-wine/5 text-wine"
                      : "border-wine/12 bg-white text-wine/70 hover:border-wine/25"
                  }`}
                >
                  {labels.city.flexible}
                </button>
                <PrimaryButton
                  disabled={!prefs.cityFlexible && prefs.cities.length === 0}
                  onClick={() => goNext("city")}
                >
                  {labels.continue}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => {
                    setPrefs((p) => ({
                      ...p,
                      cityFlexible: true,
                      cities: [],
                    }));
                    goNext("city");
                  }}
                  className="mt-3 text-center text-sm text-wine/45 hover:text-wine"
                >
                  {labels.skip}
                </button>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "gender" ? (
              <StepShell key="gender">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.gender.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55">
                  {labels.gender.subtitle}
                </p>
                <div className="mt-8 grid gap-3">
                  {(
                    [
                      ["woman", labels.gender.woman],
                      ["man", labels.gender.man],
                      ["non_binary", labels.gender.nonBinary],
                      ["prefer_not", labels.gender.preferNot],
                    ] as const
                  ).map(([id, title], index) => (
                    <ChoiceButton
                      key={id}
                      title={title}
                      selected={prefs.gender === id}
                      onClick={() => selectGender(id)}
                      index={index}
                    />
                  ))}
                </div>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "tableType" ? (
              <StepShell key="tableType">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.tableType.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55">
                  {labels.tableType.subtitle}
                </p>
                <div className="mt-8 grid gap-3">
                  {(
                    [
                      [
                        "girls_only",
                        labels.tableType.girlsOnly,
                        labels.tableType.girlsOnlyHint,
                      ],
                      [
                        "mixed",
                        labels.tableType.mixed,
                        labels.tableType.mixedHint,
                      ],
                      [
                        "no_preference",
                        labels.tableType.noPreference,
                        labels.tableType.noPreferenceHint,
                      ],
                    ] as const
                  ).map(([id, title, hint], index) => (
                    <ChoiceButton
                      key={id}
                      title={title}
                      hint={hint}
                      selected={prefs.tableType === id}
                      onClick={() => {
                        const nextType = id as OnboardingTableTypeId;
                        setPrefs((p) => ({
                          ...p,
                          tableType: nextType,
                        }));
                        setTimeout(() => {
                          if (prefs.joinIntent === "with_group") {
                            void goAfterPrefs({ tableType: nextType });
                            return;
                          }
                          setStep("personality");
                        }, 180);
                      }}
                      index={index}
                    />
                  ))}
                </div>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "personality" ? (
              <StepShell key="personality">
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
                      onClick={() => selectPersonality(id)}
                      index={index}
                    />
                  ))}
                </div>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "signup" && authLabels ? (
              <StepShell key="signup">
                <AuthSignupForm
                  locale={locale}
                  labels={authLabels}
                  nextPath={joinPath(locale)}
                  onAuthenticated={() => {
                    void refreshAuthSession().then((user) => {
                      const meta = (user?.user_metadata ??
                        {}) as Record<string, unknown>;
                      const { completed, prefs: savedPrefs } =
                        readOnboardingFromMetadata(meta);
                      if (completed) {
                        router.replace(
                          postLoginPath(locale, savedPrefs.joinIntent, {
                            interests: savedPrefs.interests,
                          }),
                        );
                        router.refresh();
                        return;
                      }
                      setStep("intent");
                      router.refresh();
                    });
                  }}
                  title={labels.signupEnd.title}
                  subtitle={labels.signupEnd.subtitle}
                />
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "tastes" ? (
              <StepShell key="tastes">
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
                <PrimaryButton
                  disabled={prefs.interests.length === 0}
                  onClick={() => setStep("city")}
                >
                  {labels.continue}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => setStep("city")}
                  className="mt-3 text-center text-sm text-wine/45 hover:text-wine"
                >
                  {labels.skip}
                </button>
                <TextLink onClick={goBack}>{labels.back}</TextLink>
              </StepShell>
            ) : null}

            {step === "done" ? (
              <StepShell key="done">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.done.title}
                </h1>
                <p className="mt-2 text-center text-sm text-wine/55">
                  {labels.done.subtitle}
                </p>
                <ul className="mt-6 space-y-2 rounded-3xl border border-wine/10 bg-white/80 px-5 py-5 text-left text-sm text-wine/75">
                  {summaryLines.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-gold" aria-hidden>
                        ·
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
                {prefs.joinIntent === "both" ? (
                  <div className="mt-2 grid gap-3">
                    <PrimaryButton
                      disabled={saving}
                      onClick={() => void finishAndGo("meet")}
                    >
                      {labels.done.primaryMeet}
                    </PrimaryButton>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void finishAndGo("culinary")}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-wine/15 bg-white px-6 text-xs font-semibold uppercase tracking-[0.14em] text-wine transition hover:border-wine/30 hover:bg-cream disabled:opacity-60"
                    >
                      {labels.done.primaryCulinary}
                    </button>
                  </div>
                ) : (
                  <PrimaryButton
                    disabled={saving}
                    onClick={() =>
                      void finishAndGo(
                        prefs.joinIntent === "with_group" ? "culinary" : "meet",
                      )
                    }
                  >
                    {prefs.joinIntent === "with_group"
                      ? labels.done.primaryCulinary
                      : labels.done.primaryMeet}
                  </PrimaryButton>
                )}
                <button
                  type="button"
                  onClick={() => setStep("intent")}
                  className="mt-3 text-center text-sm text-wine/45 hover:text-wine"
                >
                  {labels.done.secondary}
                </button>
              </StepShell>
            ) : null}

            {step === "welcomeBack" ? (
              <StepShell key="welcomeBack">
                <h1 className="text-center font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
                  {labels.welcomeBack.title}
                </h1>
                <p className="mt-2 text-center text-base text-wine/60">
                  {labels.welcomeBack.subtitle}
                </p>
                {email ? (
                  <p className="mt-3 text-center text-sm text-wine/40">{email}</p>
                ) : null}
                <div className="mt-8 grid gap-3">
                  <ChoiceButton
                    title={labels.welcomeBack.meetCta}
                    hint={labels.welcomeBack.meetHint}
                    onClick={() =>
                      router.push(clubmemberPath(locale))
                    }
                    index={0}
                  />
                  <ChoiceButton
                    title={labels.welcomeBack.culinaryCta}
                    hint={labels.welcomeBack.culinaryHint}
                    onClick={() => {
                      const q =
                        prefs.interests.length > 0
                          ? `?interest=${prefs.interests.join(",")}`
                          : "";
                      router.push(`${agendaPath(locale)}${q}`);
                    }}
                    index={1}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void redoOnboarding()}
                  className="mt-8 text-sm text-wine/45 hover:text-wine"
                >
                  {labels.welcomeBack.redo}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  className="mt-3 text-sm text-wine/35 hover:text-wine disabled:opacity-50"
                >
                  {signingOut ? labels.signingOut : labels.signOut}
                </button>
              </StepShell>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}

function TextLink({
  children,
  onClick,
  className = "mt-4",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-center text-sm font-medium text-wine/45 underline-offset-4 hover:text-wine hover:underline ${className}`}
    >
      {children}
    </button>
  );
}
