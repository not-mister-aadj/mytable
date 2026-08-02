import { config } from "dotenv";
import type { ReactElement } from "react";
import { BookingConfirmationEmail } from "../emails/BookingConfirmationEmail";
import { BookingMovedEmail } from "../emails/BookingMovedEmail";
import { MembershipRenewalReminderEmail } from "../emails/MembershipRenewalReminderEmail";
import { SundayTableCancelEmail } from "../emails/SundayTableCancelEmail";
import { SundayTableConfirmationEmail } from "../emails/SundayTableConfirmationEmail";
import { SundayTableCulinaryEmail } from "../emails/SundayTableCulinaryEmail";
import { SundayTableInviteEmail } from "../emails/SundayTableInviteEmail";
import { SundayTableLocationEmail } from "../emails/SundayTableLocationEmail";
import { SundayTablePlusOneEmail } from "../emails/SundayTablePlusOneEmail";
import { SundayTableReviewEmail } from "../emails/SundayTableReviewEmail";
import {
  sampleBookingConfirmationProps,
  sampleBookingMovedProps,
  sampleMembershipRenewalReminderProps,
  sampleSundayTableCancelProps,
  sampleSundayTableConfirmationProps,
  sampleSundayTableLocationProps,
  sampleSundayTablePlusOneAddedProps,
  sampleSundayTablePlusOneRemovedProps,
  sampleSundayTableReviewProps,
} from "../emails/sample-data";
import { renderEmailForDelivery } from "../src/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
} from "../src/lib/email/resend";
import {
  bookingConfirmationSubject,
  bookingMovedSubject,
  membershipRenewalReminderSubject,
  sundayTableCancelSubject,
  sundayTableConfirmationSubject,
  sundayTableLocationSubject,
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
  console.log("Sending all preview emails to", to);

  const renewalSample = sampleMembershipRenewalReminderProps;
  const renewalRegular = {
    ...renewalSample,
    variant: "renewal" as const,
    planLabel: "MyTable Club · 5 maanden",
    amountLabel: "€ 50,00",
  };

  const jobs: Array<{
    label: string;
    subject: string;
    element: ReactElement;
  }> = [
    {
      label: "booking-confirmation",
      subject: bookingConfirmationSubject(
        sampleBookingConfirmationProps.bookingCode,
        sampleBookingConfirmationProps.eventName,
      ),
      element: BookingConfirmationEmail(sampleBookingConfirmationProps),
    },
    {
      label: "booking-moved",
      subject: bookingMovedSubject(
        sampleBookingMovedProps.bookingCode,
        sampleBookingMovedProps.newEventName,
      ),
      element: BookingMovedEmail(sampleBookingMovedProps),
    },
    {
      label: "sunday-table-confirmation",
      subject: sundayTableConfirmationSubject(
        sampleSundayTableConfirmationProps.city,
        sampleSundayTableConfirmationProps.date,
      ),
      element: SundayTableConfirmationEmail(sampleSundayTableConfirmationProps),
    },
    {
      label: "sunday-table-cancel",
      subject: sundayTableCancelSubject(
        sampleSundayTableCancelProps.city,
        sampleSundayTableCancelProps.date,
      ),
      element: SundayTableCancelEmail(sampleSundayTableCancelProps),
    },
    {
      label: "sunday-table-plus-one-added",
      subject: sundayTablePlusOneAddedSubject(
        sampleSundayTablePlusOneAddedProps.city,
        sampleSundayTablePlusOneAddedProps.date,
      ),
      element: SundayTablePlusOneEmail(sampleSundayTablePlusOneAddedProps),
    },
    {
      label: "sunday-table-plus-one-removed",
      subject: sundayTablePlusOneRemovedSubject(
        sampleSundayTablePlusOneRemovedProps.city,
        sampleSundayTablePlusOneRemovedProps.date,
      ),
      element: SundayTablePlusOneEmail(sampleSundayTablePlusOneRemovedProps),
    },
    {
      label: "sunday-table-location",
      subject: sundayTableLocationSubject(
        sampleSundayTableLocationProps.city,
        sampleSundayTableLocationProps.date,
      ),
      element: SundayTableLocationEmail(sampleSundayTableLocationProps),
    },
    {
      label: "sunday-table-review",
      subject: `Hoe was Sunday Table in ${sampleSundayTableReviewProps.city}?`,
      element: SundayTableReviewEmail(sampleSundayTableReviewProps),
    },
    {
      label: "sunday-table-invite",
      subject: "Nodig iemand uit voor Sunday Table",
      element: SundayTableInviteEmail({
        locale: "nl",
        firstName: "Sophie",
        city: "Rotterdam",
        shareUrl: "https://www.mytable.club/r/demo",
        whatsappUrl:
          "https://wa.me/?text=Kom%20mee%20naar%20MyTable%20Sunday%20Table",
      }),
    },
    {
      label: "sunday-table-culinary",
      subject: "Plan iets culinairs met je nieuwe groep",
      element: SundayTableCulinaryEmail({
        locale: "nl",
        firstName: "Sophie",
        city: "Rotterdam",
        agendaUrl: "https://www.mytable.club/agenda",
      }),
    },
    {
      label: "membership-trial-upsell",
      subject: membershipRenewalReminderSubject(
        renewalSample.renewalDateLabel,
        renewalSample.locale,
        "trial_upsell",
      ),
      element: MembershipRenewalReminderEmail(renewalSample),
    },
    {
      label: "membership-renewal",
      subject: membershipRenewalReminderSubject(
        renewalRegular.renewalDateLabel,
        renewalRegular.locale,
        "renewal",
      ),
      element: MembershipRenewalReminderEmail(renewalRegular),
    },
  ];

  for (const job of jobs) {
    await sendOne(job);
  }

  console.log(`Done. Sent ${jobs.length} emails to ${to}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
