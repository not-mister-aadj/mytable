import assert from "node:assert/strict";
import test from "node:test";
import { createLimiter } from "./one-at-a-time";

const tick = () => new Promise((r) => setTimeout(r, 5));

test("never more tasks at once than slots, and all of them finish", async () => {
  const limit = createLimiter(3);
  let running = 0;
  let most = 0;
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      limit(async () => {
        running++;
        most = Math.max(most, running);
        await tick();
        running--;
        return i;
      }),
    ),
  );
  assert.equal(most, 3);
  assert.deepEqual(results, Array.from({ length: 20 }, (_, i) => i));
});

test("a failing task frees its slot and passes its error on", async () => {
  const limit = createLimiter(1);
  const failed = limit(async () => {
    throw new Error("boom");
  });
  await assert.rejects(failed, /boom/);
  assert.equal(await limit(async () => "next"), "next");
});

test("a task that throws before returning a promise frees its slot too", async () => {
  const limit = createLimiter(1);
  await assert.rejects(limit(() => { throw new Error("sync"); }), /sync/);
  assert.equal(await limit(async () => 1), 1);
});

test("first come, first served", async () => {
  const limit = createLimiter(1);
  const order: number[] = [];
  await Promise.all([1, 2, 3, 4].map((n) => limit(async () => { await tick(); order.push(n); })));
  assert.deepEqual(order, [1, 2, 3, 4]);
});
