/** Runs drizzle/0070_email_log_template.sql against DATABASE_URL (dev). */
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
  await sql.unsafe(readFileSync("drizzle/0070_email_log_template.sql", "utf8"));
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from email_log where template is not null`;
  console.log(`OK: email_log has template, variant, version and vars; ${n} rows with a template`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
