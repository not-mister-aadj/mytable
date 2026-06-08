import { and, eq, isNotNull } from "drizzle-orm";
import { bookings } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { reconcileAllEventSpotsSold } from "@/lib/reconcile-spots-sold";
import { isStripeConfigured } from "@/lib/stripe";
import {
  tryFulfillCheckoutSession,
  type FulfillCheckoutResult,
} from "@/lib/stripe/fulfill-checkout";
import { sendMissingBookingConfirmationEmails } from "@/lib/email/send-missing-confirmation-emails";

export type PendingCheckoutSyncResult = {
  bookingId: string;
  email: string;
  sessionId: string;
  outcome: FulfillCheckoutResult | "skipped" | null;
};

/** Pull payment status from Stripe for pending bookings and fulfill when paid. */
export async function syncPendingCheckoutsFromStripe(): Promise<PendingCheckoutSyncResult[]> {
  if (!isDbConfigured() || !isStripeConfigured()) {
    return [];
  }

  const db = getDb();
  const pending = await db
    .select({
      id: bookings.id,
      email: bookings.email,
      stripeCheckoutSessionId: bookings.stripeCheckoutSessionId,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.paymentStatus, "pending"),
        isNotNull(bookings.stripeCheckoutSessionId),
      ),
    );

  const results: PendingCheckoutSyncResult[] = [];

  for (const row of pending) {
    const sessionId = row.stripeCheckoutSessionId!;
    const outcome = await tryFulfillCheckoutSession(sessionId);
    results.push({
      bookingId: row.id,
      email: row.email,
      sessionId,
      outcome: outcome ?? "skipped",
    });
  }

  if (results.some((r) => r.outcome === "fulfilled")) {
    await reconcileAllEventSpotsSold();
  }

  await sendMissingBookingConfirmationEmails();

  return results;
}
