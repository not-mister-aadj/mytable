"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import type {
  MemberOnboardingPrefs,
  OnboardingPersonalityId,
} from "@/lib/member-onboarding";

const ease = [0.22, 1, 0.36, 1] as const;

type EnrichStep = "story" | "goal" | "personality";

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
  const [step, setStep] = useState<EnrichStep>("story");
  const [storyIndex, setStoryIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const pathKey =
    prefs.joinIntent === "both"
      ? "both"
      : prefs.joinIntent === "with_group"
        ? "culinary"
        : "meet";
  const storyCards = labels.stories[pathKey];

  const progressSteps = useMemo(() => {
    const stories = storyCards.map(() => "story" as const);
    return [...stories, "goal" as const, "personality" as const];
  }, [storyCards]);

  const stepNumber =
    step === "story"
      ? storyIndex + 1
      : step === "goal"
        ? storyCards.length + 1
        : progressSteps.length;
  const totalSteps = progressSteps.length;
  const stepLabel = labels.stepLabel
    .replace("{current}", String(Math.min(stepNumber, totalSteps)))
    .replace("{total}", String(totalSteps));

  useEffect(() => {
    trackOnboardingStepViewed({
      step: step === "story" ? `story_${storyIndex}` : step,
      mode: "post_purchase",
      locale,
    });
  }, [step, storyIndex, locale]);

  function completeStep(from: string, next: string, choice?: string) {
    trackOnboardingStepCompleted({
      step: from,
      next_step: next,
      mode: "post_purchase",
      locale,
      choice,
    });
  }

  function afterStories() {
    completeStep(`story_${storyIndex}`, "goal");
    setStep("goal");
  }

  function advanceStory() {
    if (storyIndex < storyCards.length - 1) {
      completeStep(`story_${storyIndex}`, `story_${storyIndex + 1}`);
      setStoryIndex((i) => i + 1);
      return;
    }
    afterStories();
  }

  async function finishWithPersonality(personality: OnboardingPersonalityId) {
    const next = { ...prefs, personality };
    setPrefs(next);
    setSaving(true);
    try {
      completeStep("personality", "clubmember", personality);
      await saveMemberOnboardingPrefs(next);
      await refreshAuthSession();
      router.replace(`${clubmemberPath(locale)}?claim=1#happening`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (step === "personality") {
      setStep("goal");
      return;
    }
    if (step === "goal") {
      setStoryIndex(Math.max(0, storyCards.length - 1));
      setStep("story");
      return;
    }
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    }
  }

  const homeHref = localePath(locale);
  const card = storyCards[storyIndex];

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

        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {step === "story" && card ? (
              <motion.div
                key={`story-${pathKey}-${storyIndex}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
                className="w-full"
              >
                <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-[1.5rem] shadow-[0_16px_40px_rgba(43,13,18,0.1)]">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
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
                          i === storyIndex ? "w-6 bg-wine" : "w-1.5 bg-wine/20"
                        }`}
                      />
                    ))}
                  </div>
                  <h1 className="mt-4 text-center font-serif text-[1.65rem] font-medium leading-snug tracking-tight text-wine sm:mt-5 sm:text-3xl">
                    {card.title}
                  </h1>
                  <p className="mt-2 text-center text-sm leading-snug text-wine/65 sm:text-base sm:leading-relaxed">
                    {card.subtitle}
                  </p>
                  <button
                    type="button"
                    onClick={advanceStory}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218] sm:mt-7"
                  >
                    {card.cta}
                  </button>
                  {storyIndex > 0 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="mt-3 block w-full text-center text-sm text-wine/45 transition hover:text-wine/70"
                    >
                      {labels.back}
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ) : null}

            {step === "goal" ? (
              <motion.div
                key="goal"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease }}
                className="w-full"
              >
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
                <button
                  type="button"
                  onClick={() => {
                    completeStep("goal", "personality");
                    setStep("personality");
                  }}
                  className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218]"
                >
                  {labels.goal.cta}
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
