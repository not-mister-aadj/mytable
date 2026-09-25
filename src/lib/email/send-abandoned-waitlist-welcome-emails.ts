import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { waitlistSignups } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { sendSundayTableWaitlistWelcomeEmail } from "@/lib/email/sendSundayTableWaitlistEmails";
import { releaseWaitlistWelcomeEmailClaim } from "@/lib/waitlist-data";

/** Only signups from this moment on are eligible, so the people who signed up
 * before this fallback existed are not mailed months later. */
const ELIGIBLE_SINCE = new Date("2026-09-25T15:00:00.000Z");

/** Never look further back than this, even if the cron was down for a while. */
const MAX_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;

/** Someone who is still answering the questionnaire gets the regular
 * welcome email from the signup API when they finish or skip. The fallback
 * only steps in once they have clearly left. */
const GRACE_MS = 30 * 60 * 1000;

type WelcomeSender = typeof sendSundayTableWaitlistWelcomeEmail;

export type AbandonedWelcomeResult = {
  email: string;
  ok: boolean;
};

const GENDERS = ["female", "male", "other", "unspecified"] as const;
type Gender = (typeof GENDERS)[number];

function genderFromPreferences(
  preferences: Record<string, unknown> | null,
): Gender | undefined {
  const raw = preferences?.gender;
  const first = Array.isArray(raw) ? raw[0] : undefined;
  return GENDERS.find((g) => g === first);
}

/**
 * Sends the welcome email to people who joined the waitlist but left before
 * finishing the questionnaire, which is the only moment the signup API sends
 * it. One email per person, listing every city they joined.
 */
export async function sendAbandonedWaitlistWelcomeEmails(
  now: Date = new Date(),
  send: WelcomeSender = sendSundayTableWaitlistWelcomeEmail,
): Promise<AbandonedWelcomeResult[]> {
  const db = getDb();
  const since = new Date(
    Math.max(ELIGIBLE_SINCE.getTime(), now.getTime() - MAX_LOOKBACK_MS),
  );
  const before = new Date(now.getTime() - GRACE_MS);

  const people = await db
    .select({ email: waitlistSignups.email })
    .from(waitlistSignups)
    .where(eq(waitlistSignups.source, "waitlist"))
    .groupBy(waitlistSignups.email)
    .having(
      sql`min(${waitlistSignups.createdAt}) >= ${since.toISOString()}::timestamptz
        and min(${waitlistSignups.createdAt}) <= ${before.toISOString()}::timestamptz
        and not bool_or(${waitlistSignups.welcomeEmailSentAt} is not null)`,
    );

  const results: AbandonedWelcomeResult[] = [];

  for (const { email } of people) {
    // Claim every row of this person in one statement. If a row already has a
    // welcome email (they finished the questionnaire in the meantime), the
    // NOT EXISTS makes this claim empty and nothing is sent.
    const claimed = await db
      .update(waitlistSignups)
      .set({ welcomeEmailSentAt: sql`now()` })
      .where(
        and(
          eq(waitlistSignups.email, email),
          eq(waitlistSignups.source, "waitlist"),
          sql`not exists (
            select 1 from ${waitlistSignups} as w
            where w.email = ${email} and w.welcome_email_sent_at is not null
          )`,
        ),
      )
      .returning({
        id: waitlistSignups.id,
        city: waitlistSignups.city,
        locale: waitlistSignups.locale,
        name: waitlistSignups.name,
        preferences: waitlistSignups.preferences,
        createdAt: waitlistSignups.createdAt,
      });

    if (claimed.length === 0) continue;

    claimed.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const locale: Locale = claimed[0]!.locale === "en" ? "en" : "nl";
    const cities = [...new Set(claimed.map((row) => row.city))];
    const firstName = claimed.find((row) => row.name)?.name ?? undefined;
    const gender = claimed
      .map((row) => genderFromPreferences(row.preferences))
      .find((g) => g !== undefined);

    let ok = false;
    try {
      ok = await send({ to: email, locale, firstName, cities, gender });
    } catch (error) {
      console.error("[waitlist] abandoned welcome email failed:", error);
    }

    if (!ok) {
      // Release so the next run tries this person again.
      for (const row of claimed) {
        await releaseWaitlistWelcomeEmailClaim(row.id).catch(() => {});
      }
    }
    results.push({ email, ok });
  }

  return results;
}
