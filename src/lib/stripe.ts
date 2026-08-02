import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Hosted Checkout (one-time payments): iDEAL first; card + Bancontact secondary. */
const EUR_CHECKOUT_PAYMENT_METHODS = [
  "ideal",
  "card",
  "bancontact",
] as const satisfies readonly Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

/**
 * Subscription Checkout (club): first invoice via iDEAL, renewals via SEPA.
 * Requires SEPA Direct Debit (or “iDEAL recurring”) enabled in the Stripe Dashboard.
 * @see https://docs.stripe.com/billing/subscriptions/ideal
 */
const EUR_SUBSCRIPTION_PAYMENT_METHODS = [
  "ideal",
  "sepa_debit",
  "card",
  "bancontact",
] as const satisfies readonly Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

/** One-time Checkout (experiences). */
export function getCheckoutPaymentMethodTypes(
  currency: string,
): Stripe.Checkout.SessionCreateParams["payment_method_types"] {
  return currency.toUpperCase() === "EUR"
    ? [...EUR_CHECKOUT_PAYMENT_METHODS]
    : ["card"];
}

/** Recurring Checkout (club membership). */
export function getSubscriptionCheckoutPaymentMethodTypes(
  currency: string,
): Stripe.Checkout.SessionCreateParams["payment_method_types"] {
  return currency.toUpperCase() === "EUR"
    ? [...EUR_SUBSCRIPTION_PAYMENT_METHODS]
    : ["card"];
}
