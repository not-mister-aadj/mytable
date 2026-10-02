// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bracketFromEventName,
  cityFromGeo,
  cityTables,
  cityTabs,
  displayCity,
  nearbyCities,
  seatPriceCents,
  supportedCity,
  type QuizEvent,
} from "./logic";

const NOW = Date.parse("2026-10-01T12:00:00Z");

function event(partial: Partial<QuizEvent> & Pick<QuizEvent, "slug" | "city" | "bracket" | "startsAt">): QuizEvent {
  return {
    id: partial.slug,
    priceCents: 1000,
    capacity: 12,
    spotsSold: 0,
    comingSoon: false,
    englishOpen: false,
    ...partial,
  };
}

// The live table list on 1 October 2026.
const EVENTS: QuizEvent[] = [
  event({ slug: "rdam-22-nov", city: "Rotterdam", bracket: "35+", startsAt: "2026-11-22T13:00:00Z", comingSoon: true }),
  event({ slug: "rdam-25-okt", city: "Rotterdam", bracket: "35+", startsAt: "2026-10-25T13:00:00Z", spotsSold: 7 }),
  event({ slug: "rdam-1-nov", city: "Rotterdam", bracket: "20-39", startsAt: "2026-11-01T13:00:00Z", capacity: 10, spotsSold: 2 }),
  event({ slug: "dh-8-nov", city: "Den Haag", bracket: "35+", startsAt: "2026-11-08T13:00:00Z", comingSoon: true }),
  event({ slug: "dh-22-nov", city: "Den Haag", bracket: "20-39", startsAt: "2026-11-22T13:00:00Z", comingSoon: true }),
  event({ slug: "utr-29-nov", city: "Utrecht", bracket: "35+", startsAt: "2026-11-29T13:00:00Z", comingSoon: true }),
];

function slugs(events: QuizEvent[]): string[] {
  return events.map((e) => e.slug);
}

// ---------------------------------------------------------------- geo

test("geo: our four cities, in any spelling Vercel sends", () => {
  assert.equal(cityFromGeo("Rotterdam", "NL"), "Rotterdam");
  assert.equal(cityFromGeo("The%20Hague", "NL"), "Den Haag");
  assert.equal(cityFromGeo("Den%20Haag", "NL"), "Den Haag");
  assert.equal(cityFromGeo("%27s-Gravenhage", "NL"), "Den Haag");
  assert.equal(cityFromGeo("utrecht", null), "Utrecht");
  assert.equal(cityFromGeo("Amsterdam"), "Amsterdam");
});

test("geo: nearby towns map to the nearest city with tables", () => {
  assert.equal(cityFromGeo("Schiedam", "NL"), "Rotterdam");
  assert.equal(cityFromGeo("Delft", "NL"), "Rotterdam");
  assert.equal(cityFromGeo("Leiden", "NL"), "Den Haag");
  assert.equal(cityFromGeo("Haarlem", "NL"), "Amsterdam");
  assert.equal(cityFromGeo("Amersfoort", "NL"), "Utrecht");
});

test("geo: unknown, far away, abroad or missing gives no city", () => {
  assert.equal(cityFromGeo("Eindhoven", "NL"), null);
  assert.equal(cityFromGeo("Rotterdam", "BE"), null);
  assert.equal(cityFromGeo(null, "NL"), null);
  assert.equal(cityFromGeo("", "NL"), null);
  assert.equal(cityFromGeo("%E0%A4%A", "NL"), null);
});

test("supported cities and English display names", () => {
  assert.equal(supportedCity("den haag"), "Den Haag");
  assert.equal(supportedCity("Delft"), null);
  assert.equal(displayCity("Den Haag", "en"), "The Hague");
  assert.equal(displayCity("Den Haag", "nl"), "Den Haag");
  assert.equal(displayCity("Rotterdam", "en"), "Rotterdam");
});

test("nearby map reads both ways", () => {
  assert.ok(nearbyCities("Rotterdam").includes("Den Haag"));
  assert.ok(nearbyCities("Den Haag").includes("Rotterdam"));
  assert.deepEqual(nearbyCities("Delft").sort(), ["Den Haag", "Rotterdam"]);
  assert.deepEqual(nearbyCities("Eindhoven"), []);
});

// ---------------------------------------------------------------- tables

test("age group comes from the event name", () => {
  assert.equal(bracketFromEventName("Sunday Table · 35+"), "35+");
  assert.equal(bracketFromEventName("Sunday Table · 20-39"), "20-39");
  assert.equal(bracketFromEventName("Sunday Table"), null);
});

test("city tables: soonest first, both age groups, coming soon included", () => {
  assert.deepEqual(slugs(cityTables(EVENTS, "Rotterdam", NOW)), ["rdam-25-okt", "rdam-1-nov", "rdam-22-nov"]);
  assert.deepEqual(slugs(cityTables(EVENTS, "den haag", NOW)), ["dh-8-nov", "dh-22-nov"]);
  assert.deepEqual(cityTables(EVENTS, "Amsterdam", NOW), []);
});

test("city tables: past and sold-out tables drop off", () => {
  const list = [
    event({ slug: "past", city: "Rotterdam", bracket: "35+", startsAt: "2026-09-27T12:00:00Z" }),
    event({ slug: "full", city: "Rotterdam", bracket: "35+", startsAt: "2026-10-25T13:00:00Z", spotsSold: 12 }),
    event({ slug: "open", city: "Rotterdam", bracket: "35+", startsAt: "2026-11-25T13:00:00Z" }),
  ];
  assert.deepEqual(slugs(cityTables(list, "Rotterdam", NOW)), ["open"]);
});

test("city tabs: the visitor's city first and open", () => {
  assert.deepEqual(cityTabs(EVENTS, "Utrecht", NOW), {
    cities: ["Utrecht", "Rotterdam", "Den Haag", "Amsterdam"],
    initial: "Utrecht",
  });
});

test("city tabs: without geo, open the first city that has a table", () => {
  assert.deepEqual(cityTabs(EVENTS, null, NOW).initial, "Rotterdam");
  assert.deepEqual(cityTabs([], null, NOW).initial, "Rotterdam");
  const onlyUtrecht = EVENTS.filter((e) => e.city === "Utrecht");
  assert.deepEqual(cityTabs(onlyUtrecht, null, NOW).initial, "Utrecht");
});

test("seat price comes from the soonest upcoming table, null without tables", () => {
  assert.equal(seatPriceCents(EVENTS, NOW), 1000);
  assert.equal(seatPriceCents([], NOW), null);
});
