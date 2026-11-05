import { and, asc, eq, gt, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { SundayTableIntroRequestEmail } from "@/emails/SundayTableIntroRequestEmail";
import { getDb } from "@/db/index";
import { bookings, events } from "@/db/schema";
import { SHARED_TABLE_TYPES } from "@/lib/event-concepts";
import { amsterdamParts } from "@/lib/invites/logic";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { sundayTableIntroRequestSubject } from "@/lib/email/subjects";
import { absoluteUrl } from "@/lib/seo/site";
import { applyCustomerIntroToBooking, signSundayTableIntroToken } from "@/lib/sunday-table-intro";
import { formatSundayTableDate } from "@/lib/sunday-wine-table";

/** Only bookings from this moment on are eligible, so guests who booked
 * before the "meet your table" questions existed are not mailed. */
const ELIGIBLE_SINCE = new Date("2026-09-27T18:00:00.000Z");

/** Gives people time to answer on the confirmation page first. Measured from
 * the confirmation email, which goes out the moment the payment lands. */
const GRACE_MS = 15 * 60 * 1000;

/** A booking whose confirmation went out longer ago than this is a catch-up
 * (it never got the questions), not a fresh booking. */
const BACKLOG_AFTER_MS = 24 * 60 * 60 * 1000;

/** Catch-up mails per Amsterdam day, soonest table first, so they stay well
 * inside the daily mail limit next to the invites. Fresh bookings are not
 * capped. */
export const BACKLOG_PER_DAY = 25;

/** No catch-up for a table this close: those guests get their table page
 * (with the questions) in the mails of that week. */
const BACKLOG_MIN_LEAD_MS = 7 * 24 * 60 * 60 * 1000;

/** Catch-up mails only go out in the day (Amsterdam, minutes since midnight). */
const BACKLOG_FROM_MIN = 9 * 60;
const BACKLOG_UNTIL_MIN = 21 * 60;

export type IntroRequestResult = { bookingId: string; ok: boolean };

type Sender = typeof sendSimpleEmail;

function introPath(locale: "nl" | "en"): string {
  return locale === "en" ? "/en/boeking/intro" : "/boeking/intro";
}

/**
 * Emails the "introduce yourself" questions, once, to shared-table guests
 * (Sunday Social and "Jouw tafel") who paid at least 15 minutes ago, have not
 * answered on the confirmation page, and whose table is still ahead. Older
 * bookings that never got it are caught up BACKLOG_PER_DAY a day, soonest
 * table first.
 */
export async function sendSundayTableIntroRequests(
  now: Date = new Date(),
  send: Sender = sendSimpleEmail,
): Promise<IntroRequestResult[]> {
  const db = getDb();
  const before = new Date(now.getTime() - GRACE_MS);

  const due = await db
    .select({ id: bookings.id, confirmedAt: bookings.confirmationEmailSentAt, startsAt: events.startsAt })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        inArray(events.experienceType, [...SHARED_TABLE_TYPES]),
        gt(events.startsAt, now),
        // Seating is done: "we take your answers into account" no longer holds.
        isNull(events.groupsFinalAt),
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
        isNull(bookings.introAnsweredAt),
        isNull(bookings.introRequestSentAt),
        isNotNull(bookings.confirmationEmailSentAt),
        lte(bookings.confirmationEmailSentAt, before),
        gt(bookings.createdAt, ELIGIBLE_SINCE),
      ),
    )
    .orderBy(asc(events.startsAt), asc(bookings.createdAt));

  const backlogBefore = new Date(now.getTime() - BACKLOG_AFTER_MS);
  const [{ sentToday }] = (await db.execute(sql`
    select count(*)::int as "sentToday" from bookings
    where intro_request_sent_at >= (date_trunc('day', ${now.toISOString()}::timestamptz at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam')
      and confirmation_email_sent_at < intro_request_sent_at - interval '24 hours'
  `)) as unknown as Array<{ sentToday: number }>;
  const { minutes } = amsterdamParts(now);
  const daytime = minutes >= BACKLOG_FROM_MIN && minutes < BACKLOG_UNTIL_MIN;
  let backlogLeft = daytime ? Math.max(0, BACKLOG_PER_DAY - (sentToday ?? 0)) : 0;

  const results: IntroRequestResult[] = [];

  for (const { id, confirmedAt, startsAt } of due) {
    const isBacklog = confirmedAt !== null && confirmedAt < backlogBefore;
    if (isBacklog && (backlogLeft <= 0 || startsAt.getTime() - now.getTime() < BACKLOG_MIN_LEAD_MS)) continue;

    // Answered before, on an earlier booking: those answers carry over and
    // the booking counts as answered, so no reminder.
    if (await applyCustomerIntroToBooking(id).catch(() => false)) continue;

    // Claim first, so two overlapping cron runs can never both send it. If
    // they answered in the meantime, the claim comes back empty.
    const [claimed] = await db
      .update(bookings)
      .set({ introRequestSentAt: sql`now()` })
      .where(
        and(
          eq(bookings.id, id),
          isNull(bookings.introRequestSentAt),
          isNull(bookings.introAnsweredAt),
        ),
      )
      .returning({
        id: bookings.id,
        email: bookings.email,
        locale: bookings.locale,
        customerName: bookings.customerName,
        eventId: bookings.eventId,
      });
    if (!claimed) continue;

    const [event] = await db
      .select({ startsAt: events.startsAt })
      .from(events)
      .where(eq(events.id, claimed.eventId))
      .limit(1);

    const locale = claimed.locale === "en" ? "en" : "nl";
    let ok = false;
    try {
      const token = await signSundayTableIntroToken(claimed.id);
      const introUrl = `${absoluteUrl(introPath(locale))}?token=${encodeURIComponent(token)}`;
      const firstName = claimed.customerName?.trim().split(/\s+/)[0] || undefined;
      // "zondag 1 november": the year only adds noise in this email.
      const dateLabel = formatSundayTableDate(event!.startsAt, locale).replace(/\s\d{4}$/, "");
      ok = await send({
        to: claimed.email,
        subject: sundayTableIntroRequestSubject(dateLabel, locale),
        element: SundayTableIntroRequestEmail({ locale, firstName, dateLabel, introUrl }),
      });
    } catch (error) {
      console.error("[intro] request email failed:", error);
    }

    if (!ok) {
      // Release so the next run tries again.
      await db
        .update(bookings)
        .set({ introRequestSentAt: null })
        .where(eq(bookings.id, claimed.id))
        .catch(() => {});
    }
    if (ok && isBacklog) backlogLeft -= 1;
    results.push({ bookingId: claimed.id, ok });
  }

  return results;
}
