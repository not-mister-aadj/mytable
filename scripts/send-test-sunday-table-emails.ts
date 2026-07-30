import { config } from "dotenv";
import type { ReactElement } from "react";
import {
  sampleSundayTableCancelProps,
  sampleSundayTableConfirmationProps,
} from "../emails/sample-data";
import { SundayTableCancelEmail } from "../emails/SundayTableCancelEmail";
import { SundayTableConfirmationEmail } from "../emails/SundayTableConfirmationEmail";
import { renderEmailForDelivery } from "../src/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
} from "../src/lib/email/resend";
import {
  sundayTableCancelSubject,
  sundayTableConfirmationSubject,
} from "../src/lib/email/subjects";
import { buildSundayTableIcs } from "../src/lib/sunday-table-calendar";

config({ path: ".env.local" });

const to =
  process.env.TEST_EMAIL_TO?.trim() ||
  process.argv[2]?.trim() ||
  "info@mytable.club";

async function sendOne(input: {
  subject: string;
  element: ReactElement;
  ics?: { filename: string; content: string } | null;
}): Promise<string> {
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
    subject: input.subject,
    html,
    text,
    ...(input.ics
      ? {
          attachments: [
            {
              filename: input.ics.filename,
              content: Buffer.from(input.ics.content, "utf8"),
              contentType: "text/calendar; method=PUBLISH; charset=UTF-8",
            },
          ],
        }
      : {}),
  });
  if (error) throw new Error(error.message);
  return data?.id ?? "unknown";
}

async function main() {
  const ics = buildSundayTableIcs({
    city: "Rotterdam",
    tableDate: "2026-08-02",
    tableType: "girls_only",
    locale: "nl",
  });

  const confirmId = await sendOne({
    subject: sundayTableConfirmationSubject(
      sampleSundayTableConfirmationProps.city,
      sampleSundayTableConfirmationProps.date,
    ),
    element: SundayTableConfirmationEmail(sampleSundayTableConfirmationProps),
    ics: ics
      ? {
          filename: "mytable-sunday-table-2026-08-02.ics",
          content: ics,
        }
      : null,
  });
  console.log("OK: Sunday Table confirmation", { id: confirmId, to });

  const cancelId = await sendOne({
    subject: sundayTableCancelSubject(
      sampleSundayTableCancelProps.city,
      sampleSundayTableCancelProps.date,
    ),
    element: SundayTableCancelEmail(sampleSundayTableCancelProps),
  });
  console.log("OK: Sunday Table cancel", { id: cancelId, to });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
