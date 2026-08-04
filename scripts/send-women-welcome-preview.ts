import { config } from "dotenv";
import { WomenWelcomeEmail } from "../emails/WomenWelcomeEmail";
import { renderEmailForDelivery } from "../src/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
} from "../src/lib/email/resend";
import { womenWelcomeSubject } from "../src/lib/email/subjects";
import { GIRLS_WHATSAPP_GROUP_URL } from "../src/lib/member-onboarding";

config({ path: ".env.local" });

const to =
  process.env.TEST_EMAIL_TO?.trim() ||
  process.argv[2]?.trim() ||
  "info@mytable.club";

async function sendOne(locale: "nl" | "en") {
  if (!isEmailConfigured()) {
    throw new Error("RESEND_API_KEY missing in .env.local");
  }
  const resend = getResendClient();
  if (!resend) throw new Error("Resend client unavailable");

  const sundayTableUrl =
    locale === "en"
      ? "https://www.mytable.club/en/sunday-table"
      : "https://www.mytable.club/sunday-table";

  const { html, text } = await renderEmailForDelivery(
    WomenWelcomeEmail({
      locale,
      firstName: "Sophie",
      whatsappUrl: GIRLS_WHATSAPP_GROUP_URL,
      sundayTableUrl,
    }),
  );

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to,
    subject: `[Preview ${locale.toUpperCase()}] ${womenWelcomeSubject(locale)}`,
    html,
    text,
  });
  if (error) throw new Error(`${locale}: ${error.message}`);
  console.log("OK", locale, data?.id ?? "unknown");
}

async function main() {
  console.log("Sending women welcome preview emails to", to);
  await sendOne("nl");
  await sendOne("en");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
