import type { Locale } from "@/i18n/config";
import {
  CLUB_PLAN_PRICING,
  isClubPlanId,
} from "@/lib/club/plan-pricing";
import { isStripeConfigured, getStripe } from "@/lib/stripe";

/** Serializable club purchase payload for conversion tags on confirmation. */
export type ClubConfirmationPurchaseData = {
  membershipId: string;
  planId: string;
  value: number;
  currency: string;
  contentName: string;
  city: string;
};

export async function getClubConfirmationPurchase(
  sessionId: string,
  locale: Locale,
): Promise<ClubConfirmationPurchaseData | null> {
  if (!isStripeConfigured()) return null;

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("[club confirmation purchase] session retrieve failed", err);
    return null;
  }

  if (session.metadata?.mytable_kind !== "club_membership") return null;

  const membershipId = session.metadata.membership_id?.trim();
  if (!membershipId) return null;

  const sessionReady =
    session.status === "complete" ||
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";

  if (!sessionReady) return null;

  const planId = isClubPlanId(session.metadata.plan_id)
    ? session.metadata.plan_id
    : "12m";
  const plan = CLUB_PLAN_PRICING[planId];
  const amountTotal =
    typeof session.amount_total === "number" ? session.amount_total : null;
  const value =
    amountTotal != null && amountTotal >= 0
      ? amountTotal / 100
      : plan.amountCents / 100;

  return {
    membershipId,
    planId,
    value,
    currency: (session.currency ?? "eur").toUpperCase(),
    contentName: locale === "en" ? plan.nameEn : plan.nameNl,
    city: session.metadata.city?.trim() || "unknown",
  };
}
