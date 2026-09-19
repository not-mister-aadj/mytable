import { and, asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db/index";
import { sundayTableLocations } from "@/db/schema";
import type { SundayTableKey, SundayTableType } from "@/lib/sunday-table-shared";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";

export type SundayTableLocation = {
  id: string;
  city: string;
  tableDate: string;
  tableType: SundayTableType;
  venueName: string;
  address: string;
  notes: string | null;
  updatedAt: string;
};

function normalizeDate(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapRow(row: typeof sundayTableLocations.$inferSelect): SundayTableLocation {
  return {
    id: row.id,
    city: row.city,
    tableDate: normalizeDate(row.tableDate),
    tableType:
      row.tableType === "girls_only" || row.tableType === "mixed"
        ? row.tableType
        : "mixed",
    venueName: row.venueName,
    address: row.address,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSundayTableLocation(
  key: SundayTableKey,
): Promise<SundayTableLocation | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(sundayTableLocations)
    .where(
      and(
        eq(sundayTableLocations.city, key.city),
        eq(sundayTableLocations.tableDate, key.tableDate),
        eq(sundayTableLocations.tableType, key.tableType),
      ),
    )
    .limit(1);

  return row ? mapRow(row) : null;
}

/** Nearest upcoming Sunday Table (today or later), optionally scoped to one city. */
export async function getNextSundayTableLocation(
  city?: string,
): Promise<SundayTableLocation | null> {
  const db = getDb();
  const todayIso = amsterdamDateIso(new Date());
  const conditions = [gte(sundayTableLocations.tableDate, todayIso)];
  if (city) conditions.push(eq(sundayTableLocations.city, city));

  const [row] = await db
    .select()
    .from(sundayTableLocations)
    .where(and(...conditions))
    .orderBy(asc(sundayTableLocations.tableDate))
    .limit(1);

  return row ? mapRow(row) : null;
}

/** All upcoming Sunday Tables (today or later), soonest first, optionally scoped to one city. */
export async function getUpcomingSundayTableLocations(
  city?: string,
): Promise<SundayTableLocation[]> {
  const db = getDb();
  const todayIso = amsterdamDateIso(new Date());
  const conditions = [gte(sundayTableLocations.tableDate, todayIso)];
  if (city) conditions.push(eq(sundayTableLocations.city, city));

  const rows = await db
    .select()
    .from(sundayTableLocations)
    .where(and(...conditions))
    .orderBy(asc(sundayTableLocations.tableDate));

  return rows.map(mapRow);
}

export async function upsertSundayTableLocation(input: {
  city: string;
  tableDate: string;
  tableType: SundayTableType;
  venueName: string;
  address: string;
  notes?: string | null;
}): Promise<SundayTableLocation> {
  const db = getDb();
  const venueName = input.venueName.trim();
  const address = input.address.trim();
  const notes = input.notes?.trim() || null;
  if (!venueName || !address) {
    throw new Error("Venue name and address are required");
  }

  const existing = await getSundayTableLocation(input);
  if (existing) {
    const [updated] = await db
      .update(sundayTableLocations)
      .set({
        venueName,
        address,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(sundayTableLocations.id, existing.id))
      .returning();
    return mapRow(updated!);
  }

  const [created] = await db
    .insert(sundayTableLocations)
    .values({
      city: input.city,
      tableDate: input.tableDate,
      tableType: input.tableType,
      venueName,
      address,
      notes,
    })
    .returning();

  return mapRow(created!);
}
