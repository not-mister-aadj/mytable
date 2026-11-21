import { test } from "node:test";
import assert from "node:assert/strict";
import { seatUrgency } from "./event-display";

const DAY = 86_400_000;
const now = Date.parse("2026-11-14T12:00:00Z");
const at = (days: number) => new Date(now + days * DAY).toISOString();
const chip = (capacity: number, spotsSold: number, days: number, locale: "nl" | "en" = "nl") =>
  seatUrgency({ capacity, spotsSold, startsAt: at(days), now, locale });

test("seatUrgency: far ahead the Sunday's own count, from 15 seats and once someone booked", () => {
  assert.equal(chip(30, 8, 60), null); // 22 left
  assert.equal(chip(15, 0, 60), null); // nobody booked yet
  assert.deepEqual(chip(30, 18, 60), { text: "Nog 12 plekken", last: false });
  assert.deepEqual(chip(15, 14, 60), { text: "Nog 1 plek", last: true });
  assert.deepEqual(chip(30, 18, 60, "en"), { text: "12 seats left", last: false });
});

test("seatUrgency: from four weeks ahead the table being filled, always", () => {
  assert.deepEqual(chip(30, 0, 28), { text: "Nog 5 plekken", last: false });
  assert.deepEqual(chip(30, 8, 10), { text: "Nog 2 plekken", last: false });
  assert.deepEqual(chip(30, 9, 10), { text: "Nog 1 plek", last: true });
  assert.deepEqual(chip(30, 9, 10, "en"), { text: "1 seat left", last: true });
});

test("seatUrgency: full says nothing, and the count never goes up at the switch", () => {
  assert.equal(chip(15, 15, 10), null);
  assert.equal(chip(15, 15, 60), null);
  // 3 left in total: 3 both far ahead and near.
  assert.equal(chip(15, 12, 60)?.text, "Nog 3 plekken");
  assert.equal(chip(15, 12, 10)?.text, "Nog 3 plekken");
});
