import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { customers, type Membership } from "@/db/schema";
import { MembershipEmail } from "@/emails/MembershipEmail";
import { jouwTafelKiesPath, jouwTafelSettingsPath } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import { onEmailSent } from "@/lib/customers/hooks";
import { normalizeEmail } from "@/lib/customers/normalize";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import { sendSimpleEmail } from "@/lib/email/send-simple-email";
import { isMembershipPlanId } from "@/lib/membership/plans";
import {
  cancelledMail,
  noShowBlockedMail,
  noShowWarningMail,
  openForEveryoneMail,
  reminderMail,
  welcomeMail,
  type MembershipMail,
} from "@/lib/membership/mail-copy";

type Locale = "nl" | "en";

function links(locale: Locale) {
  const base = getSiteUrl().replace(/\/$/, "");
  return { kies: `${base}${jouwTafelKiesPath(locale)}`, settings: `${base}${jouwTafelSettingsPath(locale)}` };
}

async function recipient(m: Membership): Promise<{ locale: Locale; firstName: string | null; customerId: string | null }> {
  const locale = await resolveEmailLocale({ email: m.email, userId: m.userId, fallbackLocale: m.locale });
  const [customer] = await getDb()
    .select({ id: customers.id, firstName: customers.firstName })
    .from(customers)
    .where(eq(customers.emailNormalized, normalizeEmail(m.email)))
    .limit(1);
  return { locale, firstName: customer?.firstName ?? null, customerId: customer?.id ?? m.customerId ?? null };
}

async function send(to: string, mail: MembershipMail, customerId: string | null, label: string): Promise<boolean> {
  const ok = await sendSimpleEmail({ to, subject: mail.subject, element: MembershipEmail(mail.props) });
  if (ok && customerId) {
    await onEmailSent({ customerId, subject: label }).catch(() => undefined);
  }
  return ok;
}

export async function sendMembershipWelcomeEmail(m: Membership, bookedSunday: Date | null): Promise<boolean> {
  if (!isMembershipPlanId(m.plan)) return false;
  const r = await recipient(m);
  const mail = welcomeMail({ locale: r.locale, firstName: r.firstName, plan: m.plan, bookedSunday, links: links(r.locale) });
  return send(m.email, mail, r.customerId, "Lidmaatschap: welkom");
}

export async function sendMembershipReminderEmail(m: Membership): Promise<boolean> {
  if (!isMembershipPlanId(m.plan) || !m.initialPeriodEnd) return false;
  const r = await recipient(m);
  const mail = reminderMail({ locale: r.locale, firstName: r.firstName, plan: m.plan, from: m.initialPeriodEnd, links: links(r.locale) });
  return send(m.email, mail, r.customerId, "Lidmaatschap: loopt per maand door");
}

export async function sendMembershipCancelledEmail(m: Membership, until: Date): Promise<boolean> {
  const r = await recipient(m);
  const mail = cancelledMail({ locale: r.locale, firstName: r.firstName, until, links: links(r.locale) });
  return send(m.email, mail, r.customerId, "Lidmaatschap: opzegging bevestigd");
}

export async function sendNoShowWarningEmail(m: Membership, sunday: Date): Promise<boolean> {
  const r = await recipient(m);
  const mail = noShowWarningMail({ locale: r.locale, firstName: r.firstName, sunday, links: links(r.locale) });
  return send(m.email, mail, r.customerId, "Lidmaatschap: niet gekomen (waarschuwing)");
}

export async function sendNoShowBlockedEmail(m: Membership, sunday: Date, until: Date): Promise<boolean> {
  const r = await recipient(m);
  const mail = noShowBlockedMail({ locale: r.locale, firstName: r.firstName, sunday, until, links: links(r.locale) });
  return send(m.email, mail, r.customerId, "Lidmaatschap: niet gekomen (maand niet boeken)");
}

export async function sendOpenForEveryoneEmail(input: {
  email: string;
  fallbackLocale: string;
  city: string;
  sunday: Date;
}): Promise<boolean> {
  const locale = await resolveEmailLocale({ email: input.email, fallbackLocale: input.fallbackLocale });
  const mail = openForEveryoneMail({ locale, city: input.city, sunday: input.sunday, links: links(locale) });
  return sendSimpleEmail({ to: input.email, subject: mail.subject, element: MembershipEmail(mail.props) });
}
