import { SundayTableWaitlistWelcomeEmail } from "@/emails/SundayTableWaitlistWelcomeEmail";
import type { Locale } from "@/i18n/config";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { sundayTableWaitlistWelcomeSubject } from "@/lib/email/subjects";

/** "You're on the list" confirmation — fired once, on first waitlist signup. */
export async function sendSundayTableWaitlistWelcomeEmail(input: {
  to: string;
  locale: Locale;
  firstName?: string;
  city: string;
}): Promise<boolean> {
  return sendSimpleEmail({
    to: input.to,
    subject: sundayTableWaitlistWelcomeSubject(input.city, input.locale),
    element: SundayTableWaitlistWelcomeEmail({
      locale: input.locale,
      firstName: input.firstName,
      city: input.city,
    }),
  });
}
