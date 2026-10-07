// Run with: npx tsx --test src/db/db-timeout.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { withDbTimeout } from "./index";

const later = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

test("withDbTimeout: a quick answer passes, a slow one gives the fallback, an error still rejects", async () => {
  assert.equal(await withDbTimeout(later(5, "db"), { ms: 100, fallback: "fallback", label: "test" }), "db");
  assert.equal(await withDbTimeout(later(200, "db"), { ms: 20, fallback: "fallback", label: "test" }), "fallback");
  await assert.rejects(withDbTimeout(Promise.reject(new Error("boom")), { ms: 100, fallback: "x", label: "test" }), /boom/);
});
