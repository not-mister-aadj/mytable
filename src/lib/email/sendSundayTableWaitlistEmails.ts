import { SundayTableWaitlistWelcomeEmail } from "@/emails/SundayTableWaitlistWelcomeEmail";
import { jouwTafelLogInPath, sundayTableLpCityPath, sundayTableLpPath, type Locale } from "@/i18n/config";
import { ensureAuthUserForEmail } from "@/lib/auth/ensure-auth-user-for-email";
import { mailLoginUrl } from "@/lib/auth/mail-login";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { sundayTableWaitlistWelcomeSubject } from "@/lib/email/subjects";
import { sundaySocialSlugFromCity } from "@/lib/sunday-social-cities";
import { getSiteUrl } from "@/lib/env";

/**
 * "Welkom bij Sunday Social": fired once, when the waitlist questions are
 * done. The button signs them in and opens their city's page, which lists
 * every open Sunday with the booking card filled in (several cities: the
 * overview). The silent account is made here if it isn't there yet; without
 * one the button goes to the log-in screen, with that page kept for after.
 */
export async function sendSundayTableWaitlistWelcomeEmail(input: {
  to: string;
  locale: Locale;
  firstName?: string;
  /** Every city this signup joined the waitlist for, not just one. */
  cities: string[];
  gender?: "female" | "male" | "other" | "unspecified";
}): Promise<boolean> {
  const slug = input.cities.length === 1 ? sundaySocialSlugFromCity(input.cities[0]!) : null;
  const tables = slug ? sundayTableLpCityPath(input.locale, slug) : sundayTableLpPath(input.locale);
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
