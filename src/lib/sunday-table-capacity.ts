import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { sundayTableSignups } from "@/db/schema";
import {
  seatStatsKey,
  SUNDAY_TABLE_DEFAULT_CAPACITY,
} from "@/lib/sunday-table-seat-key";

export {
  seatStatsKey,
  SUNDAY_TABLE_DEFAULT_CAPACITY,
} from "@/lib/sunday-table-seat-key";

export type SundayTableSeatStats = {
  city: string;
  tableDate: string;
  tableType: string;
  seatCount: number;
  capacity: number;
  seatsLeft: number;
};

/** Confirmed seats for one table (1 + plus_one). */
export async function getSundayTableSeatStats(input: {
  city: string;
  tableDate: string;
  tableType: string;
  capacity?: number;
}): Promise<SundayTableSeatStats> {
  const capacity = input.capacity ?? SUNDAY_TABLE_DEFAULT_CAPACITY;
  if (!isDbConfigured()) {
    return {
      city: input.city,
      tableDate: input.tableDate,
      tableType: input.tableType,
      seatCount: 0,
      capacity,
      seatsLeft: capacity,
    };
  }

  const db = getDb();
  const rows = await db
    .select({
      plusOne: sundayTableSignups.plusOne,
    })
    .from(sundayTableSignups)
    .where(
      and(
        eq(sundayTableSignups.city, input.city),
        eq(sundayTableSignups.tableDate, input.tableDate),
        eq(sundayTableSignups.tableType, input.tableType),
        eq(sundayTableSignups.status, "confirmed"),
      ),
    );

  const seatCount = rows.reduce((sum, row) => sum + (row.plusOne ? 2 : 1), 0);
  return {
    city: input.city,
    tableDate: input.tableDate,
    tableType: input.tableType,
    seatCount,
    capacity,
    seatsLeft: Math.max(0, capacity - seatCount),
  };
}

/** Batch seat stats for many tables. */
export async function getSundayTableSeatStatsBatch(
  keys: Array<{ city: string; tableDate: string; tableType: string }>,
  capacity = SUNDAY_TABLE_DEFAULT_CAPACITY,
): Promise<Map<string, SundayTableSeatStats>> {
  const map = new Map<string, SundayTableSeatStats>();
  for (const key of keys) {
    map.set(seatStatsKey(key.city, key.tableDate, key.tableType), {
      ...key,
      seatCount: 0,
      capacity,
      seatsLeft: capacity,
    });
  }
  if (!isDbConfigured() || keys.length === 0) return map;

  const db = getDb();
  const cities = [...new Set(keys.map((k) => k.city))];
  const dates = [...new Set(keys.map((k) => k.tableDate))];

  const rows = await db
    .select({
      city: sundayTableSignups.city,
      tableDate: sundayTableSignups.tableDate,
      tableType: sundayTableSignups.tableType,
      plusOne: sundayTableSignups.plusOne,
    })
    .from(sundayTableSignups)
    .where(
      and(
        inArray(sundayTableSignups.city, cities),
        inArray(sundayTableSignups.tableDate, dates),
        eq(sundayTableSignups.status, "confirmed"),
      ),
    );

  for (const row of rows) {
    const date =
      typeof row.tableDate === "string"
        ? row.tableDate.slice(0, 10)
        : String(row.tableDate).slice(0, 10);
    const key = seatStatsKey(row.city, date, row.tableType);
    const current = map.get(key);
    if (!current) continue;
    const nextCount = current.seatCount + (row.plusOne ? 2 : 1);
    map.set(key, {
      ...current,
      seatCount: nextCount,
      seatsLeft: Math.max(0, capacity - nextCount),
    });
  }

  return map;
}

/** SQL helper unused externally but keeps drizzle import used when needed. */
export const sundayTableConfirmedSeatSql = sql`case when ${sundayTableSignups.plusOne} then 2 else 1 end`;
