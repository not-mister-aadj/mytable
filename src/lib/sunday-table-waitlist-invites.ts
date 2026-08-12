import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import {
  sundayTableWaitlistInvites,
  waitlistSignups,
} from "@/db/schema";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";
import type { SundayTableKey } from "@/lib/sunday-table-shared";

export type WaitlistInviteCandidate = {
  waitlistId: string;
  email: string;
  name: string | null;
  locale: string;
  preferences: WaitlistPreferences | null;
  createdAt: string;
  alreadyInvited: boolean;
};

/** Same defensive shape-check as src/lib/priority-list-data.ts's asPreferences. */
function asPreferences(
  value: Record<string, unknown> | null | undefined,
): WaitlistPreferences | null {
  if (!value || typeof value !== "object") return null;
  const interests = Array.isArray(value.interests)
    ? value.interests.filter((item): item is string => typeof item === "string")
    : [];
  const why = Array.isArray(value.why)
    ? value.why.filter((item): item is string => typeof item === "string")
    : [];
  const company = Array.isArray(value.company)
    ? value.company.filter((item): item is string => typeof item === "string")
    : [];
  const tableType = Array.isArray(value.tableType)
    ? value.tableType.filter((item): item is string => typeof item === "string")
    : [];
  if (!interests.length && !why.length && !company.length && !tableType.length) {
    return null;
  }
  return {
    interests: interests as WaitlistPreferences["interests"],
    priceRanges: {},
    why: why as WaitlistPreferences["why"],
    company: company as WaitlistPreferences["company"],
    joinIntent: [],
    tableType: tableType as WaitlistPreferences["tableType"],
    cities: [],
    regionFlexible: false,
  };
}

/** Does this candidate's stated preference allow the cohort's table type? */
function matchesTableType(
  preferences: WaitlistPreferences | null,
  tableType: SundayTableKey["tableType"],
): boolean {
  if (!preferences || preferences.tableType.length === 0) return true;
  return (
    preferences.tableType.includes(tableType) ||
    preferences.tableType.includes("no_preference")
  );
}

/** Waitlist rows for this cohort's city, oldest first, with per-cohort invite state. */
export async function getWaitlistInviteCandidates(
  key: SundayTableKey,
  options?: { includeInvited?: boolean; limit?: number },
): Promise<WaitlistInviteCandidate[]> {
  if (!isDbConfigured()) return [];
  const db = getDb();

  const rows = await db
    .select({
      id: waitlistSignups.id,
      email: waitlistSignups.email,
      name: waitlistSignups.name,
      locale: waitlistSignups.locale,
      preferences: waitlistSignups.preferences,
      createdAt: waitlistSignups.createdAt,
      invitedAt: sundayTableWaitlistInvites.sentAt,
    })
    .from(waitlistSignups)
    .leftJoin(
      sundayTableWaitlistInvites,
      and(
        eq(sundayTableWaitlistInvites.waitlistSignupId, waitlistSignups.id),
        eq(sundayTableWaitlistInvites.city, key.city),
        eq(sundayTableWaitlistInvites.tableDate, key.tableDate),
        eq(sundayTableWaitlistInvites.tableType, key.tableType),
      ),
    )
    .where(eq(waitlistSignups.city, key.city))
    .orderBy(waitlistSignups.createdAt);

  const candidates = rows
    .map((row) => ({
      waitlistId: row.id,
      email: row.email,
      name: row.name,
      locale: row.locale,
      preferences: asPreferences(row.preferences),
      createdAt: row.createdAt.toISOString(),
      alreadyInvited: row.invitedAt !== null,
    }))
    .filter((row) => matchesTableType(row.preferences, key.tableType))
    .filter((row) => options?.includeInvited || !row.alreadyInvited);

  return options?.limit ? candidates.slice(0, options.limit) : candidates;
}

export async function getWaitlistInviteStats(
  key: SundayTableKey,
): Promise<{ eligible: number; invited: number; total: number }> {
  const all = await getWaitlistInviteCandidates(key, { includeInvited: true });
  const invited = all.filter((row) => row.alreadyInvited).length;
  return { eligible: all.length - invited, invited, total: all.length };
}

export async function recordWaitlistInviteSent(input: {
  waitlistSignupId: string;
  email: string;
  locale: string;
  key: SundayTableKey;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  await db
    .insert(sundayTableWaitlistInvites)
    .values({
      waitlistSignupId: input.waitlistSignupId,
      city: input.key.city,
      tableDate: input.key.tableDate,
      tableType: input.key.tableType,
      email: input.email,
      locale: input.locale,
    })
    .onConflictDoNothing();
}
