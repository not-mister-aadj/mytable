import { readFileSync } from "node:fs";
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = postgres(url, { prepare: false });
  await sql.unsafe(readFileSync("drizzle/0049_invite_no_duplicates.sql", "utf8"));
  console.log("0049 applied");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
