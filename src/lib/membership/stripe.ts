import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  MEMBERSHIP_PLAN_IDS,
  MEMBERSHIP_PLANS,
  hasInitialTerm,
  isMembershipPlanId,
  type MembershipPlanId,
} from "@/lib/membership/plans";

// Stripe side of the membership. Prices are found by lookup_key and the
// Billing Portal configuration by metadata (scripts/setup-membership-stripe.ts
// creates both), so test and live mode need no price ids in env vars.
//
// Design: Checkout (subscription mode) starts the subscription on the
// plan's first-period price ("€36 every 4 months", "€99 per year", or
// "€12,99 per month" for 1m). For 4m and 12m a subscription schedule is then
// attached: phase 1 is the current, already paid period; phase 2 is the
// monthly price for one month, after which the schedule releases the
// subscription and it simply continues monthly, without an end date.

let priceCache: { at: number; ids: Map<string, string> } | null = null;
const PRICE_CACHE_MS = 10 * 60 * 1000;

/** lookup_key -> price id for every membership price. */
export async function membershipPriceIds(): Promise<Map<string, string>> {
  if (priceCache && Date.now() - priceCache.at < PRICE_CACHE_MS) return priceCache.ids;
  const keys = [...new Set(MEMBERSHIP_PLAN_IDS.flatMap((id) => Object.values(MEMBERSHIP_PLANS[id].lookupKeys)))];
  const list = await getStripe().prices.list({ lookup_keys: keys, active: true, limit: 100 });
  const ids = new Map<string, string>();
  for (const price of list.data) {
    if (price.lookup_key) ids.set(price.lookup_key, price.id);
  }
  const missing = keys.filter((k) => !ids.has(k));
  if (missing.length > 0) {
    throw new Error(`Stripe membership prices missing (${missing.join(", ")}). Run scripts/setup-membership-stripe.ts.`);
  }
  priceCache = { at: Date.now(), ids };
  return ids;
}

export async function planPriceIds(plan: MembershipPlanId): Promise<{ initial: string; monthly: string }> {
  const ids = await membershipPriceIds();
  const keys = MEMBERSHIP_PLANS[plan].lookupKeys;
  return { initial: ids.get(keys.initial)!, monthly: ids.get(keys.monthly)! };
}

let portalConfigCache: string | null = null;

/** The Billing Portal configuration made by the setup script. */
export async function membershipPortalConfigurationId(): Promise<string | undefined> {
  const fromEnv = process.env.STRIPE_MEMBERSHIP_PORTAL_CONFIGURATION?.trim();
  if (fromEnv) return fromEnv;
  if (portalConfigCache) return portalConfigCache;
  for await (const conf of getStripe().billingPortal.configurations.list({ limit: 100, active: true })) {
    if (conf.metadata?.mytable === "membership") {
      portalConfigCache = conf.id;
      return conf.id;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------- reading

export function subscriptionPlan(sub: Stripe.Subscription): MembershipPlanId | null {
  const raw = sub.metadata?.plan;
  return isMembershipPlanId(raw) ? raw : null;
}

/** Current period end (it lives on the item since API 2025-03-31). */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const end = sub.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000) : null;
}

/**
 * Whether the subscription is set to end, and when. The Billing Portal sets
 * `cancel_at` (not `cancel_at_period_end`) when it cancels a subscription
 * that had a schedule, so both count.
 */
export function subscriptionCancellation(sub: Stripe.Subscription): { cancelling: boolean; endsAt: Date | null } {
  if (sub.cancel_at) return { cancelling: true, endsAt: new Date(sub.cancel_at * 1000) };
  if (sub.cancel_at_period_end) return { cancelling: true, endsAt: subscriptionPeriodEnd(sub) };
  return { cancelling: false, endsAt: null };
}

export function subscriptionScheduleId(sub: Stripe.Subscription): string | null {
  if (!sub.schedule) return null;
  return typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
}

export function stripeCustomerId(sub: Stripe.Subscription): string {
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id;
}

// ---------------------------------------------------------------- schedule

/**
 * Makes sure a 4m/12m subscription moves to its monthly price after the
 * first period. Idempotent: does nothing when a schedule is attached, the
 * subscription is not on the first-period price any more, or it is set to
 * end. Also runs after "resume" in the Billing Portal (cancelling there
 * releases the schedule). Returns the schedule id, or null when none is
 * needed.
 */
export async function ensureMembershipSchedule(sub: Stripe.Subscription): Promise<string | null> {
  const plan = subscriptionPlan(sub);
  if (!plan || !hasInitialTerm(plan)) return null;
  const prices = await planPriceIds(plan);
  const stripe = getStripe();
  const existingId = subscriptionScheduleId(sub);

  let schedule: Stripe.SubscriptionSchedule;
  if (existingId) {
    schedule = await stripe.subscriptionSchedules.retrieve(existingId);
    // Already moves on to the monthly price (or not ours to touch).
    if (schedule.status !== "active" && schedule.status !== "not_started") return existingId;
    if (schedule.phases.some((p) => p.items.some((i) => priceId(i.price) === prices.monthly))) return existingId;
  } else {
    if (subscriptionCancellation(sub).cancelling) return null;
    if (sub.status !== "active" && sub.status !== "trialing" && sub.status !== "past_due") return null;
    const item = sub.items.data[0];
    if (!item || item.price.id !== prices.initial) return null;
    try {
      schedule = await stripe.subscriptionSchedules.create({ from_subscription: sub.id });
    } catch (error) {
      // Two webhooks at once: the other one attached it first. A
      // subscription has at most one schedule, so use that one.
      const fresh = await stripe.subscriptions.retrieve(sub.id);
      const attached = subscriptionScheduleId(fresh);
      if (!attached) throw error;
      schedule = await stripe.subscriptionSchedules.retrieve(attached);
    }
  }

  // The phase that is running now: keep it exactly as it is (already paid).
  const now = Math.floor(Date.now() / 1000);
  const current =
    schedule.phases.find((p) => p.start_date <= now && now < p.end_date) ?? schedule.phases[schedule.phases.length - 1];
  if (!current) throw new Error(`Schedule ${schedule.id} has no phase`);
  if (!current.items.some((i) => priceId(i.price) === prices.initial)) return schedule.id;

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: prices.initial, quantity: 1 }],
        start_date: current.start_date,
        end_date: current.end_date,
        metadata: { plan, phase: "initial" },
      },
      {
        items: [{ price: prices.monthly, quantity: 1 }],
        duration: { interval: "month", interval_count: 1 },
        proration_behavior: "none",
        metadata: { plan, phase: "monthly" },
      },
    ],
  });
  return schedule.id;
}

function priceId(price: string | Stripe.Price | Stripe.DeletedPrice): string {
  return typeof price === "string" ? price : price.id;
}
