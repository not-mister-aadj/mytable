/**
 * Applies drizzle/0039_booking_birth_date.sql (a booking keeps the date of birth).
 * Idempotent.
 *
 *   npx tsx scripts/apply-booking-birth-date-migration.ts
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
  const file = "0039_booking_birth_date.sql";
  const migration = readFileSync(join(process.cwd(), "drizzle", file), "utf8");
  await sql.unsafe(migration);
  console.log(`OK: ${file} applied`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
