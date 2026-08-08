import type Stripe from "stripe";
import { CLUB_PLAN_PRICING } from "@/lib/club/plan-pricing";

export type TrialPromoPreview = {
  promotionCodeId: string;
  code: string;
  amountOffCents: number;
  percentOff: number | null;
  originalCents: number;
  finalCents: number;
};

function couponAmountOffCents(
  coupon: Stripe.Coupon,
  originalCents: number,
): { amountOffCents: number; percentOff: number | null } {
  if (typeof coupon.amount_off === "number" && coupon.amount_off > 0) {
    return {
      amountOffCents: Math.min(coupon.amount_off, originalCents),
      percentOff: null,
    };
  }
  if (typeof coupon.percent_off === "number" && coupon.percent_off > 0) {
    const amountOffCents = Math.round(
      (originalCents * coupon.percent_off) / 100,
    );
    return {
      amountOffCents: Math.min(amountOffCents, originalCents),
      percentOff: coupon.percent_off,
    };
  }
  return { amountOffCents: 0, percentOff: null };
}

/**
 * Resolve a customer-facing promotion code for Clubmember trial checkout.
 * Returns the Stripe promotion_code id, or null if not found / inactive.
 */
export async function resolveActivePromotionCodeId(
  stripe: Stripe,
  rawCode: string,
): Promise<string | null> {
  const preview = await previewTrialPromotionCode(stripe, rawCode);
  return preview?.promotionCodeId ?? null;
}

/** Validate a promo for the 1m trial and compute the discounted total. */
export async function previewTrialPromotionCode(
  stripe: Stripe,
  rawCode: string,
): Promise<TrialPromoPreview | null> {
  const code = rawCode.trim();
  if (!code || code.length > 64) return null;

  const listed = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });
  const promo = listed.data[0];
  if (!promo) return null;

  const couponRef = promo.promotion?.coupon ?? null;
  if (!couponRef) return null;

  const coupon =
    typeof couponRef === "string"
      ? await stripe.coupons.retrieve(couponRef)
      : couponRef;
  if (!coupon.valid) return null;

  const originalCents = CLUB_PLAN_PRICING["1m"].amountCents;
  const { amountOffCents, percentOff } = couponAmountOffCents(
    coupon,
    originalCents,
  );
  if (amountOffCents <= 0) return null;

  // Prefer Stripe percent_off; for fixed € off, round to nearest 10% for display
  // (e.g. €16 on €21 → 80%, matching the marketing claim).
  const displayPercent =
    percentOff ??
    Math.round((amountOffCents / originalCents) * 10) * 10;

  return {
    promotionCodeId: promo.id,
    code: promo.code,
    amountOffCents,
    percentOff: displayPercent,
    originalCents,
    finalCents: Math.max(0, originalCents - amountOffCents),
  };
}

export function formatEuroCents(cents: number, locale: "nl" | "en"): string {
  const euros = cents / 100;
  if (Number.isInteger(euros)) {
    return locale === "nl" ? `€${euros}` : `€${euros}`;
  }
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(euros);
}
