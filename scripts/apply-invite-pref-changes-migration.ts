/** Runs drizzle/0071_invite_pref_changes.sql against DATABASE_URL (dev). */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

async function main() {
  await sql.unsafe(readFileSync("drizzle/0071_invite_pref_changes.sql", "utf8"));
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from invite_pref_changes`;
  console.log(`OK: invite_pref_changes ready, ${n} rows`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
