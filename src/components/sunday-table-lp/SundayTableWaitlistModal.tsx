"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import type {
  WaitlistCompanyId,
  WaitlistInterestId,
  WaitlistTableTypeId,
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
import { SUNDAY_TABLE_LP_CITIES } from "@/data/sunday-table-lp-cities";

const ease = [0.22, 1, 0.36, 1] as const;

type WaitlistLabels = SundayTableLpLabels["waitlist"];
type Phase = "capture" | "questions" | "done";
type QuestionKey = "why" | "company" | "tableType";

const QUESTION_ORDER: QuestionKey[] = ["why", "company", "tableType"];

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

export function SundayTableWaitlistModal({
  labels,
  locale,
  open,
  onOpenChange,
  cityName,
  presetInterest,
}: {
  labels: WaitlistLabels;
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
  const [city, setCity] = useState(cityName ?? "");
  const [otherCity, setOtherCity] = useState("");
  const [showOtherCity, setShowOtherCity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitlistId, setWaitlistId] = useState<string | null>(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [why, setWhy] = useState<WaitlistWhyId[]>([]);
  const [company, setCompany] = useState<WaitlistCompanyId[]>([]);
  const [tableType, setTableType] = useState<WaitlistTableTypeId | null>(null);

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
    setCity(cityName ?? "");
    setOtherCity("");
    setShowOtherCity(false);
    setError(null);
    setWaitlistId(null);
    setQuestionIndex(0);
    setWhy([]);
    setCompany([]);
    setTableType(null);
  }, [open, cityName]);

  const effectiveCity = showOtherCity ? otherCity.trim() : city;

  async function submitCapture() {
    setError(null);
    if (!name.trim() || !email.trim() || !effectiveCity) {
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
          cities: [effectiveCity],
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
      rememberPreferredCity(effectiveCity);
      trackEmailSignupCompleted({
        email: email.trim(),
        city: effectiveCity,
        language: locale,
        source_section: "sunday_table_lp_waitlist",
      });
      setWaitlistId(payload.id ?? null);
      setPhase("questions");
    } catch {
      setError(labels.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEnrichment(skipped: boolean) {
    const answeredCount =
      (why.length > 0 ? 1 : 0) +
      (company.length > 0 ? 1 : 0) +
      (tableType ? 1 : 0);

    if (answeredCount > 0 || presetInterest) {
      try {
        await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            cities: [effectiveCity],
            locale,
            enrich: true,
            preferences: {
              why,
              company,
              tableType: tableType ? [tableType] : [],
              interests: presetInterest ? [presetInterest] : [],
            },
          }),
        });
      } catch {
        // Non-blocking — the person is already on the list either way.
      }
    }

    trackSundayTableWaitlistEnriched({
      city: effectiveCity,
      locale,
      answered_count: answeredCount,
      skipped,
    });
    setPhase("done");
  }

  function advanceQuestion() {
    if (questionIndex < QUESTION_ORDER.length - 1) {
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
    window.setTimeout(() => advanceQuestion(), 180);
  }

  const currentQuestion = QUESTION_ORDER[questionIndex]!;

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
                    {labels.eyebrow}
                  </p>
                  <h2
                    id={titleId}
                    className="mt-2.5 font-serif text-[1.65rem] font-medium leading-[1.15] tracking-tight text-wine text-balance sm:text-[1.85rem]"
                  >
                    {phase === "questions" ? labels.questionsTitle : labels.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wine/12 text-wine/45 transition hover:border-wine/25 hover:text-wine"
                  aria-label={labels.close}
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

                    {!cityName ? (
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy">
                          {labels.cityLabel}
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {SUNDAY_TABLE_LP_CITIES.map((c) => (
                            <button
                              key={c.slug}
                              type="button"
                              onClick={() => {
                                setCity(c.name);
                                setShowOtherCity(false);
                              }}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                !showOtherCity && city === c.name
                                  ? "border-burgundy bg-burgundy text-cream"
                                  : "border-wine/12 bg-white text-wine hover:border-burgundy/40"
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setShowOtherCity(true)}
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
                    {labels.questionsBody}
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-wine/35">
                    {labels.progress
                      .replace("{n}", String(questionIndex + 1))
                      .replace("{total}", String(QUESTION_ORDER.length))}
                  </p>

                  <AnimatePresence mode="wait">
                    {currentQuestion === "why" ? (
                      <motion.div
                        key="why"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3"
                      >
                        <h3 className="font-serif text-lg text-wine">
                          {labels.why.title}
                        </h3>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {labels.why.options.map((option) => (
                            <ChipButton
                              key={option.id}
                              label={option.label}
                              selected={why.includes(option.id)}
                              onClick={() => toggleWhy(option.id)}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={advanceQuestion}
                          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-burgundy px-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream transition hover:bg-wine"
                        >
                          {labels.continueCta}
                        </button>
                      </motion.div>
                    ) : null}

                    {currentQuestion === "company" ? (
                      <motion.div
                        key="company"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3"
                      >
                        <h3 className="font-serif text-lg text-wine">
                          {labels.company.title}
                        </h3>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {labels.company.options.map((option) => (
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
                          {labels.continueCta}
                        </button>
                      </motion.div>
                    ) : null}

                    {currentQuestion === "tableType" ? (
                      <motion.div
                        key="tableType"
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3"
                      >
                        <h3 className="font-serif text-lg text-wine">
                          {labels.tableType.title}
                        </h3>
                        <div className="mt-3 grid gap-2">
                          {labels.tableType.options.map((option) => (
                            <ChipButton
                              key={option.id}
                              label={option.label}
                              selected={tableType === option.id}
                              onClick={() => selectTableType(option.id)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={questionIndex === 0}
                      className="font-semibold uppercase tracking-[0.14em] text-wine/40 transition hover:text-wine disabled:opacity-0"
                    >
                      {labels.back}
                    </button>
                    <button
                      type="button"
                      onClick={() => void submitEnrichment(true)}
                      className="font-semibold uppercase tracking-[0.14em] text-wine/40 transition hover:text-wine"
                    >
                      {labels.skip}
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
                    {labels.successBody}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-wine/45">
                    {labels.successNext}
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
                        {labels.whatsappGirlsLabel}
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
                        {labels.whatsappMixedLabel}
                      </span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-wine/15 px-7 text-xs font-semibold uppercase tracking-[0.16em] text-wine transition hover:border-wine/30"
                  >
                    {labels.close}
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
