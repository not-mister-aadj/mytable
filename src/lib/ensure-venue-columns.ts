import { sql } from "drizzle-orm";
import type { getDb } from "@/db/index";

/** Idempotent — safe to run before every venue read/write. */
export async function ensureVenueColumns(
  db: ReturnType<typeof getDb>,
): Promise<void> {
  await db.execute(sql`
    ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS latitude text
  `);
  await db.execute(sql`
    ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS longitude text
  `);
  await db.execute(sql`
    ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS image_meta jsonb
  `);
  await db.execute(sql`
    ALTER TABLE venues
    ADD COLUMN IF NOT EXISTS gallery_meta jsonb
  `);
}
