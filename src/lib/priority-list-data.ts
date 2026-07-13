import { and, desc, eq, sql } from "drizzle-orm";
import { customers, waitlistSignups } from "@/db/schema";
import { getDb } from "@/db/index";
import { recalculateCustomerStats } from "@/lib/customers/stats";

export type PriorityListSignupRow = {
  email: string;
  name: string | null;
  cities: string[];
  locale: string;
  createdAt: string;
};

export async function getPriorityListSignups(): Promise<PriorityListSignupRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      email: waitlistSignups.email,
      city: waitlistSignups.city,
      locale: waitlistSignups.locale,
      name: waitlistSignups.name,
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
    const existing = grouped.get(email);

    if (!existing) {
      grouped.set(email, {
        email: row.email,
        name,
        cities: [row.city],
        locale: row.locale,
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
    if (row.createdAt.toISOString() < existing.createdAt) {
      existing.createdAt = row.createdAt.toISOString();
    }
  }

  return [...grouped.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function priorityListRowsToExcelCsv(rows: PriorityListSignupRow[]): string {
  const header = ["Naam", "E-mail", "Steden", "Taal", "Aangemeld op"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) =>
      [
        row.name ?? "",
        row.email,
        row.cities.join(", "),
        row.locale.toUpperCase(),
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
