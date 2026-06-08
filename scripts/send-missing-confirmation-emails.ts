/**
 * Send confirmation emails for paid bookings that never received one.
 * Usage: npx tsx scripts/send-missing-confirmation-emails.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env.production.local" });

import { sendMissingBookingConfirmationEmails } from "../src/lib/email/send-missing-confirmation-emails";

async function main() {
  const results = await sendMissingBookingConfirmationEmails();

  if (results.length === 0) {
    console.log("No paid bookings missing a confirmation email.");
    return;
  }

  for (const row of results) {
    console.log(
      `${row.email} · ${row.bookingId} → ${row.ok ? "sent" : row.error ?? "failed"}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
