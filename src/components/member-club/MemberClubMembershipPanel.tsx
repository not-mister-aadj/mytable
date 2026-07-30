"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { MemberClubLabels } from "@/i18n/member-club.types";

export type MembershipSummary = {
  active: boolean;
  planId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canManageBilling: boolean;
};

function formatPeriodDate(iso: string | null, locale: Locale) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function planDisplay(
  planId: string | null,
  plans: MemberClubLabels["paywall"]["plans"],
  locale: Locale,
) {
  if (!planId) return "-";
  const fromPaywall = plans.find((p) => p.id === planId)?.label;
  if (fromPaywall) return fromPaywall;
  if (planId === "3m") return locale === "en" ? "3 months" : "3 maanden";
  return planId;
}

/** Compact membership strip (billing only — RSVP lives on Sunday Table cards). */
export function MemberClubMembershipPanel({
  labels,
  locale,
  membership,
  checkoutFlash,
}: {
  labels: MemberClubLabels;
  locale: Locale;
  membership: MembershipSummary;
  checkoutFlash: "success" | "cancel" | null;
}) {
  const router = useRouter();
  const [billingBusy, setBillingBusy] = useState(false);
  const [planBusy, setPlanBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const periodLabel = formatPeriodDate(membership.currentPeriodEnd, locale);
  const canSwitchPlan =
    membership.planId === "1m" || membership.planId === "6m";
  const switchTarget = membership.planId === "1m" ? "6m" : "1m";
  const switchLabel =
    switchTarget === "6m"
      ? labels.membership.upgradeTo6m
      : labels.membership.switchToTrial;

  async function openBillingPortal() {
    setBillingBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/clubmember/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, intent: "update_plan" }),
      });
      const data = (await res.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!res.ok || !data?.url) {
        setError(data?.error ?? labels.paywall.errorGeneric);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(labels.paywall.errorGeneric);
    } finally {
      setBillingBusy(false);
    }
  }

  async function changePlan() {
    if (!canSwitchPlan || planBusy) return;
    setPlanBusy(true);
    setError(null);
    setFlash(null);
    try {
      const res = await fetch("/api/clubmember/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: switchTarget, locale }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? labels.paywall.errorGeneric);
        return;
      }
      setFlash(labels.membership.changePlanSuccess);
      router.refresh();
    } catch {
      setError(labels.paywall.errorGeneric);
    } finally {
      setPlanBusy(false);
    }
  }

  if (!membership.active && !checkoutFlash) return null;

  return (
    <section className="-mt-6 relative z-10 sm:-mt-8">
      {checkoutFlash === "success" ? (
        <p className="mb-3 rounded-2xl bg-[#e8f3e4] px-4 py-3 text-sm text-[#2f5c2a] shadow-[0_8px_24px_rgba(43,13,18,0.06)]">
          {labels.membership.checkoutSuccess}
        </p>
      ) : null}
      {checkoutFlash === "cancel" ? (
        <p className="mb-3 rounded-2xl bg-white/90 px-4 py-3 text-sm text-wine/70 shadow-[0_8px_24px_rgba(43,13,18,0.06)]">
          {labels.membership.checkoutCancel}
        </p>
      ) : null}
      {flash ? (
        <p className="mb-3 rounded-2xl bg-[#e8f3e4] px-4 py-3 text-sm text-[#2f5c2a] shadow-[0_8px_24px_rgba(43,13,18,0.06)]">
          {flash}
        </p>
      ) : null}

      {membership.active ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-wine/8 bg-white/95 px-5 py-4 text-sm text-wine/65 shadow-[0_16px_40px_rgba(43,13,18,0.08)] backdrop-blur-sm">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
            {labels.membership.eyebrow}
          </span>
          <span className="font-medium text-wine">
            {labels.membership.planLabel.replace(
              "{plan}",
              planDisplay(membership.planId, labels.paywall.plans, locale),
            )}
          </span>
          {periodLabel ? (
            <span className="text-wine/45">
              {membership.cancelAtPeriodEnd
                ? labels.membership.cancelScheduled.replace(
                    "{date}",
                    periodLabel,
                  )
                : labels.membership.renews.replace("{date}", periodLabel)}
            </span>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
            {canSwitchPlan ? (
              <button
                type="button"
                onClick={() => void changePlan()}
                disabled={planBusy}
                className="text-xs font-semibold uppercase tracking-[0.12em] text-burgundy underline-offset-2 hover:underline disabled:opacity-60"
              >
                {planBusy ? labels.membership.changePlanBusy : switchLabel}
              </button>
            ) : null}
            {membership.canManageBilling ? (
              <button
                type="button"
                onClick={() => void openBillingPortal()}
                disabled={billingBusy}
                className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/55 underline-offset-2 hover:underline disabled:opacity-60"
              >
                {labels.membership.manageBilling}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
    </section>
  );
}
