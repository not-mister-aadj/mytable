import { config } from "dotenv";
import { MembershipRenewalReminderEmail } from "../emails/MembershipRenewalReminderEmail";
import { sampleMembershipRenewalReminderProps } from "../emails/sample-data";
import { renderEmailForDelivery } from "../src/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
} from "../src/lib/email/resend";
import { membershipRenewalReminderSubject } from "../src/lib/email/subjects";

config({ path: ".env.local" });

async function sendOne(
  to: string,
  props: typeof sampleMembershipRenewalReminderProps,
) {
  const resend = getResendClient();
  if (!resend) throw new Error("Resend unavailable");
  const { html, text } = await renderEmailForDelivery(
    MembershipRenewalReminderEmail(props),
  );
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to,
    subject: `[Preview] ${membershipRenewalReminderSubject(
      props.renewalDateLabel,
      props.locale,
      props.variant,
    )}`,
    html,
    text,
  });
  if (error) throw new Error(error.message);
  console.log("OK", props.locale, data?.id, "→", to);
}

async function main() {
  const to =
    process.env.TEST_EMAIL_TO?.trim() ||
    process.argv[2]?.trim() ||
    "info@mytable.club";
  if (!isEmailConfigured()) throw new Error("RESEND_API_KEY missing");

  const nl = sampleMembershipRenewalReminderProps;
  const en = {
    ...nl,
    locale: "en" as const,
    renewalDateLabel: "Sunday 6 September 2026",
    nextTableDateLabel: "Sunday 6 September 2026",
    planLabel: "MyTable Club · 1 month trial",
  };

  await sendOne(to, nl);
  await sendOne(to, en);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
