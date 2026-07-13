import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

config({ path: ".env.local" });

// Prefer a direct (non-pooled) connection for DDL — the transaction pooler
// blocks / hangs on ALTER TABLE.
const url =
  process.env.DATABASE_URL_DIRECT ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

async function main() {
  const migration = readFileSync(
    join(process.cwd(), "drizzle", "0008_consolidate_runtime_ddl.sql"),
    "utf8",
  );
  await sql.unsafe(migration);
  console.log("OK: runtime-DDL consolidation applied (venues, bookings, experience_types)");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
