import { isDbConfigured } from "@/db/index";
import { getDbMigrationClient, runDbMigrationOnce } from "@/lib/db-migration-client";

async function applyVenueColumns(): Promise<void> {
  const sql = getDbMigrationClient();
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS latitude text`;
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS longitude text`;
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS image_meta jsonb`;
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS gallery_meta jsonb`;
}

/** Idempotent — safe to run before every venue read/write. */
export async function ensureVenueColumns(): Promise<void> {
  if (!isDbConfigured()) return;
  await runDbMigrationOnce("venue-columns", applyVenueColumns);
}
