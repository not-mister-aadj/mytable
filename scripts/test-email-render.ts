import { config } from "dotenv";
import { render } from "@react-email/render";
import { BookingConfirmationEmail } from "../emails/BookingConfirmationEmail";
import { sampleBookingConfirmationProps } from "../emails/sample-data";

config({ path: ".env.local" });

async function main() {
  const html = await render(
    BookingConfirmationEmail(sampleBookingConfirmationProps),
  );
  console.log("OK: email rendered", html.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
