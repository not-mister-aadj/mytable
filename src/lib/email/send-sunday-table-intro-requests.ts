import { and, eq, gt, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { SundayTableIntroRequestEmail } from "@/emails/SundayTableIntroRequestEmail";
import { getDb } from "@/db/index";
import { bookings, events } from "@/db/schema";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { sundayTableIntroRequestSubject } from "@/lib/email/subjects";
import { absoluteUrl } from "@/lib/seo/site";
import { signSundayTableIntroToken } from "@/lib/sunday-table-intro";
import { formatSundayTableDate } from "@/lib/sunday-wine-table";

/** Only bookings from this moment on are eligible, so guests who booked
 * before the "meet your table" questions existed are not mailed. */
const ELIGIBLE_SINCE = new Date("2026-09-27T18:00:00.000Z");

/** Gives people time to answer on the confirmation page first. Measured from
 * the confirmation email, which goes out the moment the payment lands. */
const GRACE_MS = 15 * 60 * 1000;

export type IntroRequestResult = { bookingId: string; ok: boolean };

type Sender = typeof sendSimpleEmail;

function introPath(locale: "nl" | "en"): string {
  return locale === "en" ? "/en/boeking/intro" : "/boeking/intro";
}

/**
 * Emails the "introduce yourself" questions, once, to Sunday Table guests who
 * paid at least 15 minutes ago, have not answered on the confirmation page,
 * and whose table is still ahead.
 */
export async function sendSundayTableIntroRequests(
  now: Date = new Date(),
  send: Sender = sendSimpleEmail,
): Promise<IntroRequestResult[]> {
  const db = getDb();
  const before = new Date(now.getTime() - GRACE_MS);

  const due = await db
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(
      and(
        eq(events.experienceType, "sunday-table"),
        gt(events.startsAt, now),
        eq(bookings.paymentStatus, "paid"),
        eq(bookings.lifecycleStatus, "active"),
        isNull(bookings.introAnsweredAt),
        isNull(bookings.introRequestSentAt),
        isNotNull(bookings.confirmationEmailSentAt),
        lte(bookings.confirmationEmailSentAt, before),
        gt(bookings.createdAt, ELIGIBLE_SINCE),
      ),
    );

  const results: IntroRequestResult[] = [];

  for (const { id } of due) {
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
    results.push({ bookingId: claimed.id, ok });
  }

  return results;
}
