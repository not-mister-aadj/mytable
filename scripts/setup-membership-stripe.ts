/**
 * Creates (or checks) everything Stripe needs for the Sunday Table
 * membership. Safe to run again: prices are found by lookup_key, the
 * product and the Billing Portal configuration by their metadata, and only
 * what is missing is created.
 *
 * Test mode (uses STRIPE_SECRET_KEY from .env.local):
 *   npx tsx scripts/setup-membership-stripe.ts
 *
 * Live mode (the founder, once, with the live secret key in the shell; the
 * --live flag is required so a live key is never used by accident):
 *   STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/setup-membership-stripe.ts --live
 *
 * A Stripe price's amount can never change. To change a price later, create
 * a new price with the same lookup_key and transfer_lookup_key: true (see
 * the PRICES list below); existing members keep their old price until they
 * are moved, with notice, as the terms say.
 */
import { config } from "dotenv";
import Stripe from "stripe";
import { MEMBERSHIP_PLANS } from "../src/lib/membership/plans";

const live = process.argv.includes("--live");
if (!live) config({ path: ".env.local" });

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set.");
  process.exit(1);
}
if (key.startsWith("sk_live_") !== live) {
  console.error(
    live
      ? "--live was given but STRIPE_SECRET_KEY is not a live key (sk_live_...)."
      : "STRIPE_SECRET_KEY is a live key. Run with --live if you really mean live mode.",
  );
  process.exit(1);
}

const stripe = new Stripe(key);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.mytable.club").replace(/\/$/, "");
const PRODUCT_TAG = "sunday_table_membership";
const PORTAL_TAG = "membership";

type PriceSpec = {
  lookupKey: string;
  nickname: string;
  unitAmount: number;
  interval: "month" | "year";
  intervalCount: number;
};

const p1 = MEMBERSHIP_PLANS["1m"];
const p4 = MEMBERSHIP_PLANS["4m"];
const p12 = MEMBERSHIP_PLANS["12m"];

const PRICES: PriceSpec[] = [
  { lookupKey: p1.lookupKeys.monthly, nickname: "1 maand: per maand", unitAmount: p1.monthlyCents, interval: "month", intervalCount: 1 },
  { lookupKey: p4.lookupKeys.initial, nickname: "4 maanden: eerste 4 maanden", unitAmount: p4.initialCents, interval: "month", intervalCount: 4 },
  { lookupKey: p4.lookupKeys.monthly, nickname: "4 maanden: daarna per maand", unitAmount: p4.monthlyCents, interval: "month", intervalCount: 1 },
  { lookupKey: p12.lookupKeys.initial, nickname: "1 jaar: eerste jaar", unitAmount: p12.initialCents, interval: "year", intervalCount: 1 },
  { lookupKey: p12.lookupKeys.monthly, nickname: "1 jaar: daarna per maand", unitAmount: p12.monthlyCents, interval: "month", intervalCount: 1 },
];

async function ensureProduct(): Promise<Stripe.Product> {
  const found = await stripe.products.search({ query: `metadata['mytable']:'${PRODUCT_TAG}'` }).catch(() => null);
  const existing = found?.data.find((p) => p.active) ?? found?.data[0];
  if (existing) {
    console.log(`Product: ${existing.id} (exists)`);
    return existing;
  }
  // Search can lag a few seconds after creation: fall back to listing.
  for await (const product of stripe.products.list({ limit: 100 })) {
    if (product.metadata?.mytable === PRODUCT_TAG) {
      console.log(`Product: ${product.id} (exists)`);
      return product;
    }
  }
  const product = await stripe.products.create({
    name: "MyTable lidmaatschap",
    description: "Elke Sunday Table in jouw steden. Maandelijks opzegbaar na je eerste periode.",
    metadata: { mytable: PRODUCT_TAG },
  });
  console.log(`Product: ${product.id} (created)`);
  return product;
}

async function ensurePrices(product: Stripe.Product): Promise<Record<string, string>> {
  const existing = await stripe.prices.list({ lookup_keys: PRICES.map((p) => p.lookupKey), limit: 100, active: true });
  const ids: Record<string, string> = {};
  for (const spec of PRICES) {
    const match = existing.data.find((p) => p.lookup_key === spec.lookupKey);
    if (match) {
      const same =
        match.unit_amount === spec.unitAmount &&
        match.currency === "eur" &&
        match.recurring?.interval === spec.interval &&
        match.recurring?.interval_count === spec.intervalCount;
      if (!same) {
        console.warn(
          `  ! ${spec.lookupKey} exists (${match.id}) but differs from the plan (${match.unit_amount} ${match.recurring?.interval}/${match.recurring?.interval_count}). Not changed; see the note at the top.`,
        );
      } else {
        console.log(`  ${spec.lookupKey}: ${match.id} (exists)`);
      }
      ids[spec.lookupKey] = match.id;
      continue;
    }
    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: spec.unitAmount,
      recurring: { interval: spec.interval, interval_count: spec.intervalCount },
      lookup_key: spec.lookupKey,
      nickname: spec.nickname,
      tax_behavior: "inclusive",
      metadata: { mytable: PRODUCT_TAG },
    });
    console.log(`  ${spec.lookupKey}: ${price.id} (created)`);
    ids[spec.lookupKey] = price.id;
  }
  return ids;
}

/** Billing Portal: payment method, invoices, cancel at period end. Plan
 * switching is off (plans have their own first periods). */
async function ensurePortalConfiguration(): Promise<string> {
  const features: Stripe.BillingPortal.ConfigurationCreateParams.Features = {
    payment_method_update: { enabled: true },
    invoice_history: { enabled: true },
    customer_update: { enabled: false },
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end",
      proration_behavior: "none",
      // No required "why are you leaving" step: cancelling stays one
      // simple flow, as Dutch law expects.
      cancellation_reason: { enabled: false, options: [] },
    },
    subscription_update: { enabled: false },
  };
  const businessProfile = {
    headline: "MyTable lidmaatschap",
    privacy_policy_url: `${SITE_URL}/privacy`,
    terms_of_service_url: `${SITE_URL}/algemene-voorwaarden`,
  };
  const returnUrl = `${SITE_URL}/jouw-tafel/instellingen`;

  for await (const conf of stripe.billingPortal.configurations.list({ limit: 100 })) {
    if (conf.metadata?.mytable === PORTAL_TAG) {
      await stripe.billingPortal.configurations.update(conf.id, {
        features,
        business_profile: businessProfile,
        default_return_url: returnUrl,
        active: true,
      });
      console.log(`Billing Portal configuration: ${conf.id} (updated)`);
      return conf.id;
    }
  }
  const conf = await stripe.billingPortal.configurations.create({
    features,
    business_profile: businessProfile,
    default_return_url: returnUrl,
    metadata: { mytable: PORTAL_TAG },
  });
  console.log(`Billing Portal configuration: ${conf.id} (created)`);
  return conf.id;
}

async function main() {
  console.log(`Stripe ${live ? "LIVE" : "test"} mode`);
  const product = await ensureProduct();
  console.log("Prices:");
  await ensurePrices(product);
  await ensurePortalConfiguration();
  console.log("Done. The app finds these by lookup_key and metadata; no ids to copy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
