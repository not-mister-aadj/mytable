import { Resend } from "resend";
import type { MailMeta } from "@/lib/email/email-log";
import { addMailUtm } from "@/lib/email/mail-utm";
import { localLinkProblem } from "@/lib/email/local-link-guard";

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

const MAIL_META = Symbol.for("mytable.mailMeta");

/**
 * Marks a mail with what it is, for the log: `resend.emails.send(withMailMeta({...}, { template, variant, vars }))`.
 * Nothing of it goes to Resend or into the mail.
 */
export function withMailMeta<T extends object>(payload: T, meta: MailMeta): T {
  return Object.assign(payload, { [MAIL_META]: meta });
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

/** The site's own host (e.g. a preview deploy), besides mytable.club. */
function siteHost(): string[] {
  try {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    return raw ? [new URL(raw).host.toLowerCase()] : [];
  } catch {
    return [];
  }
}

/** Every send through this client gets UTM tags on links to our site (see
 * src/lib/email/mail-utm.ts) and is written to email_log (see
 * src/lib/email/email-log.ts), so admin can see what each guest received. */
function withEmailLog(client: Resend): Resend {
  const send = client.emails.send.bind(client.emails);
  client.emails.send = (async (original, options) => {
    const blocked = localLinkProblem(original as { to?: unknown; html?: unknown; text?: unknown });
    if (blocked) {
      console.error(`[email] ${blocked} To: ${String(original.to)} Subject: ${original.subject ?? ""}`);
      return { data: null, error: { name: "validation_error", message: blocked, statusCode: 422 }, headers: null } as unknown as Awaited<ReturnType<typeof send>>;
    }
    let payload = original;
    const firstTo = Array.isArray(original.to) ? original.to[0] : original.to;
    if (firstTo && typeof original.html === "string") {
      const tagged = addMailUtm(
        {
          html: original.html,
          text: typeof original.text === "string" ? original.text : null,
          subject: original.subject ?? "",
          to: firstTo,
        },
        siteHost(),
      );
      payload = {
        ...original,
        html: tagged.html ?? original.html,
        ...(typeof original.text === "string" && tagged.text ? { text: tagged.text } : {}),
      } as typeof original;
    }
    const result = await send(payload, options);
    if (!result.error && result.data) {
      const { logSentEmail } = await import("@/lib/email/email-log");
      await logSentEmail({
        to: payload.to,
        from: payload.from,
        subject: payload.subject ?? "",
        html: typeof payload.html === "string" ? payload.html : null,
        text: typeof payload.text === "string" ? payload.text : null,
        meta: (original as { [MAIL_META]?: MailMeta })[MAIL_META] ?? null,
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
