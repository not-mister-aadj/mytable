import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

/**
 * Supabase transaction pooler (6543): small pool per instance; avoid HMR leaks
 * in dev.
 *
 * connect_timeout is 5s, not 10: functions run in fra1 next to the database, so
 * a healthy handshake takes tens of milliseconds. When the pooler is not
 * answering, public pages fall back to the static catalog, and every extra
 * second here is a second a visitor stares at a blank page first.
 */
const postgresOptions = {
  prepare: false as const,
  max: 3,
  idle_timeout: 20,
  connect_timeout: 5,
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

/**
 * Drops this instance's pool so the next query opens fresh connections. For
 * after a query hung: when Vercel thaws a frozen instance its sockets to the
 * pooler can be dead without anyone noticing, and every query on them waits
 * until the network gives up. The old pool gets a few seconds to finish what
 * is still running, then closes.
 */
export function resetDbPool(): void {
  const old = globalForDb.__mytablePostgres;
  globalForDb.__mytablePostgres = undefined;
  globalForDb.__mytableDrizzle = undefined;
  if (old) void old.end({ timeout: 5 }).catch(() => undefined);
}

/**
 * Resolves with `fallback` when `promise` takes longer than `ms`, and drops
 * the pool (see resetDbPool), so one dead connection never leaves a visitor
 * staring at a loading page. For data a page can do without; errors still
 * reject as before.
 */
export function withDbTimeout<T>(promise: Promise<T>, input: { ms: number; fallback: T; label: string }): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      console.error(`[db] ${input.label} took longer than ${input.ms}ms; continuing without it`);
      resetDbPool();
      resolve(input.fallback);
    }, input.ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function isDbConfigured(): boolean {
  return Boolean(connectionString);
}
