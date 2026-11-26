import type Stripe from "stripe";

/** Card: paid immediately. iDEAL/Bancontact: may be complete while payment still settles. */
export function isCheckoutPaymentSettled(
  session: Stripe.Checkout.Session,
  bookingPaymentStatus?: string | null,
): boolean {
  // Paid, then refunded or failed on our side (a Sunday that filled up):
  // not a purchase any more, for fulfilment and for the ad pixels alike.
  if (bookingPaymentStatus === "refunded" || bookingPaymentStatus === "failed") return false;
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
