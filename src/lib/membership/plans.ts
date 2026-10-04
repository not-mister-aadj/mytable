// Membership plans for the Sunday Table: pure, client-safe data. The Stripe
// prices are found by their lookup_key (scripts/setup-membership-stripe.ts
// creates them, in test and in live mode alike), never by a hard-coded id.
//
// Every plan bills a first period upfront and then continues at its monthly
// amount, cancellable per month. "1m" is simply monthly from the start.

export const MEMBERSHIP_PLAN_IDS = ["1m", "4m", "12m"] as const;
export type MembershipPlanId = (typeof MEMBERSHIP_PLAN_IDS)[number];

/** The plan that is selected when the page opens ("Meest gekozen"). */
export const DEFAULT_MEMBERSHIP_PLAN: MembershipPlanId = "4m";

export type MembershipPlan = {
  id: MembershipPlanId;
  /** Charged at the start, for `initialMonths` months. */
  initialCents: number;
  initialMonths: number;
  /** Charged every month after the first period (and the guest price). */
  monthlyCents: number;
  /** Stripe price lookup keys. `initial` equals `monthly` for "1m". */
  lookupKeys: { initial: string; monthly: string };
  /** Shown on the card, null for none. */
  badge: "popular" | "best_value" | null;
};

export const MEMBERSHIP_PLANS: Record<MembershipPlanId, MembershipPlan> = {
  "1m": {
    id: "1m",
    initialCents: 1299,
    initialMonths: 1,
    monthlyCents: 1299,
    lookupKeys: { initial: "mytable_membership_1m_monthly", monthly: "mytable_membership_1m_monthly" },
    badge: null,
  },
  "4m": {
    id: "4m",
    initialCents: 3600,
    initialMonths: 4,
    monthlyCents: 900,
    lookupKeys: { initial: "mytable_membership_4m_initial", monthly: "mytable_membership_4m_monthly" },
    badge: "popular",
  },
  "12m": {
    id: "12m",
    initialCents: 9900,
    initialMonths: 12,
    monthlyCents: 825,
    lookupKeys: { initial: "mytable_membership_12m_initial", monthly: "mytable_membership_12m_monthly" },
    badge: "best_value",
  },
};

export function isMembershipPlanId(value: unknown): value is MembershipPlanId {
  return typeof value === "string" && (MEMBERSHIP_PLAN_IDS as readonly string[]).includes(value);
}

export function getMembershipPlan(id: MembershipPlanId): MembershipPlan {
  return MEMBERSHIP_PLANS[id];
}

/** True for plans with a first period that differs from the monthly price
 * (these need a Stripe subscription schedule and the 7-day reminder). */
export function hasInitialTerm(id: MembershipPlanId): boolean {
  return MEMBERSHIP_PLANS[id].initialMonths > 1;
}

/** What a member's guest pays for a seat: the plan's monthly amount. */
export function guestSeatCents(id: MembershipPlanId): number {
  return MEMBERSHIP_PLANS[id].monthlyCents;
}

/** What a plan's first period saves against buying a single seat every
 * month for as long (one Sunday Table per month): 4 x 15 - 36 = 24. */
export function planSavingsCents(id: MembershipPlanId, singleSeatCents: number): number {
  const plan = MEMBERSHIP_PLANS[id];
  return Math.max(0, singleSeatCents * plan.initialMonths - plan.initialCents);
}

/** The lowest monthly amount of all plans ("vanaf €8,25 per maand"). */
export function lowestMonthlyCents(): number {
  return Math.min(...MEMBERSHIP_PLAN_IDS.map((id) => MEMBERSHIP_PLANS[id].monthlyCents));
}

/** What every later monthly payment is. Also the next payment's amount,
 * whatever the plan: after the first period every plan bills monthly. */
export function nextChargeCents(id: MembershipPlanId): number {
  return MEMBERSHIP_PLANS[id].monthlyCents;
}

/**
 * "4 zondagen los: €60. Met 4 maanden lidmaatschap: €36." Null when there
 * is no single price to compare with, or when the membership would not be
 * cheaper (then the page leaves the example out rather than show a bad deal).
 */
export function savingsExample(singleSeatCents: number | null): { sundays: number; singleTotalCents: number; memberCents: number } | null {
  if (!singleSeatCents || singleSeatCents <= 0) return null;
  const plan = MEMBERSHIP_PLANS["4m"];
  const sundays = 4;
  const singleTotalCents = singleSeatCents * sundays;
  if (singleTotalCents <= plan.initialCents) return null;
  return { sundays, singleTotalCents, memberCents: plan.initialCents };
}

/** "12,99" (nl) / "12.99" (en); whole euros without decimals ("9"). */
export function formatPlanEuros(cents: number, locale: "nl" | "en"): string {
  const value = cents / 100;
  if (Number.isInteger(value)) return String(value);
  const text = value.toFixed(2);
  return locale === "nl" ? text.replace(".", ",") : text;
}
