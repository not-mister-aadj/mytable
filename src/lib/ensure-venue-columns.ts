import postgres from "postgres";
import { isDbConfigured } from "@/db/index";

let migrationClient: ReturnType<typeof postgres> | null = null;

/** Prefer direct / non-pooled URL — poolers often block DDL. */
function migrationConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL_DIRECT ??
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL
  );
}

function getMigrationClient() {
  const url = migrationConnectionString();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!migrationClient) {
    migrationClient = postgres(url, { prepare: false, max: 1 });
  }
  return migrationClient;
}

/** Idempotent — safe to run before every venue read/write. */
export async function ensureVenueColumns(): Promise<void> {
  if (!isDbConfigured()) return;

  const sql = getMigrationClient();
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS latitude text`;
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS longitude text`;
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS image_meta jsonb`;
  await sql`ALTER TABLE venues ADD COLUMN IF NOT EXISTS gallery_meta jsonb`;
}
