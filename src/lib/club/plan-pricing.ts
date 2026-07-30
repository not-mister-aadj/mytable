import type { ClubPlanId } from "@/db/schema";

export const CLUB_PLAN_PRICING: Record<
  ClubPlanId,
  {
    amountCents: number;
    intervalCount: number;
    lookupKey: string;
    nameNl: string;
    nameEn: string;
  }
> = {
  "1m": {
    amountCents: 2100,
    intervalCount: 1,
    lookupKey: "mytable_club_1m",
    nameNl: "MyTable Club · 1 maand",
    nameEn: "MyTable Club · 1 month",
  },
  "3m": {
    amountCents: 3600,
    intervalCount: 3,
    lookupKey: "mytable_club_3m_v2",
    nameNl: "MyTable Club · 3 maanden",
    nameEn: "MyTable Club · 3 months",
  },
  "6m": {
    amountCents: 6000,
    intervalCount: 6,
    lookupKey: "mytable_club_6m",
    nameNl: "MyTable Club · 6 maanden",
    nameEn: "MyTable Club · 6 months",
  },
};

export function isClubPlanId(value: unknown): value is ClubPlanId {
  return value === "1m" || value === "3m" || value === "6m";
}

/** Plans shown on the paywall / allowed for new checkouts. */
export const CLUB_PLANS_FOR_SALE = ["1m", "6m"] as const satisfies readonly ClubPlanId[];

export function isClubPlanIdForSale(
  value: unknown,
): value is (typeof CLUB_PLANS_FOR_SALE)[number] {
  return value === "1m" || value === "6m";
}
