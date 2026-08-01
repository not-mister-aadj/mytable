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
  pendingPlanId: string | null;
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
) {
  if (!planId) return "-";
  return plans.find((p) => p.id === planId)?.label ?? planId;
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
  const canUpgrade =
    membership.active &&
    membership.planId !== "12m" &&
    membership.pendingPlanId !== "12m" &&
    !membership.cancelAtPeriodEnd;

  async function openBillingPortal() {
    setBillingBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/clubmember/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, intent: "manage" }),
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

  async function scheduleUpgrade() {
    if (!canUpgrade || planBusy) return;
    setPlanBusy(true);
    setError(null);
    setFlash(null);
    try {
      const res = await fetch("/api/clubmember/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "12m", locale }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        currentPeriodEnd?: string | null;
      } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? labels.paywall.errorGeneric);
        return;
      }
      const when =
        formatPeriodDate(
          data.currentPeriodEnd ?? membership.currentPeriodEnd,
          locale,
        ) ?? "";
      setFlash(labels.membership.upgradeScheduled.replace("{date}", when));
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
              planDisplay(membership.planId, labels.paywall.plans),
            )}
          </span>
          {periodLabel ? (
            <span className="text-wine/45">
              {membership.cancelAtPeriodEnd
                ? labels.membership.cancelScheduled.replace(
                    "{date}",
                    periodLabel,
                  )
                : membership.pendingPlanId === "12m"
                  ? labels.membership.upgradePending.replace(
                      "{date}",
                      periodLabel,
                    )
                  : labels.membership.renews.replace("{date}", periodLabel)}
            </span>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
            {canUpgrade ? (
              <button
                type="button"
                onClick={() => void scheduleUpgrade()}
                disabled={planBusy}
                className="text-xs font-semibold uppercase tracking-[0.12em] text-burgundy underline-offset-2 hover:underline disabled:opacity-60"
              >
                {planBusy
                  ? labels.membership.changePlanBusy
                  : labels.membership.upgradeTo12m}
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
