import postgres from "postgres";
import { isDbConfigured } from "@/db/index";

let migrationClient: ReturnType<typeof postgres> | null = null;

/** Prefer direct / non-pooled URL — poolers often block DDL. */
export function migrationConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL_DIRECT ??
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL
  );
}

export function getDbMigrationClient() {
  const url = migrationConnectionString();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!migrationClient) {
    migrationClient = postgres(url, { prepare: false, max: 1 });
  }
  return migrationClient;
}

/** Run idempotent DDL at most once per server process. */
export function runDbMigrationOnce(
  key: string,
  fn: (sql: ReturnType<typeof postgres>) => Promise<void>,
): Promise<void> {
  if (!isDbConfigured()) return Promise.resolve();
  const cache = migrationRunCache;
  if (!cache.has(key)) {
    cache.set(
      key,
      fn(getDbMigrationClient()).catch((error) => {
        cache.delete(key);
        throw error;
      }),
    );
  }
  return cache.get(key)!;
}

const migrationRunCache = new Map<string, Promise<void>>();
