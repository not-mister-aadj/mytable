import type Stripe from "stripe";
import type { ClubPlanId } from "@/db/schema";
import { getStripe } from "@/lib/stripe";
import {
  CLUB_PLAN_PRICING,
  isClubPlanId,
  isClubPlanIdForSale,
  CLUB_PLANS_FOR_SALE,
} from "@/lib/club/plan-pricing";

export {
  CLUB_PLAN_PRICING,
  isClubPlanId,
  isClubPlanIdForSale,
  CLUB_PLANS_FOR_SALE,
};

/** Resolve Stripe Price for a club plan (create once via lookup_key). */
export async function getOrCreateClubPriceId(
  planId: ClubPlanId,
  locale: "nl" | "en" = "nl",
): Promise<string> {
  const stripe = getStripe();
  const plan = CLUB_PLAN_PRICING[planId];

  const existing = await stripe.prices.list({
    lookup_keys: [plan.lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data[0]?.id) return existing.data[0].id;

  const product = await findOrCreateClubProduct(stripe);
  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: plan.amountCents,
    recurring: {
      interval: "month",
      interval_count: plan.intervalCount,
    },
    lookup_key: plan.lookupKey,
    transfer_lookup_key: true,
    nickname: locale === "en" ? plan.nameEn : plan.nameNl,
    metadata: {
      mytable_plan_id: planId,
    },
  });

  return price.id;
}

async function findOrCreateClubProduct(
  stripe: Stripe,
): Promise<Stripe.Product> {
  const listed = await stripe.products.list({ active: true, limit: 100 });
  const found = listed.data.find(
    (p) => p.metadata?.mytable_product === "club_membership",
  );
  if (found) return found;

  return stripe.products.create({
    name: "MyTable Club",
    description:
      "Sunday Tables + early access + 10% off culinary experiences. Auto-renews until cancelled.",
    metadata: {
      mytable_product: "club_membership",
    },
  });
}
