// Run with: npx tsx --test src/lib/missed-sundays/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { addMonths, blockMonthsAfter, isLateCancel, missMailAt, missOutcome } from "./logic";

const now = new Date("2026-11-22T12:00:00Z");

test("the first miss is let go, for both kinds", () => {
  assert.deepEqual(missOutcome("late", 0, now), { kind: "warning" });
  assert.deepEqual(missOutcome("no_show", 0, now), { kind: "warning" });
});

test("from the second: 1 month after a late seat, 3 after not showing up, double each time after", () => {
  assert.deepEqual(missOutcome("late", 1, now), { kind: "block", until: addMonths(now, 1) });
  assert.deepEqual(missOutcome("late", 2, now), { kind: "block", until: addMonths(now, 2) });
  assert.deepEqual(missOutcome("no_show", 1, now), { kind: "block", until: addMonths(now, 3) });
  assert.deepEqual(missOutcome("no_show", 2, now), { kind: "block", until: addMonths(now, 6) });
  // What the mail of a first miss names as the next one.
  assert.equal(blockMonthsAfter("late", 0), 1);
  assert.equal(blockMonthsAfter("no_show", 0), 3);
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

test("addMonths keeps the day where it can", () => {
  assert.equal(addMonths(new Date("2026-11-30T10:00:00Z"), 3).toISOString(), "2027-02-28T10:00:00.000Z");
});
