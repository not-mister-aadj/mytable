import postgres from "postgres";
import { isDbConfigured } from "@/db/index";

const postgresMigrationOptions = {
  prepare: false as const,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
};

const globalForMigrations = globalThis as typeof globalThis & {
  __mytableMigrationPostgres?: ReturnType<typeof postgres>;
};

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
  if (!globalForMigrations.__mytableMigrationPostgres) {
    globalForMigrations.__mytableMigrationPostgres = postgres(
      url,
      postgresMigrationOptions,
    );
  }
  return globalForMigrations.__mytableMigrationPostgres;
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
