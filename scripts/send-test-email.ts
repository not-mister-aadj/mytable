import { config } from "dotenv";
import { Resend } from "resend";

config({ path: ".env.local" });

const apiKey = process.env.RESEND_API_KEY?.trim();
if (!apiKey) {
  console.error(
    "RESEND_API_KEY missing. Add it to .env.local (replace re_xxxxxxxxx with your real key from resend.com).",
  );
  process.exit(1);
}

const to = process.env.TEST_EMAIL_TO?.trim() || "siraaadj@gmail.com";
const from =
  process.env.TEST_EMAIL_FROM?.trim() ||
  process.env.EMAIL_FROM?.trim() ||
  "MyTable <info@mytable.club>";

const resend = new Resend(apiKey);

async function main() {
  const { data, error } = await resend.emails.send({
    from,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || "info@mytable.club",
    to,
    subject: "MyTable — testmail",
    html: "<p>Dit is een testmail van <strong>MyTable</strong> via Resend.</p><p>Als je dit ziet, werkt verzenden vanaf info@mytable.club.</p>",
    text: "Dit is een testmail van MyTable via Resend. Als je dit ziet, werkt verzenden vanaf info@mytable.club.",
  });

  if (error) {
    console.error("Send failed:", error.message);
    process.exit(1);
  }

  console.log("OK: email sent", { id: data?.id, from, to });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
