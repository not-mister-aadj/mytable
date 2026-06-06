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
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz
  `;
  console.log("OK: bookings.confirmation_email_sent_at column ready");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
