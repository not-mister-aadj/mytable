import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { sundayTableLocations } from "@/db/schema";
import type { SundayTableKey, SundayTableType } from "@/lib/sunday-table-shared";

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

  if (!row) return null;
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
    return {
      id: updated!.id,
      city: updated!.city,
      tableDate: normalizeDate(updated!.tableDate),
      tableType:
        updated!.tableType === "girls_only" || updated!.tableType === "mixed"
          ? updated!.tableType
          : "mixed",
      venueName: updated!.venueName,
      address: updated!.address,
      notes: updated!.notes,
      updatedAt: updated!.updatedAt.toISOString(),
    };
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

  return {
    id: created!.id,
    city: created!.city,
    tableDate: normalizeDate(created!.tableDate),
    tableType:
      created!.tableType === "girls_only" || created!.tableType === "mixed"
        ? created!.tableType
        : "mixed",
    venueName: created!.venueName,
    address: created!.address,
    notes: created!.notes,
    updatedAt: created!.updatedAt.toISOString(),
  };
}
