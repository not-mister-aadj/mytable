import type { SundayTableSignup } from "@/db/schema";
import { sundayTableSignups } from "@/db/schema";
import { getDb } from "@/db/index";
import { SundayTableCancelEmail } from "@/emails/SundayTableCancelEmail";
import { SundayTableConfirmationEmail } from "@/emails/SundayTableConfirmationEmail";
import { SundayTablePlusOneEmail } from "@/emails/SundayTablePlusOneEmail";
import { clubmemberPath, type Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  getTransactionalEmailBcc,
  isEmailConfigured,
  type EmailSendResult,
} from "@/lib/email/resend";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import {
  sundayTableCancelSubject,
  sundayTableConfirmationSubject,
  sundayTablePlusOneAddedSubject,
  sundayTablePlusOneRemovedSubject,
} from "@/lib/email/subjects";
import {
  buildSundayTableIcs,
  sundayTableCalendarDownloadUrl,
} from "@/lib/sunday-table-calendar";
import {
  formatSundayTableDate,
  formatSundayTableTime,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";
import type { ReactElement } from "react";
import { eq } from "drizzle-orm";

async function signupEmailLocale(
  row: Pick<SundayTableSignup, "email" | "userId" | "locale">,
): Promise<Locale> {
  return resolveEmailLocale({
    email: row.email,
    userId: row.userId,
    fallbackLocale: row.locale,
  });
}

function signupTableType(
  row: Pick<SundayTableSignup, "tableType">,
): "girls_only" | "mixed" {
  return row.tableType === "girls_only" ? "girls_only" : "mixed";
}

function signupDateIso(row: Pick<SundayTableSignup, "tableDate">): string {
  return typeof row.tableDate === "string"
    ? row.tableDate.slice(0, 10)
    : String(row.tableDate).slice(0, 10);
}

function signupDateParts(
  row: Pick<SundayTableSignup, "tableDate">,
  locale: Locale,
) {
  const iso = signupDateIso(row);
  const date = parseAmsterdamDateIso(iso);
  return {
    locale,
    dateIso: iso,
    dateLabel: date ? formatSundayTableDate(date, locale) : iso,
    timeLabel: formatSundayTableTime(locale),
  };
}

function firstNameFrom(row: Pick<SundayTableSignup, "name">): string | undefined {
  const part = row.name?.trim().split(/\s+/)[0];
  return part || undefined;
}

async function sendRendered(input: {
  to: string;
  subject: string;
  element: ReactElement;
  ics?: { filename: string; content: string } | null;
}): Promise<EmailSendResult> {
  if (!isEmailConfigured()) {
    console.warn("[email] RESEND_API_KEY missing, skip Sunday Table email");
    return { ok: false, error: "Email not configured" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "Email not configured" };
  }

  const { html, text } = await renderEmailForDelivery(input.element);
  const bcc = getTransactionalEmailBcc().filter(
    (address) => address.toLowerCase() !== input.to.toLowerCase(),
  );
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to: input.to,
    bcc: bcc.length > 0 ? bcc : undefined,
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

  if (error) {
    console.error("[email] Sunday Table send failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data?.id ?? "unknown" };
}

export function buildSundayTableConfirmationProps(
  row: SundayTableSignup,
  locale: Locale,
): Parameters<typeof SundayTableConfirmationEmail>[0] {
  const { dateIso, dateLabel, timeLabel } = signupDateParts(row, locale);
  const tableType = signupTableType(row);
  return {
    locale,
    firstName: firstNameFrom(row),
    city: row.city,
    date: dateLabel,
    time: timeLabel,
    tableType,
    plusOne: row.plusOne,
    clubmemberUrl: `${getSiteUrl()}${clubmemberPath(locale)}`,
    calendarUrl: sundayTableCalendarDownloadUrl({
      city: row.city,
      tableDate: dateIso,
      tableType,
      locale,
      signupId: row.id,
    }),
  };
}

export function buildSundayTableCancelProps(
  row: SundayTableSignup,
  locale: Locale,
): Parameters<typeof SundayTableCancelEmail>[0] {
  const { dateLabel, timeLabel } = signupDateParts(row, locale);
  return {
    locale,
    firstName: firstNameFrom(row),
    city: row.city,
    date: dateLabel,
    time: timeLabel,
    tableType: signupTableType(row),
    clubmemberUrl: `${getSiteUrl()}${clubmemberPath(locale)}`,
  };
}

export function buildSundayTablePlusOneProps(
  row: SundayTableSignup,
  action: "added" | "removed",
  locale: Locale,
): Parameters<typeof SundayTablePlusOneEmail>[0] {
  const { dateLabel, timeLabel } = signupDateParts(row, locale);
  return {
    locale,
    firstName: firstNameFrom(row),
    city: row.city,
    date: dateLabel,
    time: timeLabel,
    tableType: signupTableType(row),
    action,
    clubmemberUrl: `${getSiteUrl()}${clubmemberPath(locale)}`,
  };
}

export async function sendSundayTableConfirmationEmail(
  row: SundayTableSignup,
  options?: { force?: boolean },
): Promise<EmailSendResult> {
  if (row.confirmationEmailSentAt && !options?.force) {
    return { ok: true, id: "already-sent" };
  }

  const locale = await signupEmailLocale(row);
  const props = buildSundayTableConfirmationProps(row, locale);
  const dateIso = signupDateIso(row);
  const ics = buildSundayTableIcs({
    city: row.city,
    tableDate: dateIso,
    tableType: signupTableType(row),
    locale,
    signupId: row.id,
  });

  const result = await sendRendered({
    to: row.email,
    subject: sundayTableConfirmationSubject(props.city, props.date, locale),
    element: SundayTableConfirmationEmail(props),
    ics: ics
      ? {
          filename: `mytable-sunday-table-${dateIso}.ics`,
          content: ics,
        }
      : null,
  });

  if (result.ok && result.id !== "already-sent") {
    try {
      const db = getDb();
      await db
        .update(sundayTableSignups)
        .set({ confirmationEmailSentAt: new Date() })
        .where(eq(sundayTableSignups.id, row.id));
    } catch (err) {
      console.error("[email] mark confirmation sent", err);
    }
  }

  return result;
}

export async function sendSundayTableCancelEmail(
  row: SundayTableSignup,
): Promise<EmailSendResult> {
  const locale = await signupEmailLocale(row);
  const props = buildSundayTableCancelProps(row, locale);
  return sendRendered({
    to: row.email,
    subject: sundayTableCancelSubject(props.city, props.date, locale),
    element: SundayTableCancelEmail(props),
  });
}

export async function sendSundayTablePlusOneEmail(
  row: SundayTableSignup,
  action: "added" | "removed",
): Promise<EmailSendResult> {
  const locale = await signupEmailLocale(row);
  const props = buildSundayTablePlusOneProps(row, action, locale);
  const subject =
    action === "added"
      ? sundayTablePlusOneAddedSubject(props.city, props.date, locale)
      : sundayTablePlusOneRemovedSubject(props.city, props.date, locale);

  return sendRendered({
    to: row.email,
    subject,
    element: SundayTablePlusOneEmail(props),
  });
}

/** Fire-and-forget helper for RSVP side effects. */
export function voidSundayTableConfirmationEmail(
  row: SundayTableSignup,
): void {
  void sendSundayTableConfirmationEmail(row).catch((err) => {
    console.error("[email] Sunday Table confirmation", err);
  });
}

export function voidSundayTableCancelEmail(row: SundayTableSignup): void {
  void sendSundayTableCancelEmail(row).catch((err) => {
    console.error("[email] Sunday Table cancel", err);
  });
}

export function voidSundayTablePlusOneEmail(
  row: SundayTableSignup,
  action: "added" | "removed",
): void {
  void sendSundayTablePlusOneEmail(row, action).catch((err) => {
    console.error("[email] Sunday Table +1", err);
  });
}
