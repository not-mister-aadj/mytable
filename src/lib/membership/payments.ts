import type Stripe from "stripe";
import { getDb } from "@/db/index";
import { membershipPayments } from "@/db/schema";
import { getMembershipBySubscription } from "@/lib/membership/data";
import { invoiceSubscriptionId } from "@/lib/membership/fulfill";

const seconds = (value: number | null | undefined) => (value ? new Date(value * 1000) : null);

/**
 * Stores a paid membership invoice for the revenue numbers. Idempotent (one
 * row per invoice). Skips invoices of other subscriptions and €0 invoices.
 */
export async function recordMembershipPayment(invoice: Stripe.Invoice): Promise<boolean> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId || !invoice.id || invoice.amount_paid <= 0) return false;

  // invoice.paid can arrive before checkout.session.completed creates the
  // row, so the subscription's metadata decides as well.
  const kind = invoice.parent?.subscription_details?.metadata?.kind;
  if (kind !== "membership" && !(await getMembershipBySubscription(subscriptionId))) return false;

  const line = invoice.lines?.data?.[0];
  await getDb()
    .insert(membershipPayments)
    .values({
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      email: invoice.customer_email ?? null,
      amountCents: invoice.amount_paid,
      currency: invoice.currency ?? "eur",
      paidAt: seconds(invoice.status_transitions?.paid_at) ?? seconds(invoice.created) ?? new Date(),
      periodStart: seconds(line?.period?.start),
      periodEnd: seconds(line?.period?.end),
    })
    .onConflictDoNothing();
  return true;
}
