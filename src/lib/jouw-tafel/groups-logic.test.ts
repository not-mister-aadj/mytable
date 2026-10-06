import assert from "node:assert/strict";
import test from "node:test";
import {
  ageBand,
  calendarState,
  groupLabel,
  groupWarning,
  monthGrid,
  nextGroupNumber,
  parseMonthKey,
  shiftMonth,
} from "./groups-logic";

test("group label and numbering", () => {
  assert.equal(groupLabel("Juni", 2), "Juni, groep 2");
  assert.equal(nextGroupNumber([]), 1);
  assert.equal(nextGroupNumber([1, 2]), 3);
  assert.equal(nextGroupNumber([2]), 1);
});

test("group warnings: under 4 or over 7, an empty group is fine", () => {
  assert.equal(groupWarning(0), null);
  assert.equal(groupWarning(3), "too_small");
  assert.equal(groupWarning(4), null);
  assert.equal(groupWarning(7), null);
  assert.equal(groupWarning(8), "too_big");
});

test("calendar state: not yet before members can book, then bookable, full wins", () => {
  const table = { startsAt: "2026-11-29T13:00:00Z", capacity: 20, spotsSold: 0, comingSoon: false };
  assert.equal(calendarState(table, Date.parse("2026-10-31T12:00:00Z")), "not_yet");
  assert.equal(calendarState(table, Date.parse("2026-11-01T14:00:00Z")), "bookable");
  assert.equal(calendarState({ ...table, spotsSold: 20 }, Date.parse("2026-10-01T12:00:00Z")), "full");
  // Nobody booked 14 days before: closed; one seat or an admin's exception keeps it open.
  assert.equal(calendarState(table, Date.parse("2026-11-15T13:00:00Z")), "closed");
  assert.equal(calendarState({ ...table, spotsSold: 1 }, Date.parse("2026-11-15T13:00:00Z")), "bookable");
  assert.equal(calendarState({ ...table, bookingOpensAt: "2026-11-15T14:00:00Z" }, Date.parse("2026-11-16T13:00:00Z")), "bookable");
});

test("month grid: whole Monday-first weeks", () => {
  const nov = monthGrid(2026, 11);
  assert.equal(nov[0]![0], "2026-10-26"); // 1 Nov 2026 is a Sunday
  assert.equal(nov[0]![6], "2026-11-01");
  assert.equal(nov[nov.length - 1]![6], "2026-12-06");
  for (const week of nov) assert.equal(week.length, 7);
  const feb = monthGrid(2027, 2);
  assert.equal(feb[0]![0], "2027-02-01");
  assert.equal(feb.length, 4);
});

test("month keys and shifting", () => {
  assert.deepEqual(parseMonthKey("2026-11"), { year: 2026, month: 11 });
  assert.equal(parseMonthKey("2026-13"), null);
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.deepEqual(shiftMonth(2027, 1, -1), { year: 2026, month: 12 });
});

test("age bands", () => {
  assert.equal(ageBand(null), null);
  assert.equal(ageBand(38), "35-44");
  assert.equal(ageBand(61), "55+");
});
