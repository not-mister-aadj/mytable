import { and, desc, eq, sql } from "drizzle-orm";
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
  if (
    !interests.length &&
    !why.length &&
    !company.length &&
    !tableType.length &&
    !cities.length
  ) {
    return null;
  }
  return {
    interests: interests as WaitlistPreferences["interests"],
    why: why as WaitlistPreferences["why"],
    company: company as WaitlistPreferences["company"],
    tableType: tableType as WaitlistPreferences["tableType"],
    cities,
    regionFlexible: Boolean(value.regionFlexible),
  };
}

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
    .where(eq(waitlistSignups.source, "priority_list"))
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

export function priorityListRowsToExcelCsv(rows: PriorityListSignupRow[]): string {
  const header = [
    "Naam",
    "E-mail",
    "Steden",
    "Taal",
    "Interesses",
    "Waarom",
    "Hoe komen",
    "Type tafel",
    "Flexibel regio",
    "Aangemeld op",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) =>
      [
        row.name ?? "",
        row.email,
        row.cities.join(", "),
        row.locale.toUpperCase(),
        row.preferences?.interests.join(", ") ?? "",
        row.preferences?.why.join(", ") ?? "",
        row.preferences?.company.join(", ") ?? "",
        row.preferences?.tableType.join(", ") ?? "",
        row.preferences?.regionFlexible ? "ja" : "nee",
        new Intl.DateTimeFormat("nl-NL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(row.createdAt)),
      ]
        .map(escape)
        .join(";"),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}

export async function removePriorityListSignupByEmail(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const db = getDb();

  const rows = await db
    .select({
      id: waitlistSignups.id,
      customerId: waitlistSignups.customerId,
    })
    .from(waitlistSignups)
    .where(
      and(
        sql`lower(${waitlistSignups.email}) = ${normalized}`,
        eq(waitlistSignups.source, "priority_list"),
      ),
    );

  if (rows.length === 0) return 0;

  await db
    .delete(waitlistSignups)
    .where(
      and(
        sql`lower(${waitlistSignups.email}) = ${normalized}`,
        eq(waitlistSignups.source, "priority_list"),
      ),
    );

  const customerIds = [
    ...new Set(rows.map((row) => row.customerId).filter(Boolean)),
  ] as string[];

  for (const customerId of customerIds) {
    await recalculateCustomerStats(customerId);
  }

  return rows.length;
}
