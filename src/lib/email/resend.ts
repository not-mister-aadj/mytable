import { Resend } from "resend";

export const DEFAULT_EMAIL_FROM = "MyTable <info@mytable.club>";

export type EmailSendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
}

export function getEmailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || "info@mytable.club";
}

/** BCC on transaction emails — same copy the customer receives. Empty env disables. */
export function getBookingConfirmationBcc(): string[] {
  if (process.env.EMAIL_BCC === "") return [];
  const address = process.env.EMAIL_BCC?.trim() || "info@mytable.club";
  return [address];
}

/** Alias for Sunday Social / lifecycle sends. */
export function getTransactionalEmailBcc(): string[] {
  return getBookingConfirmationBcc();
}

export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "RESEND_API_KEY is not configured. Set it in your environment variables.",
      );
    }
    return null;
  }
  return withEmailLog(new Resend(key));
}

/** Every send through this client is also written to email_log (see
 * src/lib/email/email-log.ts), so admin can see what each guest received. */
function withEmailLog(client: Resend): Resend {
  const send = client.emails.send.bind(client.emails);
  client.emails.send = (async (payload, options) => {
    const result = await send(payload, options);
    if (!result.error && result.data) {
      const { logSentEmail } = await import("@/lib/email/email-log");
      await logSentEmail({
        to: payload.to,
        from: payload.from,
        subject: payload.subject ?? "",
        html: typeof payload.html === "string" ? payload.html : null,
        resendId: result.data.id,
      });
    }
    return result;
  }) as typeof client.emails.send;
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
