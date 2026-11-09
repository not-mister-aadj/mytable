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
/**
 * Fresh connections after this long without a query. Vercel freezes an idle
 * instance with its sockets still open; the pooler closes its side meanwhile,
 * and after the thaw a query on such a dead socket waits until the function's
 * 300 s limit (9 Nov 2026: the site hung ~10 min at 12:47; the nightly series
 * cron hung every night from 2 Nov). Reconnecting costs milliseconds.
 */
const IDLE_RESET_MS = 10_000;

/** Pool resets after at least this long idle get a log line (shorter ones are routine). */
const LOG_IDLE_RESET_MS = 5 * 60_000;

/** Where this instance runs, also as the connection name in the database's own logs. */
const REGION = process.env.VERCEL_REGION ?? "local";

let lastQueryAt = 0;
let closedSinceReset = 0;

const postgresOptions = {
  prepare: false as const,
  max: 3,
  idle_timeout: 20,
  connect_timeout: 5,
  connection: { application_name: `mytable-${REGION}` },
  // Called as each query is sent: marks the pool as in use.
  debug: () => {
    lastQueryAt = Date.now();
  },
  onclose: () => {
    closedSinceReset += 1;
  },
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
  const idleMs = lastQueryAt ? Date.now() - lastQueryAt : 0;
  if (globalForDb.__mytablePostgres && idleMs > IDLE_RESET_MS) {
    if (idleMs > LOG_IDLE_RESET_MS) {
      console.info(`[db] fresh pool after ${Math.round(idleMs / 1000)}s idle (region ${REGION}, ${closedSinceReset} connections closed meanwhile)`);
    }
    // Not ended: code still holding the old pool can finish; its idle
    // connections close by themselves (idle_timeout) and it is then dropped.
    globalForDb.__mytablePostgres = undefined;
    globalForDb.__mytableDrizzle = undefined;
  }
  if (!globalForDb.__mytablePostgres) {
    lastQueryAt = Date.now();
    closedSinceReset = 0;
    globalForDb.__mytablePostgres = postgres(connectionString, postgresOptions);
    globalForDb.__mytableDrizzle = drizzle(globalForDb.__mytablePostgres, {
      schema,
    });
  }
  return globalForDb.__mytablePostgres;
}

export function getDb(): DrizzleDb {
  // Always through getPostgresClient: it replaces a pool that sat idle too long.
  getPostgresClient();
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
      console.error(`[db] ${input.label} took longer than ${input.ms}ms; continuing without it (region ${REGION}, last query ${lastQueryAt ? Math.round((Date.now() - lastQueryAt) / 1000) : "?"}s ago)`);
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
