// Run with: npx tsx --test src/lib/missed-sundays/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { isLateCancel, missMailAt, missOutcome, nextSeatCostsMore } from "./logic";

test("the first miss is let go, from the second the next seat costs more", () => {
  assert.deepEqual(missOutcome(0), { kind: "warning" });
  assert.deepEqual(missOutcome(1), { kind: "surcharge" });
  assert.deepEqual(missOutcome(4), { kind: "surcharge" });
});

test("the higher price holds until they came to a Sunday", () => {
  assert.equal(nextSeatCostsMore(1, false), false);
  assert.equal(nextSeatCostsMore(2, false), true);
  assert.equal(nextSeatCostsMore(2, true), false);
  assert.equal(nextSeatCostsMore(3, false), true);
});

test("late means after moving closed: under 7 days before the start", () => {
  const start = new Date("2026-11-22T13:00:00Z");
  assert.equal(isLateCancel(new Date("2026-11-15T13:01:00Z"), start), true);
  assert.equal(isLateCancel(new Date("2026-11-15T12:59:00Z"), start), false);
});

test("the mail waits for Monday 11:00, or goes now once that passed", () => {
  const start = new Date("2026-11-22T13:00:00Z");
  assert.equal(missMailAt(start, new Date("2026-11-22T12:00:00Z"))?.toISOString(), "2026-11-23T10:00:00.000Z");
  assert.equal(missMailAt(start, new Date("2026-11-24T10:00:00Z")), null);
});
