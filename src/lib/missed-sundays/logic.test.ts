// Run with: npx tsx --test src/lib/missed-sundays/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { isLateCancel, isMissCancel, missCancelFrom, missMailAt, missOutcome } from "./logic";

test("the first miss and the ones after", () => {
  assert.deepEqual(missOutcome(0), { kind: "first" });
  assert.deepEqual(missOutcome(1), { kind: "repeat" });
  assert.deepEqual(missOutcome(4), { kind: "repeat" });
});

test("late means after moving closed: under 7 days before the start", () => {
  const start = new Date("2026-11-22T13:00:00Z");
  assert.equal(isLateCancel(new Date("2026-11-15T13:01:00Z"), start), true);
  assert.equal(isLateCancel(new Date("2026-11-15T12:59:00Z"), start), false);
});

test("a seat given up only counts as a miss from Friday 12:00", () => {
  const start = new Date("2026-11-29T13:00:00Z"); // Sunday 14:00 Amsterdam
  assert.equal(missCancelFrom(start).toISOString(), "2026-11-27T11:00:00.000Z");
  assert.equal(isMissCancel(new Date("2026-11-27T10:59:00Z"), start), false);
  assert.equal(isMissCancel(new Date("2026-11-27T11:00:00Z"), start), true);
  assert.equal(isMissCancel(new Date("2026-11-25T09:00:00Z"), start), false);
  // The Sunday summer time starts: Friday is still winter time.
  assert.equal(missCancelFrom(new Date("2027-03-28T12:00:00Z")).toISOString(), "2027-03-26T11:00:00.000Z");
});

test("the mail waits for Monday 11:00, or goes now once that passed", () => {
  const start = new Date("2026-11-22T13:00:00Z");
  assert.equal(missMailAt(start, new Date("2026-11-22T12:00:00Z"))?.toISOString(), "2026-11-23T10:00:00.000Z");
  assert.equal(missMailAt(start, new Date("2026-11-24T10:00:00Z")), null);
});
