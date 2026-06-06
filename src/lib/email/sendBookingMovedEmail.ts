import {
  BookingMovedEmail,
  type BookingMovedEmailProps,
} from "@/emails/BookingMovedEmail";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  type EmailSendResult,
} from "@/lib/email/resend";

const SUBJECT = "Je MyTable boeking is verplaatst";

function validateProps(props: BookingMovedEmailProps): void {
  const required: (keyof BookingMovedEmailProps)[] = [
    "customerEmail",
    "oldEventName",
    "oldCity",
    "oldDate",
    "oldTime",
    "newEventName",
    "newCity",
    "newDate",
    "newTime",
    "seats",
    "bookingCode",
    "eventUrl",
  ];

  for (const key of required) {
    const value = props[key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`Booking moved email: missing required field "${key}"`);
    }
  }
}

export async function sendBookingMovedEmail(
  props: BookingMovedEmailProps,
): Promise<EmailSendResult> {
  validateProps(props);

  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing, skip booking moved email");
    return { ok: false, error: "Email not configured" };
  }

  const { html, text, attachments } = await renderEmailForDelivery(
    BookingMovedEmail(props),
  );

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to: props.customerEmail,
    subject: SUBJECT,
    html,
    text,
    attachments,
  });

  if (error) {
    console.error("[email] booking moved failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id ?? "unknown" };
}
