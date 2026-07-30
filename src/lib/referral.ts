import { and, eq, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import {
  clubMemberships,
  referralAttributions,
  referralCodes,
  sundayTableSignups,
} from "@/db/schema";
import { getSiteUrl } from "@/lib/env";
import type { Locale } from "@/i18n/config";
import { joinPath } from "@/i18n/config";
import { PostHogEvents } from "@/lib/posthog/events";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]!;
  }
  return out;
}

export async function getOrCreateReferralCode(input: {
  email: string;
  userId?: string | null;
  membershipId?: string | null;
  locale?: Locale;
}): Promise<{ code: string; shareUrl: string } | null> {
  if (!isDbConfigured()) return null;
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const locale = input.locale ?? "nl";

  const existing = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.email, email))
    .limit(1);

  if (existing[0]) {
    return {
      code: existing[0].code,
      shareUrl: referralShareUrl(existing[0].code, locale),
    };
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      const [row] = await db
        .insert(referralCodes)
        .values({
          code,
          email,
          userId: input.userId ?? null,
          membershipId: input.membershipId ?? null,
        })
        .returning();
      if (row) {
        return { code: row.code, shareUrl: referralShareUrl(row.code, locale) };
      }
    } catch {
      // unique collision, retry
    }
  }
  return null;
}

export function referralShareUrl(code: string, locale: Locale): string {
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${joinPath(locale)}?ref=${encodeURIComponent(code)}`;
}

export function whatsappInviteUrl(shareUrl: string, locale: Locale): string {
  const text =
    locale === "en"
      ? `Join me at MyTable Sunday Table. Every first Sunday. New people. Then culinary experiences.\n${shareUrl}`
      : `Kom mee naar MyTable Sunday Table. Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.\n${shareUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Store referral attribution when a new user signs up with ?ref= */
export async function attributeReferralSignup(input: {
  code: string;
  refereeEmail: string;
  refereeUserId?: string | null;
}): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const db = getDb();
  const code = input.code.trim().toUpperCase();
  const refereeEmail = input.refereeEmail.trim().toLowerCase();

  const [ref] = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.code, code))
    .limit(1);
  if (!ref) return false;
  if (ref.email.toLowerCase() === refereeEmail) return false;

  try {
    await db.insert(referralAttributions).values({
      referralCodeId: ref.id,
      refereeEmail,
      refereeUserId: input.refereeUserId ?? null,
      status: "signed_up",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reward referrer when referee shows up (confirmed Sunday Table past date
 * or attended_at set). Cap: 6 rewards / year.
 */
export async function maybeRewardReferralForAttendance(input: {
  refereeEmail: string;
}): Promise<{ rewarded: boolean }> {
  if (!isDbConfigured()) return { rewarded: false };
  const db = getDb();
  const refereeEmail = input.refereeEmail.trim().toLowerCase();

  const [attr] = await db
    .select()
    .from(referralAttributions)
    .where(eq(referralAttributions.refereeEmail, refereeEmail))
    .limit(1);

  if (!attr || attr.rewardedAt || attr.status === "rewarded") {
    return { rewarded: false };
  }

  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);

  const [refCode] = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.id, attr.referralCodeId))
    .limit(1);
  if (!refCode) return { rewarded: false };

  const rewardedThisYear = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referralAttributions)
    .where(
      and(
        eq(referralAttributions.referralCodeId, refCode.id),
        eq(referralAttributions.status, "rewarded"),
        sql`${referralAttributions.rewardedAt} >= ${yearStart.toISOString()}`,
      ),
    );

  if ((rewardedThisYear[0]?.count ?? 0) >= 6) {
    return { rewarded: false };
  }

  await db
    .update(referralAttributions)
    .set({
      status: "rewarded",
      rewardedAt: new Date(),
    })
    .where(eq(referralAttributions.id, attr.id));

  // Referrer reward: +1 month on active membership period (product credit).
  if (refCode.membershipId) {
    await db
      .update(clubMemberships)
      .set({
        currentPeriodEnd: sql`coalesce(${clubMemberships.currentPeriodEnd}, now()) + interval '1 month'`,
      })
      .where(eq(clubMemberships.id, refCode.membershipId));
  } else {
    await db
      .update(clubMemberships)
      .set({
        currentPeriodEnd: sql`coalesce(${clubMemberships.currentPeriodEnd}, now()) + interval '1 month'`,
      })
      .where(
        and(
          eq(clubMemberships.email, refCode.email),
          eq(clubMemberships.status, "active"),
        ),
      );
  }

  return { rewarded: true };
}

/** True when this email signed up via a referral link and is not yet rewarded. */
export async function hasOpenReferralAttribution(
  email: string,
): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const db = getDb();
  const [attr] = await db
    .select({ id: referralAttributions.id })
    .from(referralAttributions)
    .where(
      and(
        eq(referralAttributions.refereeEmail, email.trim().toLowerCase()),
        eq(referralAttributions.status, "signed_up"),
      ),
    )
    .limit(1);
  return Boolean(attr);
}

/** Mark confirmed past Sundays as attended (for reward + lifecycle). */
export async function markPastConfirmedAsAttended(): Promise<number> {
  if (!isDbConfigured()) return 0;
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const updated = await db
    .update(sundayTableSignups)
    .set({ attendedAt: new Date() })
    .where(
      and(
        eq(sundayTableSignups.status, "confirmed"),
        sql`${sundayTableSignups.attendedAt} is null`,
        sql`${sundayTableSignups.tableDate} < ${today}`,
      ),
    )
    .returning({ id: sundayTableSignups.id, email: sundayTableSignups.email });

  for (const row of updated) {
    await maybeRewardReferralForAttendance({ refereeEmail: row.email });
    try {
      const { captureServerEvent } = await import("@/lib/posthog/server");
      void captureServerEvent(row.email, PostHogEvents.sundayShowUp, {
        signup_id: row.id,
      });
    } catch {
      // analytics must not block
    }
  }
  return updated.length;
}
