// Run with: npx tsx --test src/lib/jouw-tafel/districts.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { amsterdamDistrict, cleanDistricts, outsideDistricts } from "./districts";
import type { QuizEvent } from "./logic";
import { chooseTables, sanitizeQuizState } from "./quiz-logic";

test("amsterdamDistrict: the postcode decides, else the neighbourhood", () => {
  assert.equal(amsterdamDistrict({ address: "Ceintuurbaan 348, 1072 GP Amsterdam", area: "De Pijp" }), "zuid");
  assert.equal(amsterdamDistrict({ address: "Van Woustraat 97, 1074 AG Amsterdam", area: null }), "zuid");
  assert.equal(amsterdamDistrict({ address: "Docklandsweg 3", area: "Amsterdam-Noord" }), "noord");
  assert.equal(amsterdamDistrict({ address: "Prinsengracht 1, 1015DK Amsterdam", area: "West" }), "centrum");
  assert.equal(amsterdamDistrict({ address: null, area: "Oud-West" }), "west");
  assert.equal(amsterdamDistrict({ address: null, area: "Indische Buurt" }), "oost");
  assert.equal(amsterdamDistrict({ address: null, area: "Zuidoost" }), null);
  assert.equal(amsterdamDistrict({ address: "Kade 1", area: null }), null);
});

test("cleanDistricts: none or all of them is everywhere", () => {
  assert.deepEqual(cleanDistricts(["oost", "x", "zuid"]), ["zuid", "oost"]);
  assert.equal(cleanDistricts([]), undefined);
  assert.equal(cleanDistricts(["centrum", "zuid", "oost", "west", "noord"]), undefined);
  assert.equal(cleanDistricts("oost"), undefined);
});

test("outsideDistricts: only an Amsterdam table with a known part they left out", () => {
  assert.equal(outsideDistricts({ city: "Amsterdam", district: "zuid" }, ["oost"]), true);
  assert.equal(outsideDistricts({ city: "Amsterdam", district: "zuid" }, ["oost", "zuid"]), false);
  assert.equal(outsideDistricts({ city: "Amsterdam", district: null }, ["oost"]), false);
  assert.equal(outsideDistricts({ city: "Amsterdam", district: "zuid" }, undefined), false);
  assert.equal(outsideDistricts({ city: "Rotterdam", district: "zuid" }, ["oost"]), false);
});

const NOW = Date.parse("2026-11-14T10:00:00Z");

function event(slug: string, startsAt: string, district: string | null): QuizEvent {
  return {
    id: slug,
    slug,
    city: "Amsterdam",
    bracket: null,
    startsAt,
    priceCents: 1000,
    capacity: 15,
    spotsSold: 3,
    comingSoon: false,
    englishOpen: false,
    district,
    area: district ? "De Pijp" : null,
  };
}

const EVENTS = [
  event("ams-dec", "2026-12-13T13:00:00Z", "zuid"),
  event("ams-jan", "2027-01-10T13:00:00Z", null),
];

function rows(districts?: string[]) {
  return chooseTables(EVENTS, { cities: ["Amsterdam"], age: 30, ageMatters: "no", districts }, NOW).rows.map(
    (r) => `${r.event.slug}${r.nearby ? ":nearby" : ""}`,
  );
}

test("chooseTables: a venue outside their parts of Amsterdam stands with the other tables", () => {
  assert.deepEqual(rows(), ["ams-dec", "ams-jan"]);
  assert.deepEqual(rows(["zuid", "west"]), ["ams-dec", "ams-jan"]);
  // No venue yet: for everyone who chose Amsterdam.
  assert.deepEqual(rows(["oost"]), ["ams-jan", "ams-dec:nearby"]);
});

test("sanitizeQuizState keeps the parts of Amsterdam", () => {
  const state = sanitizeQuizState({ answers: { cities: ["Amsterdam"], amsterdamDistricts: ["oost", "nope"] } });
  assert.deepEqual(state.answers.amsterdamDistricts, ["oost"]);
  assert.equal("amsterdamDistricts" in sanitizeQuizState({ answers: { amsterdamDistricts: [] } }).answers, false);
});
