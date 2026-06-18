import postgres from "postgres";
import { isDbConfigured } from "@/db/index";

let migrationClient: ReturnType<typeof postgres> | null = null;
let columnsEnsured = false;
let ensureInFlight: Promise<void> | null = null;

const ENSURE_TIMEOUT_MS = 8_000;

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

/** Idempotent — safe to run before booking writes. Cached per server instance. */
export async function ensureBookingColumns(): Promise<void> {
  if (!isDbConfigured() || columnsEnsured) return;

  if (!ensureInFlight) {
    ensureInFlight = (async () => {
      const sql = getMigrationClient();
      await Promise.race([
        (async () => {
          await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seating_preference text`;
          await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS table_language_preference text`;
        })(),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("ensureBookingColumns timed out")),
            ENSURE_TIMEOUT_MS,
          );
        }),
      ]);
      columnsEnsured = true;
    })().catch((error) => {
      ensureInFlight = null;
      console.error("[ensureBookingColumns]", error);
    });
  }

  await ensureInFlight;
}
