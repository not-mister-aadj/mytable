import type { ClubPlanId } from "@/db/schema";

export type ClubPlanBilling = "one_time" | "recurring";

export const CLUB_PLAN_PRICING: Record<
  ClubPlanId,
  {
    amountCents: number;
    intervalCount: number;
    /** one_time = prepaid pass (no auto-renew); recurring = Stripe subscription */
    billing: ClubPlanBilling;
    lookupKey: string;
    nameNl: string;
    nameEn: string;
  }
> = {
  "1m": {
    amountCents: 2100,
    intervalCount: 1,
    billing: "one_time",
    // New key so we never reuse the old recurring €21 Stripe Price.
    lookupKey: "mytable_club_1m_once",
    nameNl: "MyTable Club · 1 maand trial",
    nameEn: "MyTable Club · 1 month trial",
  },
  "5m": {
    amountCents: 5000,
    intervalCount: 5,
    billing: "recurring",
    lookupKey: "mytable_club_5m",
    nameNl: "MyTable Club · 5 maanden",
    nameEn: "MyTable Club · 5 months",
  },
  "12m": {
    amountCents: 10000,
    intervalCount: 12,
    billing: "recurring",
    lookupKey: "mytable_club_12m",
    nameNl: "MyTable Club · 12 maanden",
    nameEn: "MyTable Club · 12 months",
  },
};

export function isOneTimeClubPlan(planId: ClubPlanId): boolean {
  return CLUB_PLAN_PRICING[planId].billing === "one_time";
}

/** Access window end for a prepaid (one-time) club plan. */
export function clubPlanPeriodEndFrom(
  planId: ClubPlanId,
  from: Date = new Date(),
): Date {
  const months = CLUB_PLAN_PRICING[planId].intervalCount;
  const end = new Date(from.getTime());
  const day = end.getDate();
  end.setMonth(end.getMonth() + months);
  if (end.getDate() < day) {
    end.setDate(0);
  }
  return end;
}

export function isClubPlanId(value: unknown): value is ClubPlanId {
  return value === "1m" || value === "5m" || value === "12m";
}

/** Plans shown on the paywall / allowed for new checkouts. */
export const CLUB_PLANS_FOR_SALE = [
  "1m",
  "5m",
  "12m",
] as const satisfies readonly ClubPlanId[];

export function isClubPlanIdForSale(
  value: unknown,
): value is (typeof CLUB_PLANS_FOR_SALE)[number] {
  return value === "1m" || value === "5m" || value === "12m";
}

/** Longer plans only — used for end-of-term upgrades. */
export function isClubPlanUpgradeTarget(
  from: ClubPlanId,
  to: ClubPlanId,
): boolean {
  return CLUB_PLAN_PRICING[to].intervalCount > CLUB_PLAN_PRICING[from].intervalCount;
}
