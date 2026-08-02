import { config } from "dotenv";
import type { ReactElement } from "react";
import { SundayTablePlusOneEmail } from "../emails/SundayTablePlusOneEmail";
import {
  sampleSundayTablePlusOneAddedProps,
  sampleSundayTablePlusOneRemovedProps,
} from "../emails/sample-data";
import { renderEmailForDelivery } from "../src/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
} from "../src/lib/email/resend";
import {
  sundayTablePlusOneAddedSubject,
  sundayTablePlusOneRemovedSubject,
} from "../src/lib/email/subjects";

config({ path: ".env.local" });

const to =
  process.env.TEST_EMAIL_TO?.trim() ||
  process.argv[2]?.trim() ||
  "info@mytable.club";

async function sendOne(input: {
  label: string;
  subject: string;
  element: ReactElement;
}): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("RESEND_API_KEY missing in .env.local");
  }
  const resend = getResendClient();
  if (!resend) throw new Error("Resend client unavailable");

  const { html, text } = await renderEmailForDelivery(input.element);
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to,
    subject: `[Preview] ${input.subject}`,
    html,
    text,
  });
  if (error) throw new Error(`${input.label}: ${error.message}`);
  console.log("OK", input.label, data?.id ?? "unknown");
}

async function main() {
  await sendOne({
    label: "plus-one-added",
    subject: sundayTablePlusOneAddedSubject(
      sampleSundayTablePlusOneAddedProps.city,
      sampleSundayTablePlusOneAddedProps.date,
    ),
    element: SundayTablePlusOneEmail(sampleSundayTablePlusOneAddedProps),
  });
  await sendOne({
    label: "plus-one-removed",
    subject: sundayTablePlusOneRemovedSubject(
      sampleSundayTablePlusOneRemovedProps.city,
      sampleSundayTablePlusOneRemovedProps.date,
    ),
    element: SundayTablePlusOneEmail(sampleSundayTablePlusOneRemovedProps),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
