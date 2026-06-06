import { config } from "dotenv";
import { sampleBookingConfirmationProps } from "../emails/sample-data";
import { sendBookingConfirmationEmail } from "../src/lib/email/sendBookingConfirmationEmail";

config({ path: ".env.local" });

const to = process.env.TEST_EMAIL_TO?.trim() || process.argv[2];
if (!to) {
  console.error("Usage: TEST_EMAIL_TO=you@example.com npm run email:test-booking");
  process.exit(1);
}

async function main() {
  const result = await sendBookingConfirmationEmail({
    ...sampleBookingConfirmationProps,
    customerEmail: to,
  });

  if (!result.ok) {
    console.error("Send failed:", result.error);
    process.exit(1);
  }

  console.log("OK: booking confirmation sent", { id: result.id, to });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
