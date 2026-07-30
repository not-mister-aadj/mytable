"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { MemberClubLabels } from "@/i18n/member-club.types";
import { getMetaBrowserCookies, getMetaEventSourceUrl } from "@/lib/analytics/metaCookies";
import { trackMetaClubInitiateCheckout } from "@/lib/analytics/metaTracking";
import { isClubPlanId } from "@/lib/club/plan-pricing";

type PlanId = MemberClubLabels["paywall"]["plans"][number]["id"];

interface MemberClubPaywallProps {
  labels: MemberClubLabels["paywall"];
  locale: Locale;
  city: string;
  /** YYYY-MM-DD in Europe/Amsterdam */
  tableDate: string;
  dateLabel: string;
  timeLabel: string;
  tableType: "girls_only" | "mixed";
  onClose: () => void;
  onJoinedWithoutCheckout?: () => void;
}

const HERO = "/girls-only/table-wine-laughing.jpg";

export function MemberClubPaywall({
  labels,
  locale,
  city,
  tableDate,
  dateLabel,
  timeLabel,
  tableType,
  onClose,
  onJoinedWithoutCheckout,
}: MemberClubPaywallProps) {
  const [planId, setPlanId] = useState<PlanId>("6m");
  const [phase, setPhase] = useState<"plans" | "success">("plans");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected =
    labels.plans.find((p) => p.id === planId) ??
    labels.plans.find((p) => p.id === "6m") ??
    labels.plans[0]!;

  const periodLabel =
    selected.id === "1m"
      ? locale === "en"
        ? "month trial"
        : "maand trial"
      : selected.label;

  const summary = labels.summary
    .replace("{price}", selected.price)
    .replace("{period}", periodLabel.toLowerCase());

  const eventLine = labels.eventLine
    .replace("{city}", city)
    .replace("{date}", dateLabel)
    .replace("{time}", timeLabel);

  const girlsOnly = tableType === "girls_only";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function handleContinue() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/clubmember/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          tableDate,
          tableType,
          planId,
          locale,
          meta: {
            ...getMetaBrowserCookies(),
            eventSourceUrl: getMetaEventSourceUrl(),
          },
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        url?: string;
        alreadyMember?: boolean;
        membershipId?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error ?? labels.errorGeneric);
        setSubmitting(false);
        return;
      }
      if (data?.url) {
        if (data.membershipId && isClubPlanId(planId)) {
          trackMetaClubInitiateCheckout({
            membershipId: data.membershipId,
            planId,
            city,
            locale,
          });
        }
        window.location.href = data.url;
        return;
      }
      if (data?.alreadyMember) {
        setPhase("success");
        setSubmitting(false);
        onJoinedWithoutCheckout?.();
        return;
      }
      setError(labels.errorGeneric);
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-wine/60 sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-paywall-title"
        className={`relative flex max-h-[94svh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] shadow-[0_32px_80px_rgba(43,13,18,0.35)] sm:max-h-[90svh] sm:rounded-[1.75rem] ${
          girlsOnly ? "bg-[#f7e4ea]" : "bg-cream"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-cream/80 text-wine/50 backdrop-blur-sm transition hover:bg-cream hover:text-wine"
          aria-label={labels.closeAria}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {phase === "success" ? (
          <div className="flex flex-1 flex-col justify-center px-6 py-14 text-center sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {labels.eyebrow}
            </p>
            <h2
              id="club-paywall-title"
              className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine"
            >
              {labels.successTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-wine/60">
              {labels.successBody}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-10 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-6 text-xs font-semibold uppercase tracking-[0.14em] text-cream transition hover:bg-[#3a1218]"
            >
              {labels.successCta}
            </button>
          </div>
        ) : (
          <>
            <div className="relative h-40 shrink-0 sm:h-44">
              <Image
                src={HERO}
                alt=""
                fill
                sizes="448px"
                className="object-cover"
                priority
              />
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-b ${
                  girlsOnly
                    ? "from-transparent via-[#f7e4ea]/40 to-[#f7e4ea]"
                    : "from-transparent via-cream/40 to-cream"
                }`}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                {labels.eyebrow}
              </p>
              <h2
                id="club-paywall-title"
                className="mt-2 font-serif text-[1.65rem] font-medium leading-snug tracking-tight text-wine sm:text-3xl"
              >
                {labels.headline}
              </h2>
              <p className="mt-2 text-xs text-wine/45">{eventLine}</p>

              <h3 className="mt-7 text-sm font-semibold text-wine">
                {labels.perksTitle}
              </h3>
              <ul
                className={`mt-3 space-y-0 overflow-hidden rounded-2xl border ${
                  girlsOnly
                    ? "border-[#e8c9d2] bg-white/55"
                    : "border-wine/8 bg-white/80"
                }`}
              >
                {labels.perks.map((perk, i) => (
                  <li
                    key={perk.title}
                    className={`flex gap-3 px-4 py-3.5 ${
                      i > 0
                        ? girlsOnly
                          ? "border-t border-[#e8c9d2]/80"
                          : "border-t border-wine/6"
                        : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-wine"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-wine">
                        {perk.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-snug text-wine/55">
                        {perk.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-xs leading-relaxed text-wine/50">
                {labels.consumptionsNote}
              </p>

              <h3 className="mt-7 text-sm font-semibold text-wine">
                {labels.plansTitle}
              </h3>
              <div className="mt-3 space-y-2.5">
                {labels.plans.map((plan) => {
                  const selectedPlan = plan.id === planId;
                  const isPopular = plan.id === "6m";
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPlanId(plan.id)}
                      aria-pressed={selectedPlan}
                      className={`relative w-full rounded-2xl border bg-white px-4 py-3.5 text-left transition ${
                        selectedPlan
                          ? "border-wine shadow-[0_10px_28px_rgba(43,13,18,0.1)]"
                          : "border-wine/10 hover:border-wine/25"
                      }`}
                    >
                      {isPopular ? (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-wine px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream">
                          {labels.popular}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selectedPlan
                              ? "border-wine bg-wine"
                              : "border-wine/25 bg-transparent"
                          }`}
                        >
                          {selectedPlan ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-cream" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-wine">
                              {plan.label}
                            </span>
                            {plan.compareAt ? (
                              <span className="text-xs text-wine/35 line-through">
                                {plan.compareAt}
                              </span>
                            ) : null}
                            <span className="text-sm font-semibold text-wine">
                              {plan.price}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs text-wine/45">
                            {plan.hint
                              ? plan.hint
                              : labels.perMonth.replace(
                                  "{price}",
                                  plan.perMonth,
                                )}
                          </span>
                        </span>
                        {plan.savePercent ? (
                          <span className="shrink-0 rounded-full bg-[#e8f3e4] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2f5c2a]">
                            {labels.save.replace("{percent}", plan.savePercent)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 pb-2 text-[11px] leading-relaxed text-wine/40">
                {labels.legal}
              </p>
            </div>

            <div
              className={`shrink-0 border-t px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 ${
                girlsOnly
                  ? "border-[#e8c9d2]/80 bg-[#f7e4ea]/95"
                  : "border-wine/8 bg-cream/95"
              } backdrop-blur-sm`}
            >
              <p className="text-center text-sm font-semibold text-wine">
                {summary}
              </p>
              {error ? (
                <p className="mt-2 text-center text-xs text-red-800">{error}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void handleContinue()}
                disabled={submitting}
                className="mt-2.5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-wine px-6 text-xs font-semibold uppercase tracking-[0.14em] text-cream transition hover:bg-[#3a1218] disabled:opacity-60"
              >
                {labels.continue}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
