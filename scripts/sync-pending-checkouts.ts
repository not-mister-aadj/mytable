/**
 * Mark pending bookings paid when Stripe checkout session is already settled.
 * Usage: npx tsx scripts/sync-pending-checkouts.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env.production.local" });

import { syncPendingCheckoutsFromStripe } from "../src/lib/stripe/sync-pending-checkouts";

async function main() {
  const results = await syncPendingCheckoutsFromStripe();

  if (results.length === 0) {
    console.log("No pending bookings with a Stripe session.");
    return;
  }

  for (const row of results) {
    console.log(`${row.email} · ${row.sessionId} → ${row.outcome}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
