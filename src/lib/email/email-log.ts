import { desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { customers, emailLog } from "@/db/schema";
import { customerDisplayName, normalizeEmail } from "@/lib/customers/normalize";
import { emailKind } from "@/lib/email/email-kind";

export type EmailLogSource = "app" | "script" | "resend_import";

function recipients(to: string | string[] | undefined): string[] {
  if (!to) return [];
  return (Array.isArray(to) ? to : [to]).map((address) => address.trim()).filter(Boolean);
}

/** Logs one sent email per recipient (not the BCC copy). Never throws: a
 * failing log must not turn a sent email into an error. */
export async function logSentEmail(input: {
  to: string | string[] | undefined;
  from?: string | null;
  subject: string;
  html?: string | null;
  resendId?: string | null;
  source?: EmailLogSource;
  sentAt?: Date;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const rows = recipients(input.to).map((address) => ({
    toEmail: address,
    emailNormalized: normalizeEmail(address),
    subject: input.subject,
    fromEmail: input.from ?? null,
    html: input.html ?? null,
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
    kind: emailKind(row.subject),
    sentAt: row.sentAt.toISOString(),
    lastEvent: row.lastEvent,
    openCount: row.openCount,
    clickCount: row.clickCount,
    hasHtml: row.hasHtml,
    customerId: row.customerId,
    name: row.customerId ? customerDisplayName(row.firstName, row.lastName, row.to) : null,
  }));
}
