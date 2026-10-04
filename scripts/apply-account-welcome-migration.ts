/**
 * Applies drizzle/0032_account_welcome_emails.sql (one welcome mail per
 * "Jouw tafel" account). Idempotent.
 *
 *   npx tsx scripts/apply-account-welcome-migration.ts
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
  const file = "0032_account_welcome_emails.sql";
  const migration = readFileSync(join(process.cwd(), "drizzle", file), "utf8");
  await sql.unsafe(migration);
  console.log(`OK: ${file} applied`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
