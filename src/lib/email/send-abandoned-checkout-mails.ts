import { and, asc, eq, gt, inArray, isNull, lte, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings, events } from "@/db/schema";
import { sundayTableLpCityPath, sundayTableLpPath, type Locale } from "@/i18n/config";
import { buttonMail } from "@/lib/admin/sunday-mails";
import { getEmailReplyTo, getResendClient } from "@/lib/email/resend";
import {
  abandonedCheckoutButton,
  abandonedCheckoutSubject,
  abandonedCheckoutText,
} from "@/lib/email/abandoned-checkout-text";
import { SHARED_TABLE_TYPES } from "@/lib/event-concepts";
import { amsterdamParts } from "@/lib/invites/logic";
import { absoluteUrl } from "@/lib/seo/site";
import { sundaySocialDatePath, sundaySocialSlugFromCity } from "@/lib/sunday-social-cities";
import { formatSundayTableDate } from "@/lib/sunday-wine-table";

/** Only bookings started from this moment on: unfinished bookings from before
 * the mail existed are not mailed afterwards. */
const ELIGIBLE_SINCE = new Date("2026-11-07T10:00:00.000Z");

/** Wait this long after the booking was started (the payment page opened). */
const WAIT_MS = 60 * 60 * 1000;

/** No mail for a Sunday this close: there is no time left to book again. */
const MIN_LEAD_MS = 2 * 24 * 60 * 60 * 1000;

/** Only in the day (Amsterdam, minutes since midnight); a night attempt waits for 08:00. */
const FROM_MIN = 8 * 60;
const UNTIL_MIN = 22 * 60;

/** Looks like a person wrote it: lands in the inbox, not Promotions. */
const FROM = "MyTable <hallo@tafels.mytable.club>";

export type AbandonedCheckoutResult = { bookingId: string; ok: boolean };

type Send = (mail: { to: string; subject: string; text: string; html: string }) => Promise<boolean>;

const defaultSend: Send = async (mail) => {
  const resend = getResendClient();
  if (!resend) return false;
  const { error } = await resend.emails.send({ from: FROM, replyTo: getEmailReplyTo(), ...mail });
  return !error;
};

function dateLabel(d: Date, locale: "nl" | "en"): string {
  // "zondag 6 december": the year only adds noise.
  // "Sunday 6 December", without en-GB's comma after the weekday.
  return formatSundayTableDate(d, locale).replace(/\s\d{4}$/, "").replace(",", "");
}

/**
 * Mails "ging er iets mis?" once to someone who started a booking for a
 * shared-table Sunday an hour ago or longer and didn't pay: once per person
 * per Sunday, not when they paid for that Sunday or another one in the same
 * city since, not for a Sunday less than two days away, and only by day.
 */
export async function sendAbandonedCheckoutMails(
  now: Date = new Date(),
  send: Send = defaultSend,
  since: Date = ELIGIBLE_SINCE,
): Promise<AbandonedCheckoutResult[]> {
  const { minutes } = amsterdamParts(now);
  if (minutes < FROM_MIN || minutes >= UNTIL_MIN) return [];

  const db = getDb();
  const rows = await db
    .select({
      id: bookings.id,
      email: bookings.email,
      name: bookings.customerName,
      locale: bookings.locale,
      createdAt: bookings.createdAt,
      eventId: events.id,
      city: events.city,
      startsAt: events.startsAt,
      capacity: events.capacity,
      spotsSold: events.spotsSold,
    })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        inArray(events.experienceType, [...SHARED_TABLE_TYPES]),
        inArray(bookings.paymentStatus, ["pending", "failed"]),
        gt(bookings.createdAt, since),
        lte(bookings.createdAt, new Date(now.getTime() - WAIT_MS)),
        gt(events.startsAt, new Date(now.getTime() + MIN_LEAD_MS)),
        isNull(bookings.abandonMailSentAt),
      ),
    )
    .orderBy(asc(bookings.createdAt));

  const results: AbandonedCheckoutResult[] = [];
  const done = new Set<string>();

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    const key = `${email}|${row.eventId}`;
    // Several attempts for one Sunday: one mail.
    if (done.has(key)) continue;
    done.add(key);

    // Already mailed for this Sunday (an earlier attempt), or paid since:
    // for this Sunday, or for another one in the same city still ahead.
    const [blocker] = (await db.execute(sql`
      select 1 from bookings b join events e on e.id = b.event_id
      where lower(trim(b.email)) = ${email}
        and (
          (b.event_id = ${row.eventId} and b.abandon_mail_sent_at is not null)
          or (b.payment_status = 'paid' and b.lifecycle_status = 'active'
              and (b.event_id = ${row.eventId} or (lower(e.city) = lower(${row.city}) and e.starts_at > ${now.toISOString()}::timestamptz)))
        )
      limit 1
    `)) as unknown as Array<unknown>;
    if (blocker) {
      // Nothing to send for this Sunday: mark it handled so it isn't checked again.
      await db
        .update(bookings)
        .set({ abandonMailSentAt: sql`now()` })
        .where(and(eq(bookings.id, row.id), isNull(bookings.abandonMailSentAt)));
      continue;
    }

    // Claim every unfinished attempt of this person for this Sunday, so two
    // overlapping runs can't both send.
    const claimed = await db
      .update(bookings)
      .set({ abandonMailSentAt: sql`now()` })
      .where(
        and(
          eq(bookings.eventId, row.eventId),
          sql`lower(trim(${bookings.email})) = ${email}`,
          inArray(bookings.paymentStatus, ["pending", "failed"]),
          isNull(bookings.abandonMailSentAt),
        ),
      )
      .returning({ id: bookings.id });
    if (!claimed.some((c) => c.id === row.id)) continue;

    const locale: "nl" | "en" = row.locale === "en" ? "en" : "nl";
    const open = row.spotsSold < row.capacity;
    const [nextEvent] = open
      ? []
      : await db
          .select({ startsAt: events.startsAt, city: events.city })
          .from(events)
          .where(
            and(
              inArray(events.experienceType, [...SHARED_TABLE_TYPES]),
              eq(events.workflowStatus, "published"),
              sql`lower(${events.city}) = lower(${row.city})`,
              ne(events.id, row.eventId),
              gt(events.startsAt, new Date(now.getTime() + MIN_LEAD_MS)),
              sql`${events.spotsSold} < ${events.capacity}`,
            ),
          )
          .orderBy(asc(events.startsAt))
          .limit(1);

    const slug = sundaySocialSlugFromCity(row.city);
    const path =
      (open ? sundaySocialDatePath(locale as Locale, row) : nextEvent ? sundaySocialDatePath(locale as Locale, nextEvent) : null) ??
      (slug ? sundayTableLpCityPath(locale as Locale, slug) : sundayTableLpPath(locale as Locale));
    const url = absoluteUrl(path);
    const label = dateLabel(row.startsAt, locale);
    const next = nextEvent ? { dateLabel: dateLabel(nextEvent.startsAt, locale) } : null;
    const firstName = row.name?.trim().split(/\s+/)[0] || null;

    const text = abandonedCheckoutText({ locale, firstName, city: row.city, dateLabel: label, open, next, url });
    const mail = buttonMail(text, url, abandonedCheckoutButton({ locale, open, next }));

    let ok = false;
    try {
      ok = await send({ to: row.email, subject: abandonedCheckoutSubject({ locale, dateLabel: label }), ...mail });
    } catch (error) {
      console.error("[abandoned-checkout] send failed:", error);
    }
    if (!ok) {
      // Release so the next run tries again.
      await db
        .update(bookings)
        .set({ abandonMailSentAt: null })
        .where(inArray(bookings.id, claimed.map((c) => c.id)));
    }
    results.push({ bookingId: row.id, ok });
  }

  return results;
}
