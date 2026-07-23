"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { agendaPath } from "@/i18n/config";
import type {
  WaitlistCompanyId,
  WaitlistInterestId,
  WaitlistPageLabels,
  WaitlistPreferences,
  WaitlistTableTypeId,
  WaitlistWhyId,
} from "@/i18n/waitlist-page.types";
import {
  getMetaBrowserCookies,
  getMetaEventSourceUrl,
} from "@/lib/analytics/metaCookies";
import { trackMetaLead } from "@/lib/analytics/metaTracking";
import { trackEmailSignupCompleted, trackWhatsappJoinClicked } from "@/lib/posthog/analytics";
import { Button } from "@/components/ui/Button";
import type { WaitlistWhatsappLinks } from "@/lib/waitlist-whatsapp";
import { resolveWhatsappInvitesForInterests } from "@/lib/waitlist-whatsapp";

type FunnelStep =
  | "intro"
  | "interests"
  | "why"
  | "company"
  | "tableType"
  | "where"
  | "contact"
  | "result";

const QUESTION_STEPS: FunnelStep[] = [
  "interests",
  "why",
  "company",
  "tableType",
  "where",
  "contact",
];

interface WaitlistLandingViewProps {
  labels: WaitlistPageLabels;
  locale: Locale;
  whatsappLinks?: WaitlistWhatsappLinks;
}

function toggleValue<T extends string>(current: T[], value: T): T[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

const ease = [0.22, 1, 0.36, 1] as const;

function AnswerCard({
  title,
  description,
  selected,
  onClick,
  index,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04 * index, ease }}
      whileTap={{ scale: 0.985 }}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition-all duration-300 sm:px-6 sm:py-5 ${
        selected
          ? "border-wine bg-wine text-cream shadow-[0_16px_40px_rgba(43,13,18,0.18)]"
          : "border-wine/12 bg-white/70 text-wine shadow-[0_1px_0_rgba(43,13,18,0.03)] hover:border-wine/30 hover:bg-white"
      }`}
    >
      <span className="flex items-center gap-4">
        <span
          aria-hidden
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
            selected
              ? "border-cream/40 bg-cream text-wine"
              : "border-wine/20 bg-transparent"
          }`}
        >
          {selected ? (
            <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-xl font-medium tracking-tight sm:text-[1.35rem]">
            {title}
          </span>
          {description ? (
            <span
              className={`mt-1.5 block text-sm leading-relaxed ${
                selected ? "text-cream/75" : "text-wine/55"
              }`}
            >
              {description}
            </span>
          ) : null}
        </span>
      </span>
    </motion.button>
  );
}

function Chip({
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
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm transition duration-300 ${
        selected
          ? "border-wine bg-wine text-cream"
          : "border-wine/15 bg-white/70 text-wine/80 hover:border-wine/35"
      }`}
    >
      {label}
    </button>
  );
}

export function WaitlistLandingView({
  labels,
  locale,
  whatsappLinks,
}: WaitlistLandingViewProps) {
  const [step, setStep] = useState<FunnelStep>("intro");
  const [interests, setInterests] = useState<WaitlistInterestId[]>([]);
  const [why, setWhy] = useState<WaitlistWhyId[]>([]);
  const [company, setCompany] = useState<WaitlistCompanyId[]>([]);
  const [tableType, setTableType] = useState<WaitlistTableTypeId[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [regionFlexible, setRegionFlexible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questionIndex = QUESTION_STEPS.indexOf(step);
  const isQuestion = questionIndex >= 0;
  const agendaHref = agendaPath(locale);

  const selectedOutcomes = useMemo(
    () =>
      (interests.length > 0 ? interests : (["wine_tasting"] as WaitlistInterestId[])).map(
        (id) => labels.outcomes[id],
      ),
    [interests, labels.outcomes],
  );

  const primaryOutcome = selectedOutcomes[0] ?? labels.outcomes.wine_tasting;

  const whatsappInvites = useMemo(
    () =>
      whatsappLinks
        ? resolveWhatsappInvitesForInterests(whatsappLinks, interests).map(
            (invite) => ({
              ...invite,
              title: labels.outcomes[invite.id].title,
            }),
          )
        : [],
    [whatsappLinks, interests, labels.outcomes],
  );

  const hasWhatsappInvites = whatsappInvites.length > 0;

  const preferences: WaitlistPreferences = useMemo(
    () => ({
      interests,
      why,
      company,
      tableType,
      cities,
      regionFlexible,
    }),
    [interests, why, company, tableType, cities, regionFlexible],
  );

  function goTo(next: FunnelStep) {
    setStepError(null);
    setError(null);
    setStep(next);
  }

  function validateCurrent(): boolean {
    setStepError(null);
    if (step === "interests" && interests.length === 0) {
      setStepError(labels.steps.interests.required);
      return false;
    }
    if (step === "why" && why.length === 0) {
      setStepError(labels.steps.why.required);
      return false;
    }
    if (step === "company" && company.length === 0) {
      setStepError(labels.steps.company.required);
      return false;
    }
    if (step === "tableType" && tableType.length === 0) {
      setStepError(labels.steps.tableType.required);
      return false;
    }
    if (step === "where" && cities.length === 0) {
      setStepError(labels.steps.where.citiesRequired);
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateCurrent()) return;
    const idx = QUESTION_STEPS.indexOf(step);
    if (idx < 0) return;
    const next = QUESTION_STEPS[idx + 1];
    if (next) goTo(next);
  }

  function goBack() {
    if (step === "interests") {
      goTo("intro");
      return;
    }
    const idx = QUESTION_STEPS.indexOf(step);
    if (idx > 0) goTo(QUESTION_STEPS[idx - 1]!);
  }

  async function handleSubmit() {
    if (!validateCurrent()) return;
    if (!name.trim() || !email.trim()) {
      setStepError(
        locale === "nl"
          ? "Vul je naam en e-mail in"
          : "Please enter your name and email",
      );
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          cities,
          locale,
          source: "newsletter",
          signupSource: "priority_list",
          preferences,
          meta: {
            ...getMetaBrowserCookies(),
            eventSourceUrl: getMetaEventSourceUrl(),
          },
        }),
      });

      if (!res.ok) {
        setError(
          res.status === 503
            ? labels.databaseUnavailable
            : labels.error,
        );
        return;
      }

      const payload = (await res.json()) as { id?: string };
      const citySummary = cities.join(", ");

      trackEmailSignupCompleted({
        email: email.trim(),
        city: citySummary,
        language: locale,
        source_section: "girls_only_presale",
      });

      if (payload.id) {
        trackMetaLead({
          source: "newsletter",
          city: cities[0] ?? citySummary,
          waitlistId: payload.id,
        });
      }

      goTo("result");
    } catch {
      setError(labels.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const progress =
    step === "intro" || step === "result"
      ? step === "result"
        ? 100
        : 0
      : ((questionIndex + 1) / QUESTION_STEPS.length) * 100;

  const primaryCta =
    step === "intro" ? (
      <Button
        type="button"
        onClick={() => goTo("interests")}
        className="!bg-wine !text-cream px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] hover:!bg-[#3a1218]"
      >
        {labels.start}
      </Button>
    ) : step === "contact" ? (
      <Button
        type="button"
        onClick={handleSubmit}
        className={`w-full !bg-wine !text-cream px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] hover:!bg-[#3a1218] sm:w-auto ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
      >
        {isSubmitting
          ? labels.steps.contact.submitting
          : labels.steps.contact.cta}
      </Button>
    ) : step === "result" ? (
      hasWhatsappInvites ? (
        <a
          href={whatsappInvites[0]!.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackWhatsappJoinClicked({
              interest: whatsappInvites[0]!.id,
              locale,
            })
          }
          className="inline-flex w-full items-center justify-center rounded-full !bg-wine px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:!bg-[#3a1218] sm:w-auto"
        >
          {whatsappInvites.length === 1
            ? labels.success.whatsappCta
            : `${labels.success.whatsappCta}: ${whatsappInvites[0]!.title}`}
        </a>
      ) : (
        <Button
          href={agendaHref}
          className="w-full !bg-wine !text-cream px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] hover:!bg-[#3a1218] sm:w-auto"
        >
          {labels.success.agendaLabel}
        </Button>
      )
    ) : (
      <Button
        type="button"
        onClick={goNext}
        className="w-full !bg-wine !text-cream px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] hover:!bg-[#3a1218] sm:w-auto"
      >
        {labels.next}
      </Button>
    );

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f4ece4]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,145,168,0.22),_transparent_55%)]"
      />

      {/* Top progress */}
      <div className="fixed inset-x-0 top-0 z-[55] h-[3px] bg-wine/10">
        <motion.div
          className="h-full bg-wine"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-5 pb-28 pt-24 sm:px-8 sm:pb-16 sm:pt-28">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="font-serif text-2xl font-medium tracking-tight text-wine">
            {labels.brand}
          </p>
          {isQuestion ? (
            <p className="text-[11px] tracking-[0.18em] text-wine/40 uppercase">
              {labels.progressLabel
                .replace("{current}", String(questionIndex + 1))
                .replace("{total}", String(QUESTION_STEPS.length))}
            </p>
          ) : null}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease }}
            className="flex flex-1 flex-col"
          >
            {step === "intro" ? (
              <div className="flex flex-1 flex-col justify-center py-8 text-center sm:py-12">
                <div className="relative mx-auto mb-8 h-48 w-full max-w-sm overflow-hidden rounded-[1.75rem] sm:h-56">
                  <Image
                    src="/girls-only/duo-table.jpg"
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 640px) 90vw, 420px"
                    className="object-cover object-[50%_28%]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[#1a080c]/45 to-transparent"
                  />
                </div>
                <p className="text-[11px] tracking-[0.22em] text-wine/45 uppercase">
                  {labels.intro.eyebrow}
                </p>
                <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-wine text-balance sm:text-5xl">
                  {labels.intro.title}
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-wine/60 sm:text-base">
                  {labels.intro.subtitle}
                </p>
                <p className="mt-5 text-[11px] tracking-[0.18em] text-rose-deep/80 uppercase">
                  {labels.trustLine}
                </p>
                <div className="mt-9 flex justify-center">{primaryCta}</div>
              </div>
            ) : null}

            {step === "interests" ||
            step === "why" ||
            step === "company" ||
            step === "tableType" ||
            step === "where" ||
            step === "contact" ? (
              <div className="flex flex-1 flex-col pt-6 sm:pt-8">
                {step === "contact" ? (
                  <>
                    <p className="text-[11px] tracking-[0.2em] text-wine/40 uppercase">
                      {labels.steps.contact.tease}
                    </p>
                    <h1 className="mt-3 font-serif text-[2rem] font-medium leading-tight tracking-tight text-wine text-balance sm:text-[2.4rem]">
                      {labels.steps.contact.title}
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-wine/60 sm:text-base">
                      {labels.steps.contact.subtitle}
                    </p>
                    <div className="mt-6 overflow-hidden rounded-2xl border border-wine/10 bg-white/60 p-4">
                      <p className="text-[11px] tracking-[0.18em] text-wine/40 uppercase">
                        {labels.steps.contact.tease}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {selectedOutcomes.map((item) => (
                          <li
                            key={item.id}
                            className="font-serif text-xl font-medium text-wine sm:text-2xl"
                          >
                            {item.title}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm leading-relaxed text-wine/55">
                        {labels.steps.contact.choiceHint}
                      </p>
                    </div>
                    <div className="mt-8 space-y-7">
                      <div>
                        <label
                          htmlFor="waitlist-name"
                          className="text-[11px] tracking-[0.18em] text-wine/40 uppercase"
                        >
                          {labels.steps.contact.nameLabel}
                        </label>
                        <input
                          id="waitlist-name"
                          type="text"
                          autoComplete="given-name"
                          required
                          disabled={isSubmitting}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={labels.steps.contact.namePlaceholder}
                          className="mt-2 w-full rounded-2xl border border-wine/12 bg-white/80 px-4 py-3.5 text-base text-wine outline-none transition placeholder:text-wine/30 focus:border-wine/40 focus:ring-2 focus:ring-wine/10"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="waitlist-email"
                          className="text-[11px] tracking-[0.18em] text-wine/40 uppercase"
                        >
                          {labels.steps.contact.emailLabel}
                        </label>
                        <input
                          id="waitlist-email"
                          type="email"
                          autoComplete="email"
                          required
                          disabled={isSubmitting}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={labels.steps.contact.emailPlaceholder}
                          className="mt-2 w-full rounded-2xl border border-wine/12 bg-white/80 px-4 py-3.5 text-base text-wine outline-none transition placeholder:text-wine/30 focus:border-wine/40 focus:ring-2 focus:ring-wine/10"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="font-serif text-[2rem] font-medium leading-tight tracking-tight text-wine text-balance sm:text-[2.4rem]">
                      {step === "interests"
                        ? labels.steps.interests.title
                        : step === "why"
                          ? labels.steps.why.title
                          : step === "company"
                            ? labels.steps.company.title
                            : step === "tableType"
                              ? labels.steps.tableType.title
                              : labels.steps.where.title}
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-wine/60 sm:text-base">
                      {step === "interests"
                        ? labels.steps.interests.subtitle
                        : step === "why"
                          ? labels.steps.why.subtitle
                          : step === "company"
                            ? labels.steps.company.subtitle
                            : step === "tableType"
                              ? labels.steps.tableType.subtitle
                              : labels.steps.where.subtitle}
                    </p>
                    {step === "tableType" ? null : (
                      <p className="mt-2 text-[11px] tracking-[0.16em] text-wine/35 uppercase">
                        {labels.multiHint}
                      </p>
                    )}

                    <div className="mt-8 space-y-3">
                      {step === "interests"
                        ? labels.steps.interests.options.map((option, index) => (
                            <AnswerCard
                              key={option.id}
                              index={index}
                              title={option.title}
                              description={option.description}
                              selected={interests.includes(option.id)}
                              onClick={() =>
                                setInterests((current) =>
                                  toggleValue(current, option.id),
                                )
                              }
                            />
                          ))
                        : null}

                      {step === "why"
                        ? labels.steps.why.options.map((option, index) => (
                            <AnswerCard
                              key={option.id}
                              index={index}
                              title={option.title}
                              selected={why.includes(option.id)}
                              onClick={() =>
                                setWhy((current) =>
                                  toggleValue(current, option.id),
                                )
                              }
                            />
                          ))
                        : null}

                      {step === "company"
                        ? labels.steps.company.options.map((option, index) => (
                            <AnswerCard
                              key={option.id}
                              index={index}
                              title={option.title}
                              selected={company.includes(option.id)}
                              onClick={() =>
                                setCompany((current) =>
                                  toggleValue(current, option.id),
                                )
                              }
                            />
                          ))
                        : null}

                      {step === "tableType" ? (
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {labels.steps.tableType.options.map((option) => (
                            <Chip
                              key={option.id}
                              label={option.title}
                              selected={tableType.includes(option.id)}
                              onClick={() =>
                                setTableType((current) =>
                                  toggleValue(current, option.id),
                                )
                              }
                            />
                          ))}
                        </div>
                      ) : null}

                      {step === "where" ? (
                        <div className="space-y-6">
                          <div>
                            <p className="text-sm text-wine/50">
                              {labels.steps.where.citiesHint}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2.5">
                              {labels.steps.where.cities.map((city) => (
                                <Chip
                                  key={city}
                                  label={city}
                                  selected={cities.includes(city)}
                                  onClick={() =>
                                    setCities((current) =>
                                      toggleValue(current, city),
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-pressed={regionFlexible}
                            onClick={() => setRegionFlexible((v) => !v)}
                            className={`w-full rounded-2xl border px-5 py-5 text-left transition ${
                              regionFlexible
                                ? "border-wine bg-wine text-cream"
                                : "border-wine/12 bg-white/70 hover:border-wine/30"
                            }`}
                          >
                            <span className="block font-serif text-xl font-medium">
                              {labels.steps.where.flexibleLabel}
                            </span>
                            <span
                              className={`mt-2 block text-sm leading-relaxed ${
                                regionFlexible
                                  ? "text-cream/70"
                                  : "text-wine/55"
                              }`}
                            >
                              {labels.steps.where.flexibleHint}
                            </span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </>
                )}

                {stepError || error ? (
                  <p className="mt-5 text-sm text-rose-deep" role="alert">
                    {stepError || error}
                  </p>
                ) : null}

                <div className="mt-10 hidden items-center justify-between gap-4 border-t border-wine/8 pt-8 sm:flex">
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-sm text-wine/45 transition hover:text-wine"
                  >
                    {labels.back}
                  </button>
                  {primaryCta}
                </div>
              </div>
            ) : null}

            {step === "result" ? (
              <div className="flex flex-1 flex-col py-4 sm:py-8">
                <p className="text-[11px] tracking-[0.2em] text-wine/40 uppercase">
                  {labels.success.eyebrow}
                </p>
                <div className="relative mt-5 aspect-[16/10] overflow-hidden rounded-[1.5rem]">
                  <Image
                    src={primaryOutcome.image}
                    alt={primaryOutcome.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, 560px"
                    className="object-cover"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[#1a080c]/55 via-transparent to-transparent"
                  />
                </div>
                <p className="mt-6 text-[11px] tracking-[0.2em] text-rose-deep uppercase">
                  {labels.steps.contact.tease}
                </p>
                <ul className="mt-2 space-y-1">
                  {selectedOutcomes.map((item) => (
                    <li
                      key={item.id}
                      className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl"
                    >
                      {item.title}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm leading-relaxed text-wine/50">
                  {labels.success.waitlistNote}
                </p>
                {hasWhatsappInvites ? (
                  <div className="mt-8 rounded-2xl border border-wine/12 bg-white/70 px-5 py-5">
                    <p className="font-serif text-xl font-medium text-wine">
                      {labels.success.whatsappTitle}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-wine/60">
                      {labels.success.whatsappBody}
                    </p>
                    <div className="mt-5 hidden space-y-2.5 sm:block">
                      {whatsappInvites.map((invite) => (
                        <a
                          key={invite.id}
                          href={invite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            trackWhatsappJoinClicked({
                              interest: invite.id,
                              locale,
                            })
                          }
                          className="flex w-full items-center justify-center rounded-full bg-wine px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-[#3a1218]"
                        >
                          {whatsappInvites.length === 1
                            ? labels.success.whatsappCta
                            : `${labels.success.whatsappCta}: ${invite.title}`}
                        </a>
                      ))}
                      <a
                        href={agendaHref}
                        className="mt-2 block text-center text-sm text-wine/45 transition hover:text-wine"
                      >
                        {labels.success.agendaLabel}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-9 hidden sm:block">{primaryCta}</div>
                )}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile sticky CTA */}
      {step !== "intro" ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-wine/10 bg-[#f4ece4]/95 px-5 pt-3 backdrop-blur-md sm:hidden"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-center gap-3">
            {step !== "result" ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className="shrink-0 px-1 text-sm text-wine/55"
              >
                {labels.back}
              </button>
            ) : null}
            <div className="min-w-0 flex-1">{primaryCta}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
