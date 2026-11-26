import { SundayTableWaitlistWelcomeEmail } from "@/emails/SundayTableWaitlistWelcomeEmail";
import { jouwTafelKiesPath, jouwTafelLogInPath, type Locale } from "@/i18n/config";
import { ensureAuthUserForEmail } from "@/lib/auth/ensure-auth-user-for-email";
import { mailLoginUrl } from "@/lib/auth/mail-login";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { sundayTableWaitlistWelcomeSubject } from "@/lib/email/subjects";
import { getSiteUrl } from "@/lib/env";

/**
 * "Welkom bij Sunday Social": fired once, when the waitlist questions are
 * done. The button signs them in and opens "Kies je zondag", their account's
 * page with the tables in their cities (their waitlist answers move into the
 * account on the way, so the quiz only asks what they skipped). The silent
 * account is made here if it isn't there yet; without one the button goes
 * to the log-in screen, with "Kies je zondag" kept for after.
 */
export async function sendSundayTableWaitlistWelcomeEmail(input: {
  to: string;
  locale: Locale;
  firstName?: string;
  /** Every city this signup joined the waitlist for, not just one. */
  cities: string[];
  gender?: "female" | "male" | "other" | "unspecified";
}): Promise<boolean> {
  const tables = jouwTafelKiesPath(input.locale);
  const account = await ensureAuthUserForEmail({
    email: input.to,
    name: input.firstName ?? null,
    source: "waitlist",
    city: input.cities[0] ?? null,
    locale: input.locale,
  }).catch(() => ({ exists: false }));
  const tablesUrl = account.exists
    ? await mailLoginUrl(input.to, tables)
    : `${getSiteUrl().replace(/\/$/, "")}${jouwTafelLogInPath(input.locale)}?naar=${encodeURIComponent(tables)}`;
  return sendSimpleEmail({
    to: input.to,
    subject: sundayTableWaitlistWelcomeSubject(input.cities, input.locale),
    element: SundayTableWaitlistWelcomeEmail({
      locale: input.locale,
      firstName: input.firstName,
      cities: input.cities,
      gender: input.gender,
      tablesUrl,
    }),
  });
}
