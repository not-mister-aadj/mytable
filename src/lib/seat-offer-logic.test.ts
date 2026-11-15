// Run with: npx tsx --test src/lib/seat-offer-logic.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ageFitsGroup, ageOn, languageFitsGroup, offerDiscountPct, offerMoment, offerPriceCents, offerStillOpen } from "./seat-offer-logic";

// Sunday 15 November 2026, 14:00 in Amsterdam (winter time: 13:00 UTC).
const SUNDAY = new Date("2026-11-15T13:00:00Z");

test("offerMoment: at once by day, at 08:00 after a night, never within four hours", () => {
  // Saturday 19:04: at once.
  assert.equal(offerMoment(SUNDAY, new Date("2026-11-14T18:04:00Z"))?.toISOString(), "2026-11-14T18:04:00.000Z");
  // Sunday 06:21: waits for 08:00, six hours before the start.
  assert.equal(offerMoment(SUNDAY, new Date("2026-11-15T05:21:00Z"))?.toISOString(), "2026-11-15T07:00:00.000Z");
  // Saturday 23:30: Sunday 08:00.
  assert.equal(offerMoment(SUNDAY, new Date("2026-11-14T22:30:00Z"))?.toISOString(), "2026-11-15T07:00:00.000Z");
  // Sunday 10:30: three and a half hours before, too late.
  assert.equal(offerMoment(SUNDAY, new Date("2026-11-15T09:30:00Z")), null);
  // Sunday 10:00 exactly: four hours, still goes.
  assert.equal(offerMoment(SUNDAY, new Date("2026-11-15T09:00:00Z"))?.toISOString(), "2026-11-15T09:00:00.000Z");
  assert.equal(offerStillOpen(SUNDAY, new Date("2026-11-15T09:00:00Z")), true);
  assert.equal(offerStillOpen(SUNDAY, new Date("2026-11-15T09:01:00Z")), false);
});

test("the price: half within three days of the Sunday", () => {
  assert.equal(offerDiscountPct(SUNDAY, new Date("2026-11-12T13:00:00Z")), 50);
  assert.equal(offerDiscountPct(SUNDAY, new Date("2026-11-12T12:59:00Z")), 0);
  assert.equal(offerPriceCents(1000, SUNDAY, new Date("2026-11-14T18:00:00Z")), 500);
  assert.equal(offerPriceCents(1000, SUNDAY, new Date("2026-11-01T18:00:00Z")), 1000);
  assert.equal(offerPriceCents(1500, SUNDAY, new Date("2026-11-14T18:00:00Z")), 750);
});

test("ageOn and ageFitsGroup: within the group's ages, five years either side", () => {
  assert.equal(ageOn("1990-11-15", SUNDAY), 36);
  assert.equal(ageOn("1990-11-16", SUNDAY), 35);
  assert.equal(ageOn("nope", SUNDAY), null);
  const group = ["1988-01-01", "1994-06-01", null]; // 38 and 32
  assert.equal(ageFitsGroup("1983-01-01", group, SUNDAY), true); // 43: oldest + 5
  assert.equal(ageFitsGroup("1982-01-01", group, SUNDAY), false); // 44
  assert.equal(ageFitsGroup("1999-06-01", group, SUNDAY), true); // 27: youngest - 5
  assert.equal(ageFitsGroup("2000-06-01", group, SUNDAY), false); // 26
  assert.equal(ageFitsGroup(null, group, SUNDAY), false);
  assert.equal(ageFitsGroup("1990-01-01", [null, undefined], SUNDAY), false);
});

test("languageFitsGroup: only-English never joins only-Dutch", () => {
  assert.equal(languageFitsGroup("english", ["dutch", "both"]), false);
  assert.equal(languageFitsGroup("dutch", ["english"]), false);
  assert.equal(languageFitsGroup("both", ["dutch", "english"]), true);
  assert.equal(languageFitsGroup("english", ["both", null]), true);
  assert.equal(languageFitsGroup(null, ["dutch"]), true);
});
