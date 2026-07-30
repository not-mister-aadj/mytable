import type { ReactElement } from "react";
import { and, eq, isNull } from "drizzle-orm";
import { SundayTableInviteEmail } from "@/emails/SundayTableInviteEmail";
import { SundayTableCulinaryEmail } from "@/emails/SundayTableCulinaryEmail";
import { SundayTableLocationEmail } from "@/emails/SundayTableLocationEmail";
import { getDb, isDbConfigured } from "@/db/index";
import { sundayTableSignups } from "@/db/schema";
import { agendaPath, type Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  getTransactionalEmailBcc,
  isEmailConfigured,
} from "@/lib/email/resend";
import { sundayTableLocationSubject } from "@/lib/email/subjects";
import {
  getOrCreateReferralCode,
  markPastConfirmedAsAttended,
  whatsappInviteUrl,
} from "@/lib/referral";
import { sundayTableCalendarDownloadUrl } from "@/lib/sunday-table-calendar";
import { getSundayTableLocation } from "@/lib/sunday-table-locations";
import {
  amsterdamDateIso,
  formatSundayTableDate,
  formatSundayTableTime,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return amsterdamDateIso(d);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return amsterdamDateIso(d);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return amsterdamDateIso(d);
}

async function sendSimpleEmail(input: {
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

/** Day-after invite emails for confirmed Sunday Tables yesterday. */
export async function sendSundayTableInviteEmails(): Promise<number> {
  if (!isDbConfigured()) return 0;
  await markPastConfirmedAsAttended();

  const db = getDb();
  const yesterday = yesterdayIso();
  const rows = await db
    .select()
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.status, "confirmed"),
        eq(sundayTableSignups.tableDate, yesterday),
        isNull(sundayTableSignups.inviteEmailSentAt),
      ),
    );

  let sent = 0;

  for (const row of rows) {
    const locale = (row.locale === "en" ? "en" : "nl") as Locale;
    const referral = await getOrCreateReferralCode({
      email: row.email,
      userId: row.userId,
      membershipId: row.membershipId,
      locale,
    });
    if (!referral) continue;
    const wa = whatsappInviteUrl(referral.shareUrl, locale);

    const ok = await sendSimpleEmail({
      to: row.email,
      subject:
        locale === "en"
          ? "Invite someone to the next Sunday Table"
          : "Nodig iemand uit voor de volgende Sunday Table",
      element: SundayTableInviteEmail({
        locale,
        firstName: row.name?.split(" ")[0],
        city: row.city,
        shareUrl: referral.shareUrl,
        whatsappUrl: wa,
      }),
    });

    if (ok) {
      await db
        .update(sundayTableSignups)
        .set({ inviteEmailSentAt: new Date() })
        .where(eq(sundayTableSignups.id, row.id));
      sent += 1;
    }
  }
  return sent;
}

/** ~7 days after Sunday: culinary CTA. */
export async function sendSundayTableCulinaryEmails(): Promise<number> {
  if (!isDbConfigured()) return 0;
  const db = getDb();
  const target = daysAgoIso(7);
  const rows = await db
    .select()
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.status, "confirmed"),
        eq(sundayTableSignups.tableDate, target),
        isNull(sundayTableSignups.culinaryEmailSentAt),
      ),
    );

  let sent = 0;
  const site = getSiteUrl().replace(/\/$/, "");

  for (const row of rows) {
    const locale = (row.locale === "en" ? "en" : "nl") as Locale;
    const agendaUrl = `${site}${agendaPath(locale)}?city=${encodeURIComponent(row.city)}&from=sunday-table`;

    const ok = await sendSimpleEmail({
      to: row.email,
      subject:
        locale === "en"
          ? "Book a culinary experience with your table"
          : "Boek een culinaire ervaring met je tafel",
      element: SundayTableCulinaryEmail({
        locale,
        firstName: row.name?.split(" ")[0],
        city: row.city,
        agendaUrl,
      }),
    });

    if (ok) {
      await db
        .update(sundayTableSignups)
        .set({ culinaryEmailSentAt: new Date() })
        .where(eq(sundayTableSignups.id, row.id));
      sent += 1;
    }
  }
  return sent;
}

/**
 * Day before Sunday Table (~24h): send exact venue when admin set a location.
 * Cron runs daily morning; targets tomorrow's confirmed RSVPs.
 */
export async function sendSundayTableLocationEmails(): Promise<number> {
  if (!isDbConfigured()) return 0;
  const db = getDb();
  const tomorrow = tomorrowIso();
  const rows = await db
    .select()
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.status, "confirmed"),
        eq(sundayTableSignups.tableDate, tomorrow),
        isNull(sundayTableSignups.locationEmailSentAt),
      ),
    );

  let sent = 0;
  const locationCache = new Map<
    string,
    Awaited<ReturnType<typeof getSundayTableLocation>>
  >();

  for (const row of rows) {
    const tableType =
      row.tableType === "girls_only" || row.tableType === "mixed"
        ? row.tableType
        : "mixed";
    const cacheKey = `${row.city}|${tomorrow}|${tableType}`;
    let location = locationCache.get(cacheKey);
    if (location === undefined) {
      location = await getSundayTableLocation({
        city: row.city,
        tableDate: tomorrow,
        tableType,
      });
      locationCache.set(cacheKey, location);
    }
    if (!location) continue;

    const locale = (row.locale === "en" ? "en" : "nl") as Locale;
    const dateObj = parseAmsterdamDateIso(tomorrow);
    const dateLabel = dateObj
      ? formatSundayTableDate(dateObj, locale)
      : tomorrow;
    const timeLabel = formatSundayTableTime(locale);

    const ok = await sendSimpleEmail({
      to: row.email,
      subject: sundayTableLocationSubject(row.city, dateLabel),
      element: SundayTableLocationEmail({
        locale,
        firstName: row.name?.split(" ")[0],
        city: row.city,
        date: dateLabel,
        time: timeLabel,
        tableType,
        venueName: location.venueName,
        address: location.address,
        notes: location.notes,
        calendarUrl: sundayTableCalendarDownloadUrl({
          city: row.city,
          tableDate: tomorrow,
          tableType,
          locale,
          signupId: row.id,
        }),
      }),
    });

    if (ok) {
      await db
        .update(sundayTableSignups)
        .set({ locationEmailSentAt: new Date() })
        .where(eq(sundayTableSignups.id, row.id));
      sent += 1;
    }
  }

  return sent;
}

export async function runSundayTableLifecycleJobs(): Promise<{
  invites: number;
  culinary: number;
  locations: number;
  attended: number;
}> {
  const attended = await markPastConfirmedAsAttended();
  const locations = await sendSundayTableLocationEmails();
  const invites = await sendSundayTableInviteEmails();
  const culinary = await sendSundayTableCulinaryEmails();
  return { invites, culinary, locations, attended };
}
