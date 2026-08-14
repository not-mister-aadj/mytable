import { and, eq, isNull, lt } from "drizzle-orm";
import { SundayTableCulinaryEmail } from "@/emails/SundayTableCulinaryEmail";
import { SundayTableLocationEmail } from "@/emails/SundayTableLocationEmail";
import { SundayTableReviewEmail } from "@/emails/SundayTableReviewEmail";
import { getDb, isDbConfigured } from "@/db/index";
import { sundayTableSignups } from "@/db/schema";
import { agendaPath, sundayTableReviewPath, type Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import { isEmailConfigured } from "@/lib/email/resend";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import { sundayTableLocationSubject } from "@/lib/email/subjects";
import { PostHogEvents } from "@/lib/posthog/events";
import { sundayTableCalendarDownloadUrl } from "@/lib/sunday-table-calendar";
import { getSundayTableLocation } from "@/lib/sunday-table-locations";
import { signSundayTableReviewToken } from "@/lib/sunday-table-review-token";
import {
  amsterdamDateIso,
  formatSundayTableDate,
  formatSundayTableTime,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

async function emailLocaleForSignup(row: {
  email: string;
  userId: string | null;
  locale: string;
}): Promise<Locale> {
  return resolveEmailLocale({
    email: row.email,
    userId: row.userId,
    fallbackLocale: row.locale,
  });
}

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

/** Mark confirmed past Sundays as attended (for lifecycle emails + analytics).
 * Used to also trigger a referral reward — the referral system was removed
 * (unused, 0 rows ever), so this now just marks attendance. */
async function markPastConfirmedAsAttended(): Promise<number> {
  if (!isDbConfigured()) return 0;
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const updated = await db
    .update(sundayTableSignups)
    .set({ attendedAt: new Date() })
    .where(
      and(
        eq(sundayTableSignups.status, "confirmed"),
        isNull(sundayTableSignups.attendedAt),
        lt(sundayTableSignups.tableDate, today),
      ),
    )
    .returning({ id: sundayTableSignups.id, email: sundayTableSignups.email });

  for (const row of updated) {
    try {
      const { captureServerEvent } = await import("@/lib/posthog/server");
      void captureServerEvent(row.email, PostHogEvents.sundayShowUp, {
        signup_id: row.id,
      });
    } catch {
      // analytics must not block
    }
  }
  return updated.length;
}

/** Day 1 after Sunday Table: ask for a review. */
export async function sendSundayTableReviewEmails(): Promise<number> {
  if (!isDbConfigured() || !isEmailConfigured()) return 0;
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
        isNull(sundayTableSignups.reviewEmailSentAt),
      ),
    );

  let sent = 0;
  const site = getSiteUrl().replace(/\/$/, "");

  for (const row of rows) {
    const locale = await emailLocaleForSignup(row);
    try {
      const token = await signSundayTableReviewToken({
        signupId: row.id,
        email: row.email,
      });
      const reviewUrl = `${site}${sundayTableReviewPath(locale, token)}`;
      const ok = await sendSimpleEmail({
        to: row.email,
        subject:
          locale === "en"
            ? `How was Sunday Table in ${row.city}?`
            : `Hoe was Sunday Table in ${row.city}?`,
        element: SundayTableReviewEmail({
          locale,
          firstName: row.name?.split(" ")[0],
          city: row.city,
          reviewUrl,
        }),
      });
      if (ok) {
        await db
          .update(sundayTableSignups)
          .set({ reviewEmailSentAt: new Date() })
          .where(eq(sundayTableSignups.id, row.id));
        sent += 1;
      }
    } catch {
      // Skip row if token/secret missing; next cron can retry.
    }
  }
  return sent;
}

/** Day 2 after Sunday Table: used to send a referral-link invite email.
 * The referral system was removed (unused, 0 rows ever) — this email's
 * whole point was sharing that link, so it's now a no-op rather than a
 * hollowed-out email with nothing to share. Kept as a function (returning
 * 0) so runSundayTableLifecycleJobs's shape doesn't need to change. */
export async function sendSundayTableInviteEmails(): Promise<number> {
  return 0;
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
    const locale = await emailLocaleForSignup(row);
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

    const locale = await emailLocaleForSignup(row);
    const dateObj = parseAmsterdamDateIso(tomorrow);
    const dateLabel = dateObj
      ? formatSundayTableDate(dateObj, locale)
      : tomorrow;
    const timeLabel = formatSundayTableTime(locale);

    const ok = await sendSimpleEmail({
      to: row.email,
      subject: sundayTableLocationSubject(row.city, dateLabel, locale),
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
  reviews: number;
  invites: number;
  culinary: number;
  locations: number;
  attended: number;
}> {
  const attended = await markPastConfirmedAsAttended();
  const locations = await sendSundayTableLocationEmails();
  const reviews = await sendSundayTableReviewEmails();
  const invites = await sendSundayTableInviteEmails();
  const culinary = await sendSundayTableCulinaryEmails();
  return { reviews, invites, culinary, locations, attended };
}
