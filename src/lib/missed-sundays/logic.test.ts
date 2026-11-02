// Run with: npx tsx --test src/lib/missed-sundays/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { addMonths, blockMonths, isLateCancel, missMailAt, missOutcome } from "./logic";

const now = new Date("2026-11-08T12:00:00Z");

test("late cancel: warning first, then 3 months (members 1)", () => {
  assert.deepEqual(missOutcome("late", 0, false, now), { kind: "warning" });
  assert.deepEqual(missOutcome("late", 1, false, now), { kind: "block", until: addMonths(now, 3) });
  assert.deepEqual(missOutcome("late", 1, true, now), { kind: "block", until: addMonths(now, 1) });
});

test("no-show: warning with a month off first, then 6 months", () => {
  assert.deepEqual(missOutcome("no_show", 0, false, now), { kind: "warning_block", until: addMonths(now, 1) });
  assert.deepEqual(missOutcome("no_show", 2, false, now), { kind: "block", until: addMonths(now, 6) });
  assert.equal(blockMonths("no_show", missOutcome("no_show", 1, false, now), false), 6);
});

test("late means under 48 hours before the start", () => {
  const start = new Date("2026-11-08T13:00:00Z");
  assert.equal(isLateCancel(new Date("2026-11-06T13:01:00Z"), start), true);
  assert.equal(isLateCancel(new Date("2026-11-06T12:59:00Z"), start), false);
});

test("the mail waits for Monday 09:00, or goes now once that passed", () => {
  const start = new Date("2026-11-08T13:00:00Z");
  assert.equal(missMailAt(start, new Date("2026-11-08T12:00:00Z"))?.toISOString(), "2026-11-09T08:00:00.000Z");
  assert.equal(missMailAt(start, new Date("2026-11-10T10:00:00Z")), null);
});

test("addMonths keeps the day where it can", () => {
  assert.equal(addMonths(new Date("2026-11-30T10:00:00Z"), 3).toISOString(), "2027-02-28T10:00:00.000Z");
});
