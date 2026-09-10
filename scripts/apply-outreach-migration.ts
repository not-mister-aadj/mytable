/**
 * Creates the outreach tables (prospects, templates, messages, events,
 * activities).
 *
 *   npx tsx scripts/apply-outreach-migration.ts
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

const sql = postgres(url, { prepare: false });

async function main() {
  const file = "0025_outreach.sql";
  const migration = readFileSync(join(process.cwd(), "drizzle", file), "utf8");
  await sql.unsafe(migration);
  console.log(`OK: ${file} applied`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
