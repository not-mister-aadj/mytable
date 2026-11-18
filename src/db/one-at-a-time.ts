import type postgres from "postgres";

type PostgresClient = ReturnType<typeof postgres>;

/** Runs at most `slots` tasks at once; the rest wait their turn, first come first served. */
export function createLimiter(slots: number) {
  let running = 0;
  const waiting: Array<() => void> = [];
  const next = () => {
    running--;
    waiting.shift()?.();
  };
  return function run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const start = () => {
        running++;
        let result: Promise<T>;
        try {
          result = Promise.resolve(task());
        } catch (error) {
          result = Promise.reject(error);
        }
        result.then(
          (value) => {
            next();
            resolve(value);
          },
          (error: unknown) => {
            next();
            reject(error);
          },
        );
      };
      if (running < slots) start();
      else waiting.push(start);
    });
  };
}

/**
 * The postgres client as drizzle sees it, with at most one query per
 * connection at a time. postgres.js sends extra queries down a busy
 * connection right behind the one running (pipelining); through Supabase's
 * transaction pooler (port 6543) four or more of those never get an answer,
 * and the request hangs until the 300 s limit (found 18 Nov 2026: 8 or more
 * queries at once on our 3 connections hung, on dev and prod alike). Here the
 * extra queries wait in our own queue instead, and go out one per free
 * connection.
 *
 * drizzle only calls `unsafe` (queries) and `begin` (transactions) on the
 * client, and reads its `options`. A transaction takes one slot for as long
 * as it runs; the queries inside it go over its own connection.
 */
export function oneQueryPerConnection(client: PostgresClient, slots: number): PostgresClient {
  const limit = createLimiter(slots);
  const unsafe = (query: string, params?: unknown[], options?: unknown) => {
    // drizzle awaits it, or calls .values() and awaits that.
    const run = (values: boolean) =>
      limit(() => {
        const pending = client.unsafe(query, params as never, options as never);
        return values ? pending.values() : pending;
      });
    // Sent once, however often it is awaited.
    let rows: Promise<unknown> | null = null;
    const once = () => (rows ??= run(false));
    return {
      then: (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => once().then(onFulfilled, onRejected),
      catch: (onRejected: (e: unknown) => unknown) => once().catch(onRejected),
      values: () => run(true),
    };
  };
  const begin = (...args: unknown[]) => limit(() => (client.begin as (...a: unknown[]) => Promise<unknown>)(...args));
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "unsafe") return unsafe;
      if (prop === "begin") return begin;
      return Reflect.get(target, prop, receiver);
    },
  });
}
