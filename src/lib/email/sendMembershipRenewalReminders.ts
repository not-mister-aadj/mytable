import type { ReactElement } from "react";
import { and, eq, gt, isNotNull, lte, or, ne } from "drizzle-orm";
import { MembershipRenewalReminderEmail } from "@/emails/MembershipRenewalReminderEmail";
import { getDb, isDbConfigured } from "@/db/index";
import { clubMemberships, type ClubPlanId } from "@/db/schema";
import { clubmemberPath, type Locale } from "@/i18n/config";
import { CLUB_PLAN_PRICING, isClubPlanId } from "@/lib/club/plan-pricing";
import { getSiteUrl } from "@/lib/env";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  getTransactionalEmailBcc,
  isEmailConfigured,
} from "@/lib/email/resend";
import { resolveEmailLocale } from "@/lib/email/resolve-email-locale";
import { membershipRenewalReminderSubject } from "@/lib/email/subjects";
import {
  amsterdamDateIso,
  formatSundayTableDate,
  getNextSundayWineTable,
} from "@/lib/sunday-wine-table";

function daysFromNowIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return amsterdamDateIso(d);
}

function firstNameFrom(name: string | null): string | undefined {
  const trimmed = name?.trim();
  if (!trimmed) return undefined;
  return trimmed.split(/\s+/)[0];
}

function formatRenewalDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatPlanAmount(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "nl-NL" : "nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function planCopy(planId: ClubPlanId, locale: Locale) {
  const pricing = CLUB_PLAN_PRICING[planId];
  return {
    label: locale === "en" ? pricing.nameEn : pricing.nameNl,
    amount: formatPlanAmount(pricing.amountCents, locale),
  };
}

async function sendSimpleEmail(input: {
  to: string;
  subject: string;
  element: ReactElement;
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const resend = getResendClient();
  if (!resend) return false;
  const { html, text } = await renderEmailForDelivery(input.element);
  const bcc = getTransactionalEmailBcc().filter(
    (address) => address.toLowerCase() !== input.to.toLowerCase(),
  );
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to: input.to,
    bcc: bcc.length > 0 ? bcc : undefined,
    subject: input.subject,
    html,
    text,
  });
  return !error;
}

/**
 * Email members whose access/period ends in 7 days (Amsterdam date).
 * - 1m prepaid trial: ending soon / continue email (even if cancelAtPeriodEnd).
 * - Longer auto-renew plans: renewal reminder (only if still set to renew).
 * Idempotent per billing period via renewalReminderPeriodEnd.
 */
export async function sendMembershipRenewalReminders(): Promise<number> {
  if (!isDbConfigured() || !isEmailConfigured()) return 0;

  const db = getDb();
  const now = new Date();
  const targetDateIso = daysFromNowIso(7);
  const windowEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  const candidates = await db
    .select()
    .from(clubMemberships)
    .where(
      and(
        eq(clubMemberships.status, "active"),
        isNotNull(clubMemberships.currentPeriodEnd),
        gt(clubMemberships.currentPeriodEnd, now),
        lte(clubMemberships.currentPeriodEnd, windowEnd),
        or(
          eq(clubMemberships.planId, "1m"),
          and(
            ne(clubMemberships.planId, "1m"),
            eq(clubMemberships.cancelAtPeriodEnd, false),
          ),
        ),
      ),
    );

  let sent = 0;
  const site = getSiteUrl().replace(/\/$/, "");
  const nextTable = getNextSundayWineTable(now);
  const nextTableSoonMs = 10 * 24 * 60 * 60 * 1000;

  for (const row of candidates) {
    const periodEnd = row.currentPeriodEnd;
    if (!periodEnd) continue;
    if (amsterdamDateIso(periodEnd) !== targetDateIso) continue;
    if (
      row.renewalReminderPeriodEnd &&
      row.renewalReminderPeriodEnd.getTime() === periodEnd.getTime()
    ) {
      continue;
    }
    if (!isClubPlanId(row.planId)) continue;

    const locale = await resolveEmailLocale({
      email: row.email,
      userId: row.userId,
      fallbackLocale: row.locale,
    });
    const { label, amount } = planCopy(row.planId, locale);
    const renewalDateLabel = formatRenewalDate(periodEnd, locale);
    const manageUrl = `${site}${clubmemberPath(locale)}`;
    // Prepaid trial (no Stripe sub) gets the continue email; legacy renewing 1m gets renewal copy.
    const variant =
      row.planId === "1m" && !row.stripeSubscriptionId
        ? "trial_upsell"
        : "renewal";
    const plan1m = planCopy("1m", locale);
    const plan5m = planCopy("5m", locale);
    const plan12m = planCopy("12m", locale);
    const nextTableDateLabel = formatSundayTableDate(nextTable, locale);
    const nextTableIsSoon =
      nextTable.getTime() - now.getTime() <= nextTableSoonMs &&
      nextTable.getTime() > now.getTime();

    const ok = await sendSimpleEmail({
      to: row.email,
      subject: membershipRenewalReminderSubject(
        renewalDateLabel,
        locale,
        variant,
      ),
      element: MembershipRenewalReminderEmail({
        locale,
        firstName: firstNameFrom(row.name),
        variant,
        planLabel: label,
        amountLabel: amount,
        renewalDateLabel,
        manageUrl,
        nextTableDateLabel,
        nextTableIsSoon,
        plan1mTotalLabel: plan1m.amount,
        plan5mTotalLabel: plan5m.amount,
        plan12mTotalLabel: plan12m.amount,
        plan5mPerMonthLabel: formatPlanAmount(
          Math.round(CLUB_PLAN_PRICING["5m"].amountCents / 5),
          locale,
        ),
        plan12mPerMonthLabel: formatPlanAmount(
          Math.round(CLUB_PLAN_PRICING["12m"].amountCents / 12),
          locale,
        ),
      }),
    });

    if (!ok) continue;

    await db
      .update(clubMemberships)
      .set({
        renewalReminderPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(clubMemberships.id, row.id));

    sent += 1;
  }

  return sent;
}
