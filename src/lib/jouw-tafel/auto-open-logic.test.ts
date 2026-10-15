import assert from "node:assert/strict";
import test from "node:test";
import { tablesToOpen, type AutoOpenTable } from "@/lib/jouw-tafel/auto-open-logic";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-15T10:00:00Z");

function table(id: string, city: string, daysAhead: number, extra: Partial<AutoOpenTable> = {}): AutoOpenTable {
  return {
    id,
    city,
    startsAt: new Date(NOW + daysAhead * DAY),
    capacity: 10,
    spotsSold: 0,
    handMade: false,
    comingSoon: false,
    bookingOpensAt: null,
    ...extra,
  };
}

test("a city with one bookable Sunday gets the next one opened", () => {
  // 20 days ahead: open (within 4 weeks). 48 days ahead: not open yet.
  const ids = tablesToOpen([table("a", "Utrecht", 20, { spotsSold: 2 }), table("b", "Utrecht", 48), table("c", "Utrecht", 76)], NOW);
  assert.deepEqual(ids, ["b"]);
});

test("a city that already has two bookable Sundays is left alone", () => {
  const ids = tablesToOpen([table("a", "Utrecht", 20, { spotsSold: 1 }), table("b", "Utrecht", 27, { spotsSold: 1 }), table("c", "Utrecht", 48)], NOW);
  assert.deepEqual(ids, []);
});

test("a full Sunday does not count, so the next two open", () => {
  const ids = tablesToOpen([table("a", "Rotterdam", 10, { spotsSold: 10 }), table("b", "Rotterdam", 38), table("c", "Rotterdam", 66)], NOW);
  assert.deepEqual(ids, ["b", "c"]);
});

test("a hand-made Social counts as bookable and blocks its own date", () => {
  const ids = tablesToOpen(
    [table("h", "Amsterdam", 31, { handMade: true }), table("s", "Amsterdam", 31), table("n", "Amsterdam", 59)],
    NOW,
  );
  assert.deepEqual(ids, ["n"]);
});

test("a table closed as empty two weeks before is never opened again", () => {
  // 10 days ahead, nobody booked: closed. The next one (40 days) opens,
  // and so does the one after, to make two.
  const ids = tablesToOpen([table("x", "Eindhoven", 10), table("y", "Eindhoven", 40), table("z", "Eindhoven", 68)], NOW);
  assert.deepEqual(ids, ["y", "z"]);
});

test("cities outside ours and coming-soon tables are skipped", () => {
  const ids = tablesToOpen([table("g", "Groningen", 40), table("cs", "Utrecht", 40, { comingSoon: true })], NOW);
  assert.deepEqual(ids, []);
});
