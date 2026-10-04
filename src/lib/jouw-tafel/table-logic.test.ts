// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { QuizEvent } from "./logic";
import { maxSeats, singleTotalCents, tableState } from "./table-logic";

const NOW = Date.parse("2026-10-04T10:00:00Z");
function ev(partial: Partial<QuizEvent> = {}): QuizEvent {
  return {
    id: "e", slug: "e", city: "Rotterdam", bracket: "35+", startsAt: "2026-10-25T13:00:00Z",
    priceCents: 1500, capacity: 12, spotsSold: 0, comingSoon: false, englishOpen: false, ...partial,
  };
}

test("table state: open, soon, sold out, closed", () => {
  assert.equal(tableState(ev(), NOW), "open");
  assert.equal(tableState(ev({ comingSoon: true }), NOW), "soon");
  assert.equal(tableState(ev({ spotsSold: 12 }), NOW), "sold_out");
  assert.equal(tableState(ev({ startsAt: "2026-10-05T13:00:00Z" }), NOW), "closed");
  assert.equal(tableState(ev({ startsAt: "2026-10-01T13:00:00Z" }), NOW), "closed");
});

test("seats and the single total", () => {
  assert.equal(maxSeats(ev({ spotsSold: 11 })), 1);
  assert.equal(maxSeats(ev()), 2);
  assert.equal(singleTotalCents(1), 1500);
  assert.equal(singleTotalCents(2), 3000);
});
