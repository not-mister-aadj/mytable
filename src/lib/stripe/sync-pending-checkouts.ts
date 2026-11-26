import { and, desc, eq, gt, isNotNull } from "drizzle-orm";
import { bookings } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { reconcileAllEventSpotsSold } from "@/lib/reconcile-spots-sold";
import { isStripeConfigured } from "@/lib/stripe";
import {
  tryFulfillCheckoutSessionSafe,
  type FulfillCheckoutResult,
} from "@/lib/stripe/fulfill-checkout";
import { sendMissingBookingConfirmationEmails } from "@/lib/email/send-missing-confirmation-emails";

export type PendingCheckoutSyncResult = {
  bookingId: string;
  email: string;
  sessionId: string;
  outcome: FulfillCheckoutResult | "skipped" | null;
};

const SYNC_COOLDOWN_MS = 2 * 60 * 1000;
const EMAIL_CATCHUP_COOLDOWN_MS = 10 * 60 * 1000;
const MAX_PENDING_PER_RUN = 8;

let lastSyncFinishedAt = 0;
let lastEmailCatchUpAt = 0;
let inFlightSync: Promise<PendingCheckoutSyncResult[]> | null = null;

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
        // Checkout closes after 31 minutes; a bank payment settles within a
        // day or two. Older pending rows were simply never paid.
        gt(bookings.createdAt, new Date(Date.now() - 3 * 24 * 3600 * 1000)),
      ),
    )
    .orderBy(desc(bookings.createdAt))
    .limit(MAX_PENDING_PER_RUN);

  const results: PendingCheckoutSyncResult[] = [];

  for (const row of pending) {
    const sessionId = row.stripeCheckoutSessionId!;
    // One row that fails (or a full Sunday) does not stop the others.
    const outcome = await tryFulfillCheckoutSessionSafe(sessionId);
    results.push({
      bookingId: row.id,
      email: row.email,
      sessionId,
      outcome: outcome ?? "skipped",
    });
  }

  const fulfilled = results.some((r) => r.outcome === "fulfilled");
  if (fulfilled) {
    await reconcileAllEventSpotsSold();
  }

  const now = Date.now();
  if (fulfilled || now - lastEmailCatchUpAt >= EMAIL_CATCHUP_COOLDOWN_MS) {
    lastEmailCatchUpAt = now;
    await sendMissingBookingConfirmationEmails();
  }

  return results;
}

/** Throttled Stripe sync for admin pages — avoids blocking every navigation. */
export async function syncPendingCheckoutsIfStale(): Promise<void> {
  const now = Date.now();
  if (now - lastSyncFinishedAt < SYNC_COOLDOWN_MS) return;

  if (inFlightSync) {
    await inFlightSync.catch(() => {});
    return;
  }

  inFlightSync = syncPendingCheckoutsFromStripe()
    .catch((error) => {
      console.error("[stripe sync] failed", error);
      return [];
    })
    .finally(() => {
      lastSyncFinishedAt = Date.now();
      inFlightSync = null;
    });

  await inFlightSync;
}
