import { isDbConfigured } from "@/db/index";
import {
  getDbMigrationClient,
  runDbMigrationOnce,
} from "@/lib/db-migration-client";

async function applyBookingColumns(): Promise<void> {
  const sql = getDbMigrationClient();
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seating_preference text`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS table_language_preference text`;
}

/** Idempotent — safe to run before booking writes. Cached per server instance. */
export async function ensureBookingColumns(): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await runDbMigrationOnce("booking-columns", applyBookingColumns);
  } catch (error) {
    console.error("[ensureBookingColumns]", error);
  }
}
