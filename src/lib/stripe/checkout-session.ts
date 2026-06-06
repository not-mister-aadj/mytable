import type Stripe from "stripe";

/** Card: paid immediately. iDEAL/Bancontact: may be complete while payment still settles. */
export function isCheckoutPaymentSettled(
  session: Stripe.Checkout.Session,
  bookingPaymentStatus?: string | null,
): boolean {
  if (session.payment_status === "paid") return true;
  if (bookingPaymentStatus === "paid") return true;
  return false;
}

export function isCheckoutSessionAwaitingAsyncPayment(
  session: Stripe.Checkout.Session,
): boolean {
  return (
    session.status === "complete" &&
    session.payment_status === "unpaid"
  );
}
