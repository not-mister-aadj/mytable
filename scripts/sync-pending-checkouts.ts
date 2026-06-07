/**
 * Mark pending bookings paid when Stripe checkout session is already settled.
 * Usage: npx tsx scripts/sync-pending-checkouts.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env.production.local" });

import { and, eq, isNotNull } from "drizzle-orm";
import { bookings } from "../src/db/schema";
import { getDb, isDbConfigured } from "../src/db/index";
import { tryFulfillCheckoutSession } from "../src/lib/stripe/fulfill-checkout";
import { reconcileAllEventSpotsSold } from "../src/lib/reconcile-spots-sold";

async function main() {
  if (!isDbConfigured()) {
    console.error("DATABASE_URL not configured.");
    process.exit(1);
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

  if (pending.length === 0) {
    console.log("No pending bookings with a Stripe session.");
    return;
  }

  for (const row of pending) {
    const sessionId = row.stripeCheckoutSessionId!;
    const result = await tryFulfillCheckoutSession(sessionId);
    console.log(`${row.email} · ${sessionId} → ${result ?? "skipped"}`);
  }

  await reconcileAllEventSpotsSold();
  console.log("Done. spotsSold reconciled.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
