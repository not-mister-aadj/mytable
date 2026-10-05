/**
 * Applies drizzle/0033_jouw_tafel_series.sql and 0034 ("Jouw tafel" Sunday Table
 * series, pauses and skipped dates, plus the agreed start). Idempotent.
 *
 *   npx tsx scripts/apply-jouw-tafel-series-migration.ts
 *
 * Uses DATABASE_URL from .env.local. For production, run the same SQL file
 * in the Supabase SQL editor of the production project before merging.
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, onnotice: () => {} });

async function main() {
  const files = ["0033_jouw_tafel_series.sql", "0034_jouw_tafel_always_bookable.sql", "0035_jouw_tafel_booking_window.sql", "0036_event_groups.sql", "0037_attribution.sql"];
  for (const file of files) {
    const migration = readFileSync(join(process.cwd(), "drizzle", file), "utf8");
    await sql.unsafe(migration);
    console.log(`OK: ${file} applied`);
  }
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
