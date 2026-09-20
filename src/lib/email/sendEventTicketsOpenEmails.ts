import { SundayTableTicketsOpenEmail } from "@/emails/SundayTableTicketsOpenEmail";
import { sundayTableLocationPath, sundayTableLpPath } from "@/i18n/config";
import { sundayTableLpSlugFromCity } from "@/data/sunday-table-lp-cities";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { sundayTableTicketsOpenSubject } from "@/lib/email/subjects";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import {
  getUnnotifiedEventSignups,
  markEventSignupNotified,
} from "@/lib/event-notify-signups";
import { absoluteUrl } from "@/lib/seo/site";
import { formatSundayTableDate, formatSundayTableTime } from "@/lib/sunday-wine-table";

/**
 * Manually triggered when an admin confirms a venue for a comingSoon Sunday
 * Table event. Mails everyone on that event's own "notify me" mini list
 * (src/lib/event-notify-signups.ts), once, then marks them notified.
 */
export async function sendEventTicketsOpenEmails(input: {
  eventId: string;
  city: string;
  venueName: string;
  startsAt: Date;
  /** Amsterdam-local YYYY-MM-DD, matching sunday_table_locations.table_date. */
  dateIso: string;
}): Promise<{ sent: number; failed: number }> {
  const signups = await getUnnotifiedEventSignups(input.eventId);
  if (signups.length === 0) return { sent: 0, failed: 0 };

  const citySlug = sundayTableLpSlugFromCity(input.city);

  let sent = 0;
  let failed = 0;

  for (const signup of signups) {
    const locale = await resolveEmailLocale({
      email: signup.email,
      fallbackLocale: signup.locale,
    });
    const dateLabel = formatSundayTableDate(input.startsAt, locale);
    const timeLabel = formatSundayTableTime(locale);
    const ticketUrl = citySlug
      ? absoluteUrl(sundayTableLocationPath(locale, citySlug, input.dateIso))
      : absoluteUrl(sundayTableLpPath(locale));

    const ok = await sendSimpleEmail({
      to: signup.email,
      subject: sundayTableTicketsOpenSubject(input.city, dateLabel, locale),
      element: SundayTableTicketsOpenEmail({
        locale,
        city: input.city,
        dateLabel,
        timeLabel,
        venueName: input.venueName,
        ticketUrl,
      }),
    });

    if (ok) {
      await markEventSignupNotified(signup.id);
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return { sent, failed };
}
