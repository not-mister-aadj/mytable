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

/** Hosted Checkout: iDEAL first; card + Bancontact as secondary options (Stripe UI). */
const EUR_CHECKOUT_PAYMENT_METHODS = [
  "ideal",
  "card",
  "bancontact",
] as const satisfies readonly Stripe.Checkout.SessionCreateParams.PaymentMethodType[];

export function getCheckoutPaymentMethodTypes(
  currency: string,
): Stripe.Checkout.SessionCreateParams["payment_method_types"] {
  return currency.toUpperCase() === "EUR"
    ? [...EUR_CHECKOUT_PAYMENT_METHODS]
    : ["card"];
}
