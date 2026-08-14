import { desc, eq, sql } from "drizzle-orm";
import { customers, waitlistSignups } from "@/db/schema";
import { getDb } from "@/db/index";
import { recalculateCustomerStats } from "@/lib/customers/stats";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";

export type PriorityListSignupRow = {
  email: string;
  name: string | null;
  cities: string[];
  locale: string;
  preferences: WaitlistPreferences | null;
  createdAt: string;
};

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
  const cities = Array.isArray(value.cities)
    ? value.cities.filter((item): item is string => typeof item === "string")
    : [];
  const gender = Array.isArray(value.gender)
    ? value.gender.filter((item): item is string => typeof item === "string")
    : [];
  const ageRange = Array.isArray(value.ageRange)
    ? value.ageRange.filter((item): item is string => typeof item === "string")
    : [];
  const vibe = Array.isArray(value.vibe)
    ? value.vibe.filter((item): item is string => typeof item === "string")
    : [];
  const budget = Array.isArray(value.budget)
    ? value.budget.filter((item): item is string => typeof item === "string")
    : [];
  const experience = Array.isArray(value.experience)
    ? value.experience.filter((item): item is string => typeof item === "string")
    : [];
  const whyOther =
    typeof value.whyOther === "string" ? value.whyOther : "";
  if (
    !interests.length &&
    !why.length &&
    !company.length &&
    !tableType.length &&
    !cities.length &&
    !gender.length &&
    !ageRange.length &&
    !vibe.length &&
    !budget.length &&
    !experience.length &&
    !whyOther
  ) {
    return null;
  }
  return {
    interests: interests as WaitlistPreferences["interests"],
    priceRanges: {},
    why: why as WaitlistPreferences["why"],
    company: company as WaitlistPreferences["company"],
    joinIntent: [],
    tableType: tableType as WaitlistPreferences["tableType"],
    cities,
    regionFlexible: Boolean(value.regionFlexible),
    gender: gender as WaitlistPreferences["gender"],
    ageRange: ageRange as WaitlistPreferences["ageRange"],
    vibe: vibe as WaitlistPreferences["vibe"],
    budget: budget as WaitlistPreferences["budget"],
    experience: experience as WaitlistPreferences["experience"],
    whyOther,
  };
}

/** All waitlist signups — "priority_list" was retired as a separate
 * category (drizzle/0020), so this is every row regardless of how someone
 * joined (LP modal, format pages, or the girls-only checkout opt-in). */
export async function getPriorityListSignups(): Promise<PriorityListSignupRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      email: waitlistSignups.email,
      city: waitlistSignups.city,
      locale: waitlistSignups.locale,
      name: waitlistSignups.name,
      preferences: waitlistSignups.preferences,
      customerFirstName: customers.firstName,
      createdAt: waitlistSignups.createdAt,
    })
    .from(waitlistSignups)
    .leftJoin(customers, eq(waitlistSignups.customerId, customers.id))
    .orderBy(desc(waitlistSignups.createdAt));

  const grouped = new Map<string, PriorityListSignupRow>();

  for (const row of rows) {
    const email = row.email.toLowerCase();
    const name = row.name?.trim() || row.customerFirstName?.trim() || null;
    const preferences = asPreferences(row.preferences);
    const existing = grouped.get(email);

    if (!existing) {
      grouped.set(email, {
        email: row.email,
        name,
        cities: [row.city],
        locale: row.locale,
        preferences,
        createdAt: row.createdAt.toISOString(),
      });
      continue;
    }

    if (!existing.cities.includes(row.city)) {
      existing.cities.push(row.city);
    }
    if (!existing.name && name) {
      existing.name = name;
    }
    if (!existing.preferences && preferences) {
      existing.preferences = preferences;
    }
    if (row.createdAt.toISOString() < existing.createdAt) {
      existing.createdAt = row.createdAt.toISOString();
    }
  }

  return [...grouped.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// CSV export moved to src/lib/priority-list-csv.ts (client-safe \u2014 no
// drizzle/db imports \u2014 so the browser can build the same export straight
// from whatever's currently filtered on screen).

export async function removePriorityListSignupByEmail(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const db = getDb();

  const rows = await db
    .select({
      id: waitlistSignups.id,
      customerId: waitlistSignups.customerId,
    })
    .from(waitlistSignups)
    .where(sql`lower(${waitlistSignups.email}) = ${normalized}`);

  if (rows.length === 0) return 0;

  await db
    .delete(waitlistSignups)
    .where(sql`lower(${waitlistSignups.email}) = ${normalized}`);

  const customerIds = [
    ...new Set(rows.map((row) => row.customerId).filter(Boolean)),
  ] as string[];

  for (const customerId of customerIds) {
    await recalculateCustomerStats(customerId);
  }

  return rows.length;
}
