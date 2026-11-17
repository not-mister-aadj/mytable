import { desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { customers, emailLog } from "@/db/schema";
import { customerDisplayName, normalizeEmail } from "@/lib/customers/normalize";
import { emailKind } from "@/lib/email/email-kind";
import { catalogMail } from "@/lib/email/mail-catalog";

export type EmailLogSource = "app" | "script" | "resend_import";

function recipients(to: string | string[] | undefined): string[] {
  if (!to) return [];
  return (Array.isArray(to) ? to : [to]).map((address) => address.trim()).filter(Boolean);
}

/** Logs one sent email per recipient (not the BCC copy). Never throws: a
 * failing log must not turn a sent email into an error. */
/** What a send says about itself, next to the mail: see withMailMeta. */
export type MailMeta = {
  /** The catalog kind; read from the subject when left out. */
  template?: string;
  /** Set when more than one version of a mail runs at the same time. */
  variant?: string;
  /** The values filled in for this guest. */
  vars?: Record<string, string | number | boolean | null>;
};

const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A mail sent as plain text, as HTML to look at: the text as it is, links clickable. */
export function textAsHtml(text: string): string {
  const body = escapeHtml(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#5a0f1b">$1</a>');
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px;padding:24px;white-space:pre-wrap">${body}</div>`;
}

/** The mail a row is: what the send said, else what its subject says. */
export function templateOf(row: { template: string | null; subject: string }): string {
  return row.template ?? emailKind(row.subject);
}

export async function logSentEmail(input: {
  to: string | string[] | undefined;
  from?: string | null;
  subject: string;
  html?: string | null;
  /** The plain text, kept as the mail to look at when there is no HTML. */
  text?: string | null;
  meta?: MailMeta | null;
  resendId?: string | null;
  source?: EmailLogSource;
  sentAt?: Date;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const kind = input.meta?.template ?? emailKind(input.subject);
  const template = catalogMail(kind)?.kind ?? kind;
  // The release that built the mail: the same template key can read differently after a change.
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;
  const rows = recipients(input.to).map((address) => ({
    toEmail: address,
    emailNormalized: normalizeEmail(address),
    subject: input.subject,
    fromEmail: input.from ?? null,
    html: input.html ?? (input.text ? textAsHtml(input.text) : null),
    template,
    variant: input.meta?.variant ?? null,
    version,
    vars: input.meta?.vars ?? null,
    resendId: input.resendId ?? null,
    source: input.source ?? (process.env.EMAIL_LOG_SOURCE === "script" ? "script" : "app"),
    ...(input.sentAt ? { sentAt: input.sentAt } : {}),
  }));
  if (rows.length === 0) return;
  try {
    await getDb().insert(emailLog).values(rows).onConflictDoNothing();
  } catch (error) {
    console.error("[email-log] could not log email:", error);
  }
}

/** What we know happened to a mail after sending, from Resend's events. */
export type EmailDeliveryState = {
  lastEvent: string | null;
  openCount: number;
  clickCount: number;
};

export type LoggedEmail = { id: string; subject: string; kind: string; sentAt: string } & EmailDeliveryState;

/** What each address received, oldest first, without the mail itself. */
export async function getLoggedEmailsFor(emails: string[]): Promise<Map<string, LoggedEmail[]>> {
  const byEmail = new Map<string, LoggedEmail[]>();
  const keys = [...new Set(emails.map(normalizeEmail))];
  if (keys.length === 0 || !isDbConfigured()) return byEmail;
  const rows = await getDb()
    .select({
      id: emailLog.id,
      emailNormalized: emailLog.emailNormalized,
      subject: emailLog.subject,
      sentAt: emailLog.sentAt,
      lastEvent: emailLog.lastEvent,
      openCount: emailLog.openCount,
      clickCount: emailLog.clickCount,
    })
    .from(emailLog)
    .where(inArray(emailLog.emailNormalized, keys))
    .orderBy(emailLog.sentAt);
  for (const row of rows) {
    const list = byEmail.get(row.emailNormalized) ?? [];
    list.push({
      id: row.id,
      subject: row.subject,
      kind: emailKind(row.subject),
      sentAt: row.sentAt.toISOString(),
      lastEvent: row.lastEvent,
      openCount: row.openCount,
      clickCount: row.clickCount,
    });
    byEmail.set(row.emailNormalized, list);
  }
  return byEmail;
}

export async function getLoggedEmailHtml(id: string): Promise<{ subject: string; html: string | null; toEmail: string } | null> {
  if (!isDbConfigured()) return null;
  const [row] = await getDb()
    .select({ subject: emailLog.subject, html: emailLog.html, toEmail: emailLog.toEmail })
    .from(emailLog)
    .where(eq(emailLog.id, id))
    .limit(1);
  return row ?? null;
}

export type EmailLogListRow = EmailDeliveryState & {
  id: string;
  to: string;
  /** Sender address and display name, null for mails logged before 0044 and not backfilled. */
  fromAddress: string | null;
  fromName: string | null;
  subject: string;
  kind: string;
  /** Set when more than one version of the mail ran; null otherwise. */
  variant: string | null;
  /** The release that built the mail; null for mails from before this was kept. */
  version: string | null;
  vars: Record<string, string | number | boolean | null> | null;
  sentAt: string;
  hasHtml: boolean;
  customerId: string | null;
  name: string | null;
};

/** "Het MyTable-team <hallo@x.nl>" -> address and name; a bare address has no name. */
export function splitSender(from: string | null): { fromAddress: string | null; fromName: string | null } {
  if (!from) return { fromAddress: null, fromName: null };
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (!match) return { fromAddress: from.trim(), fromName: null };
  return { fromAddress: match[2]!.trim(), fromName: match[1]!.trim() || null };
}

/** Every logged email, newest first, without the mail itself (for the admin E-mails page). */
export async function getEmailLogList(): Promise<EmailLogListRow[]> {
  if (!isDbConfigured()) return [];
  const rows = await getDb()
    .select({
      id: emailLog.id,
      to: emailLog.toEmail,
      from: emailLog.fromEmail,
      subject: emailLog.subject,
      sentAt: emailLog.sentAt,
      lastEvent: emailLog.lastEvent,
      openCount: emailLog.openCount,
      clickCount: emailLog.clickCount,
      template: emailLog.template,
      variant: emailLog.variant,
      version: emailLog.version,
      vars: emailLog.vars,
      hasHtml: sql<boolean>`${emailLog.html} is not null`,
      customerId: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
    })
    .from(emailLog)
    .leftJoin(customers, eq(customers.emailNormalized, emailLog.emailNormalized))
    .orderBy(desc(emailLog.sentAt));
  return rows.map((row) => ({
    id: row.id,
    to: row.to,
    ...splitSender(row.from),
    subject: row.subject,
    kind: templateOf(row),
    variant: row.variant,
    version: row.version,
    vars: row.vars,
    sentAt: row.sentAt.toISOString(),
    lastEvent: row.lastEvent,
    openCount: row.openCount,
    clickCount: row.clickCount,
    hasHtml: row.hasHtml,
    customerId: row.customerId,
    name: row.customerId ? customerDisplayName(row.firstName, row.lastName, row.to) : null,
  }));
}
