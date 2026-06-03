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
  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '{}'::jsonb
  `;
  console.log("OK: events.extras column ready");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
