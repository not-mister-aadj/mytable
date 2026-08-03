import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  customers,
  sundayTableSignups,
  type SundayTableSignupProfile,
} from "@/db/schema";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { ACTIVE_ONBOARDING_CITIES } from "@/lib/member-onboarding";
import {
  amsterdamDateIso,
  getSundayWineTablesForHorizon,
} from "@/lib/sunday-wine-table";
export {
  decodeSundayTableSlug,
  encodeSundayTableSlug,
  type SundayTableAdminRow,
  type SundayTableKey,
  type SundayTableMemberRow,
  type SundayTableType,
} from "@/lib/sunday-table-shared";
import type {
  SundayTableAdminRow,
  SundayTableKey,
  SundayTableMemberRow,
  SundayTableType,
} from "@/lib/sunday-table-shared";

function asProfile(
  value: SundayTableSignupProfile | null | undefined,
): SundayTableSignupProfile | null {
  if (!value || typeof value !== "object") return null;
  return value;
}

function normalizeTableDate(value: string | Date): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return amsterdamDateIso(value);
}

export async function createSundayTableSignup(input: {
  email: string;
  name?: string | null;
  city: string;
  tableDate: string;
  tableType: SundayTableType;
  planId: string;
  locale: string;
  userId?: string | null;
  profile?: SundayTableSignupProfile | null;
}): Promise<{ id: string; alreadySignedUp: boolean }> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || null;

  const { id: customerId } = await upsertCustomerFromEmail({
    email,
    customerName: name || undefined,
    language: input.locale,
    preferredCity: input.city,
  });

  const existing = await db
    .select({ id: sundayTableSignups.id })
    .from(sundayTableSignups)
    .where(
      and(
        sql`lower(${sundayTableSignups.email}) = ${email}`,
        eq(sundayTableSignups.city, input.city),
        eq(sundayTableSignups.tableDate, input.tableDate),
        eq(sundayTableSignups.tableType, input.tableType),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(sundayTableSignups)
      .set({
        name,
        planId: input.planId,
        locale: input.locale,
        userId: input.userId ?? null,
        customerId,
        profile: input.profile ?? null,
      })
      .where(eq(sundayTableSignups.id, existing[0].id));
    return { id: existing[0].id, alreadySignedUp: true };
  }

  const [row] = await db
    .insert(sundayTableSignups)
    .values({
      email,
      name,
      city: input.city,
      tableDate: input.tableDate,
      tableType: input.tableType,
      planId: input.planId,
      locale: input.locale,
      userId: input.userId ?? null,
      customerId,
      profile: input.profile ?? null,
    })
    .returning({ id: sundayTableSignups.id });

  return { id: row!.id, alreadySignedUp: false };
}

export async function getSundayTablesForAdmin(
  horizonMonths = 4,
): Promise<SundayTableAdminRow[]> {
  const db = getDb();
  const upcomingDates = getSundayWineTablesForHorizon(horizonMonths);
  const upcomingIso = upcomingDates.map(amsterdamDateIso);
  const todayIso = amsterdamDateIso(new Date());

  const signupRows = await db
    .select({
      city: sundayTableSignups.city,
      tableDate: sundayTableSignups.tableDate,
      tableType: sundayTableSignups.tableType,
      planId: sundayTableSignups.planId,
      status: sundayTableSignups.status,
      plusOne: sundayTableSignups.plusOne,
      createdAt: sundayTableSignups.createdAt,
    })
    .from(sundayTableSignups)
    .where(gte(sundayTableSignups.tableDate, todayIso))
    .orderBy(asc(sundayTableSignups.tableDate));

  const pastWithSignups = await db
    .select({
      city: sundayTableSignups.city,
      tableDate: sundayTableSignups.tableDate,
      tableType: sundayTableSignups.tableType,
      planId: sundayTableSignups.planId,
      status: sundayTableSignups.status,
      plusOne: sundayTableSignups.plusOne,
      createdAt: sundayTableSignups.createdAt,
    })
    .from(sundayTableSignups)
    .where(sql`${sundayTableSignups.tableDate} < ${todayIso}`)
    .orderBy(desc(sundayTableSignups.tableDate));

  const countMap = new Map<string, SundayTableAdminRow>();

  function bump(row: {
    city: string;
    tableDate: string;
    tableType: string;
    planId: string;
    status: string;
    plusOne: boolean;
    createdAt: Date;
  }) {
    if (row.tableType !== "girls_only" && row.tableType !== "mixed") return;
    if (row.status !== "confirmed") return;
    const key = `${row.city}__${row.tableDate}__${row.tableType}`;
    const existing = countMap.get(key);
    const createdAt = row.createdAt.toISOString();
    const seats = 1 + (row.plusOne ? 1 : 0);
    if (!existing) {
      countMap.set(key, {
        city: row.city,
        tableDate: row.tableDate,
        tableType: row.tableType,
        signupCount: 1,
        seatCount: seats,
        planBreakdown: { [row.planId]: 1 },
        latestSignupAt: createdAt,
      });
      return;
    }
    existing.signupCount += 1;
    existing.seatCount += seats;
    existing.planBreakdown[row.planId] =
      (existing.planBreakdown[row.planId] ?? 0) + 1;
    if (!existing.latestSignupAt || createdAt > existing.latestSignupAt) {
      existing.latestSignupAt = createdAt;
    }
  }

  for (const row of [...signupRows, ...pastWithSignups]) {
    bump({
      ...row,
      tableDate: normalizeTableDate(row.tableDate),
    });
  }

  const tableTypes: SundayTableType[] = ["girls_only", "mixed"];
  const out: SundayTableAdminRow[] = [];

  for (const dateIso of upcomingIso) {
    for (const city of ACTIVE_ONBOARDING_CITIES) {
      for (const tableType of tableTypes) {
        const key = `${city}__${dateIso}__${tableType}`;
        const existing = countMap.get(key);
        out.push(
          existing ?? {
            city,
            tableDate: dateIso,
            tableType,
            signupCount: 0,
            seatCount: 0,
            planBreakdown: {},
            latestSignupAt: null,
          },
        );
        countMap.delete(key);
      }
    }
  }

  const extras = [...countMap.values()].sort((a, b) => {
    if (a.tableDate !== b.tableDate) {
      return b.tableDate.localeCompare(a.tableDate);
    }
    if (a.city !== b.city) return a.city.localeCompare(b.city);
    return a.tableType.localeCompare(b.tableType);
  });

  return [...out, ...extras];
}

export async function getSundayTableMembers(
  key: SundayTableKey,
): Promise<SundayTableMemberRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: sundayTableSignups.id,
      email: sundayTableSignups.email,
      name: sundayTableSignups.name,
      planId: sundayTableSignups.planId,
      locale: sundayTableSignups.locale,
      status: sundayTableSignups.status,
      plusOne: sundayTableSignups.plusOne,
      profile: sundayTableSignups.profile,
      customerId: sundayTableSignups.customerId,
      customerFirstName: customers.firstName,
      createdAt: sundayTableSignups.createdAt,
    })
    .from(sundayTableSignups)
    .leftJoin(customers, eq(sundayTableSignups.customerId, customers.id))
    .where(
      and(
        eq(sundayTableSignups.city, key.city),
        eq(sundayTableSignups.tableDate, key.tableDate),
        eq(sundayTableSignups.tableType, key.tableType),
      ),
    )
    .orderBy(asc(sundayTableSignups.createdAt));

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name?.trim() || row.customerFirstName?.trim() || null,
    planId: row.planId,
    locale: row.locale,
    status: row.status,
    plusOne: row.plusOne,
    profile: asProfile(row.profile),
    customerId: row.customerId,
    createdAt: row.createdAt.toISOString(),
  }));
}
