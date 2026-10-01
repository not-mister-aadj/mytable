// Run with: npx tsx --test src/lib/jouw-tafel/logic.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cityCountFloor,
  nearbyCities,
  outOfTen,
  pickQuizResult,
  soloStop,
  venueWithoutCity,
  type QuizEvent,
  type QuizStats,
} from "./logic";

const NOW = Date.parse("2026-10-01T12:00:00Z");

function event(partial: Partial<QuizEvent> & Pick<QuizEvent, "slug" | "city" | "bracket" | "startsAt">): QuizEvent {
  return {
    id: partial.slug,
    endsAt: null,
    priceCents: 1000,
    capacity: 12,
    spotsSold: 0,
    comingSoon: false,
    venueName: null,
    citySlug: null,
    dateIso: partial.startsAt.slice(0, 10),
    englishOpen: false,
    ...partial,
  };
}

// The live table list on 1 October 2026.
const EVENTS: QuizEvent[] = [
  event({ slug: "rdam-25-okt", city: "Rotterdam", bracket: "35+", startsAt: "2026-10-25T13:00:00Z", spotsSold: 7 }),
  event({ slug: "rdam-1-nov", city: "Rotterdam", bracket: "20-39", startsAt: "2026-11-01T13:00:00Z", capacity: 10, spotsSold: 2 }),
  event({ slug: "dh-8-nov", city: "Den Haag", bracket: "35+", startsAt: "2026-11-08T13:00:00Z", comingSoon: true }),
  event({ slug: "rdam-22-nov", city: "Rotterdam", bracket: "35+", startsAt: "2026-11-22T13:00:00Z", comingSoon: true }),
  event({ slug: "dh-22-nov", city: "Den Haag", bracket: "20-39", startsAt: "2026-11-22T13:00:00Z", comingSoon: true }),
  event({ slug: "utr-29-nov", city: "Utrecht", bracket: "35+", startsAt: "2026-11-29T13:00:00Z", comingSoon: true }),
];

test("Rotterdam 35-44 gets the 25 October table", () => {
  const r = pickQuizResult(EVENTS, { city: "Rotterdam", age: "35_44", company: "solo" }, NOW);
  assert.equal(r.variant, "A");
  assert.equal("event" in r && r.event.slug, "rdam-25-okt");
});

test("Rotterdam 25-34 gets the 1 November 20-39 table", () => {
  const r = pickQuizResult(EVENTS, { city: "Rotterdam", age: "25_34", company: "together" }, NOW);
  assert.equal(r.variant, "A");
  assert.equal("event" in r && r.event.slug, "rdam-1-nov");
});

test("Den Haag 45+ gets the coming-soon table with Rotterdam as nearby", () => {
  const r = pickQuizResult(EVENTS, { city: "Den Haag", age: "45_plus", company: "solo" }, NOW);
  assert.equal(r.variant, "B");
  assert.equal(r.variant === "B" && r.event.slug, "dh-8-nov");
  assert.equal(r.variant === "B" && r.nearby?.slug, "rdam-25-okt");
});

test("Amsterdam 35-44 has nothing yet", () => {
  assert.equal(pickQuizResult(EVENTS, { city: "Amsterdam", age: "35_44", company: "solo" }, NOW).variant, "C");
});

test("Delft 35-44 is offered Rotterdam, case-insensitively", () => {
  const r = pickQuizResult(EVENTS, { city: "delft", age: "35_44", company: "solo" }, NOW);
  assert.equal(r.variant, "C+");
  assert.equal("event" in r && r.event.city, "Rotterdam");
});

test("Eindhoven has nothing", () => {
  assert.equal(pickQuizResult(EVENTS, { city: "Eindhoven", age: "35_44", company: "solo" }, NOW).variant, "C");
});

test("35+ is never offered a 20-39 table", () => {
  const only2039 = EVENTS.filter((e) => e.bracket === "20-39");
  const r = pickQuizResult(only2039, { city: "Rotterdam", age: "35_44", company: "solo" }, NOW);
  assert.equal(r.variant, "C");
});

test("two seats need two spots left", () => {
  const almostFull = [event({ slug: "x", city: "Rotterdam", bracket: "35+", startsAt: "2026-10-25T13:00:00Z", spotsSold: 11 })];
  assert.equal(pickQuizResult(almostFull, { city: "Rotterdam", age: "35_44", company: "solo" }, NOW).variant, "A");
  assert.equal(pickQuizResult(almostFull, { city: "Rotterdam", age: "35_44", company: "together" }, NOW).variant, "C");
});

test("nearby map reads both ways", () => {
  assert.ok(nearbyCities("Rotterdam").includes("Den Haag"));
  assert.ok(nearbyCities("Den Haag").includes("Rotterdam"));
  assert.deepEqual(nearbyCities("Delft").sort(), ["Den Haag", "Rotterdam"]);
  assert.deepEqual(nearbyCities("Eindhoven"), []);
});

test("city counts floor to tens and hide under 20", () => {
  assert.equal(cityCountFloor(116), 110);
  assert.equal(cityCountFloor(20), 20);
  assert.equal(cityCountFloor(19), null);
});

test("share wording stays true", () => {
  assert.deepEqual(outOfTen(61, 100), { tens: 6, nearly: false });
  assert.deepEqual(outOfTen(59, 100), { tens: 6, nearly: true });
  assert.deepEqual(outOfTen(103, 170), { tens: 6, nearly: false }); // 60.6%
  assert.deepEqual(outOfTen(98, 170), { tens: 6, nearly: true }); // 57.6%
  assert.deepEqual(outOfTen(40, 170), { tens: 2, nearly: false }); // 23.5%
  assert.equal(outOfTen(5, 10), null);
});

function seats(total: number, single: number): QuizStats {
  return {
    cityCounts: {},
    why: { base: 0, counts: { discover_places: 0, just_fun: 0, discover_wines: 0, treat: 0, new_city: 0 } },
    seats: { total, single },
  };
}

test("solo stop follows the real share", () => {
  assert.deepEqual(soloStop(seats(9, 7)), { kind: "almostEveryone" });
  assert.deepEqual(soloStop(seats(10, 6)), { kind: "most" });
  assert.deepEqual(soloStop(seats(10, 5)), { kind: "skip" });
  assert.deepEqual(soloStop(seats(0, 0)), { kind: "skip" });
  assert.deepEqual(soloStop(seats(40, 33)), { kind: "numeric", tens: 8 });
});

test("venue name drops a trailing city", () => {
  assert.equal(venueWithoutCity("Bar Juni Rotterdam", "Rotterdam"), "Bar Juni");
  assert.equal(venueWithoutCity("Juni", "Rotterdam"), "Juni");
});
