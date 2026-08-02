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

/** One-time Checkout only. Subscriptions must omit `payment_method_types`
 *  (iDEAL + subscription requires SEPA Debit in the Stripe Dashboard). */
export function getCheckoutPaymentMethodTypes(
  currency: string,
): Stripe.Checkout.SessionCreateParams["payment_method_types"] {
  return currency.toUpperCase() === "EUR"
    ? [...EUR_CHECKOUT_PAYMENT_METHODS]
    : ["card"];
}
