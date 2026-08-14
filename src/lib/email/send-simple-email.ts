import type { ReactElement } from "react";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  getTransactionalEmailBcc,
  isEmailConfigured,
} from "@/lib/email/resend";

/** Render + send a one-off transactional email via Resend, with BCC minus the recipient. */
export async function sendSimpleEmail(input: {
  to: string;
  subject: string;
  element: ReactElement;
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const resend = getResendClient();
  if (!resend) return false;
  const { html, text } = await renderEmailForDelivery(input.element);
  const bcc = getTransactionalEmailBcc().filter(
    (address) => address.toLowerCase() !== input.to.toLowerCase(),
  );
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to: input.to,
    bcc: bcc.length > 0 ? bcc : undefined,
    subject: input.subject,
    html,
    text,
  });
  return !error;
}
