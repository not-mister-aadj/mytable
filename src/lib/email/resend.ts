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

/** BCC on booking confirmations — same copy the customer receives. Empty env disables. */
export function getBookingConfirmationBcc(): string[] {
  if (process.env.EMAIL_BCC === "") return [];
  const address = process.env.EMAIL_BCC?.trim() || "info@mytable.club";
  return [address];
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
  return new Resend(key);
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
