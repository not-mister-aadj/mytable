import { SundayTableWaitlistWelcomeEmail } from "@/emails/SundayTableWaitlistWelcomeEmail";
import type { Locale } from "@/i18n/config";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { sundayTableWaitlistWelcomeSubject } from "@/lib/email/subjects";

/** "You're on the list" confirmation — fired once, on first waitlist signup. */
export async function sendSundayTableWaitlistWelcomeEmail(input: {
  to: string;
  locale: Locale;
  firstName?: string;
  /** Every city this signup joined the waitlist for, not just one. */
  cities: string[];
  /** Usually unknown at this point — the enrichment questions haven't been
   * asked yet — in which case both WhatsApp groups are offered. */
  gender?: "female" | "male" | "other" | "unspecified";
}): Promise<boolean> {
  return sendSimpleEmail({
    to: input.to,
    subject: sundayTableWaitlistWelcomeSubject(input.cities, input.locale),
    element: SundayTableWaitlistWelcomeEmail({
      locale: input.locale,
      firstName: input.firstName,
      cities: input.cities,
      gender: input.gender,
    }),
  });
}
