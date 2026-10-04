import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { accountWelcomeEmails } from "@/db/schema";
import { JouwTafelWelcomeEmail } from "@/emails/JouwTafelWelcomeEmail";
import { jouwTafelSettingsPath, jouwTafelStartPath, type Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import { joinCityNames } from "@/lib/email/format-cities";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { jouwTafelWelcomeSubject } from "@/lib/email/subjects";
import { getJouwTafelEvents } from "@/lib/jouw-tafel/data";
import {
  QUIZ_METADATA_KEY,
  answerCities,
  firstNameFromMetadata,
  isQuizComplete,
  sanitizeQuizState,
} from "@/lib/jouw-tafel/quiz-logic";
import {
  ACCOUNT_WELCOME_DEFAULT_SINCE,
  ACCOUNT_WELCOME_DELAY_MS,
  ACCOUNT_WELCOME_MAX_LOOKBACK_MS,
  accountWelcomeVariant,
  isAccountWelcomeDue,
} from "@/lib/jouw-tafel/welcome-logic";

export type AccountWelcomeResult = { email: string; ok: boolean; variant: "open" | "none" | "skipped" };

function since(): number {
  const raw = process.env.ACCOUNT_WELCOME_SINCE?.trim();
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.parse(ACCOUNT_WELCOME_DEFAULT_SINCE);
}

/**
 * The "Jouw tafel" account welcome: once per account, 30 minutes after the
 * quiz (completedAt in the account's metadata), only when she has no paid
 * booking yet (then it is skipped for good). The account_welcome_emails row
 * is the claim, so a run twice or two runs at once send it once.
 */
export async function sendAccountWelcomeEmails(now: Date = new Date()): Promise<AccountWelcomeResult[]> {
  const db = getDb();
  const nowMs = now.getTime();
  const from = Math.max(since(), nowMs - ACCOUNT_WELCOME_MAX_LOOKBACK_MS);
  const to = nowMs - ACCOUNT_WELCOME_DELAY_MS;
  if (from > to) return [];

  const candidates = (await db.execute(sql`
    select u.id, u.email, u.raw_user_meta_data as meta
    from auth.users u
    where u.email is not null
      and (u.raw_user_meta_data -> ${QUIZ_METADATA_KEY} ->> 'completedAt') ~ '^[0-9]+$'
      and (u.raw_user_meta_data -> ${QUIZ_METADATA_KEY} ->> 'completedAt')::bigint between ${from} and ${to}
      and not exists (select 1 from account_welcome_emails a where a.user_id = u.id)
    limit 50
  `)) as unknown as Array<{ id: string; email: string; meta: Record<string, unknown> | null }>;
  if (candidates.length === 0) return [];

  const { events } = await getJouwTafelEvents();
  const results: AccountWelcomeResult[] = [];
  for (const user of candidates) {
    const meta = user.meta ?? {};
    const state = sanitizeQuizState(meta[QUIZ_METADATA_KEY]);
    if (!isQuizComplete(state.answers) || !isAccountWelcomeDue(state.completedAt, nowMs, since())) continue;
    const email = user.email.trim().toLowerCase();

    const [paid] = (await db.execute(sql`
      select 1 as x from bookings where lower(email) = ${email} and payment_status = 'paid' limit 1
    `)) as unknown as Array<{ x: number }>;
    const locale: Locale = await resolveEmailLocale({ email, userId: user.id });
    const pick = paid ? null : accountWelcomeVariant(answerCities(state.answers), events, nowMs, locale);
    const variant = pick?.variant ?? "skipped";

    const claimed = await db
      .insert(accountWelcomeEmails)
      .values({ userId: user.id, email, variant })
      .onConflictDoNothing()
      .returning({ userId: accountWelcomeEmails.userId });
    if (claimed.length === 0 || !pick) {
      if (claimed.length > 0) results.push({ email, ok: true, variant: "skipped" });
      continue;
    }

    const site = getSiteUrl().replace(/\/$/, "");
    const firstName = state.answers.name?.trim() || firstNameFromMetadata(meta) || undefined;
    const ok = await sendSimpleEmail({
      to: email,
      subject: jouwTafelWelcomeSubject(firstName, locale),
      element: JouwTafelWelcomeEmail({
        locale,
        firstName,
        variant: pick.variant,
        cities: joinCityNames(pick.cities, locale),
        kiesUrl: `${site}${jouwTafelStartPath(locale)}?stap=kies`,
        settingsUrl: `${site}${jouwTafelSettingsPath(locale)}`,
      }),
    }).catch(() => false);
    if (!ok) await db.delete(accountWelcomeEmails).where(eq(accountWelcomeEmails.userId, user.id));
    results.push({ email, ok, variant: pick.variant });
  }
  return results;
}
