import { SundayTableWaitlistInviteEmail } from "@/emails/SundayTableWaitlistInviteEmail";
import { joinPath, type Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { sundayTableWaitlistInviteSubject } from "@/lib/email/subjects";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import { getSundayTableSeatStats } from "@/lib/sunday-table-capacity";
import type { SundayTableKey } from "@/lib/sunday-table-shared";
import {
  getWaitlistInviteCandidates,
  recordWaitlistInviteSent,
} from "@/lib/sunday-table-waitlist-invites";
import {
  formatSundayTableDate,
  formatSundayTableTime,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

const DEFAULT_LIMIT = 25;

function priceHintForLocale(locale: Locale): string {
  return locale === "en"
    ? "From €8.33/month (12 mo)"
    : "Vanaf €8,33/maand (12 mnd)";
}

/**
 * Manually triggered from the admin Sunday Table detail page — invites the
 * oldest not-yet-invited waitlist candidates for one cohort (city + date +
 * table type) to claim a paid seat. Never automated; staff decide when a
 * cohort has enough matching interest to open.
 */
export async function sendSundayTableWaitlistInvites(input: {
  key: SundayTableKey;
  limit?: number;
  dryRun?: boolean;
}): Promise<{ sent: number; skipped: number; failed: number; eligible: number }> {
  const candidates = await getWaitlistInviteCandidates(input.key, {
    limit: input.limit ?? DEFAULT_LIMIT,
  });

  if (candidates.length === 0) {
    return { sent: 0, skipped: 0, failed: 0, eligible: 0 };
  }

  if (input.dryRun) {
    return { sent: 0, skipped: 0, failed: 0, eligible: candidates.length };
  }

  const site = getSiteUrl().replace(/\/$/, "");
  const dateObj = parseAmsterdamDateIso(input.key.tableDate);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const locale = await resolveEmailLocale({
      email: candidate.email,
      fallbackLocale: candidate.locale,
    });

    // Recompute seats-left per send — earlier sends in this same batch (or
    // claims coming in concurrently) can change it.
    const seatStats = await getSundayTableSeatStats({
      city: input.key.city,
      tableDate: input.key.tableDate,
      tableType: input.key.tableType,
    });
    if (seatStats.seatsLeft <= 0) {
      skipped += 1;
      continue;
    }

    const dateLabel = dateObj
      ? formatSundayTableDate(dateObj, locale)
      : input.key.tableDate;
    const claimUrl = `${site}${joinPath(locale)}?city=${encodeURIComponent(input.key.city)}`;

    const ok = await sendSimpleEmail({
      to: candidate.email,
      subject: sundayTableWaitlistInviteSubject(
        input.key.city,
        dateLabel,
        locale,
      ),
      element: SundayTableWaitlistInviteEmail({
        locale,
        firstName: candidate.name?.split(" ")[0],
        city: input.key.city,
        dateLabel,
        timeLabel: formatSundayTableTime(locale),
        tableType: input.key.tableType,
        seatsLeft: seatStats.seatsLeft,
        claimUrl,
        priceHint: priceHintForLocale(locale),
      }),
    });

    if (ok) {
      await recordWaitlistInviteSent({
        waitlistSignupId: candidate.waitlistId,
        email: candidate.email,
        locale,
        key: input.key,
      });
      sent += 1;
    } else {
      // Leave un-recorded so a retry picks this candidate back up.
      failed += 1;
    }
  }

  return { sent, skipped, failed, eligible: candidates.length };
}
