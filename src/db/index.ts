import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/** Supabase transaction pooler (6543): keep a single connection; avoid HMR leaks in dev. */
const postgresOptions = {
  prepare: false as const,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
};

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as typeof globalThis & {
  __mytablePostgres?: PostgresClient;
  __mytableDrizzle?: DrizzleDb;
};

export function getPostgresClient(): PostgresClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForDb.__mytablePostgres) {
    globalForDb.__mytablePostgres = postgres(connectionString, postgresOptions);
    globalForDb.__mytableDrizzle = drizzle(globalForDb.__mytablePostgres, {
      schema,
    });
  }
  return globalForDb.__mytablePostgres;
}

export function getDb(): DrizzleDb {
  if (!globalForDb.__mytableDrizzle) {
    getPostgresClient();
  }
  return globalForDb.__mytableDrizzle!;
}

export function isDbConfigured(): boolean {
  return Boolean(connectionString);
}
