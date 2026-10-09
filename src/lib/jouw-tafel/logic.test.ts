// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import { MEMBERSHIP_OPEN } from "../membership/plans";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bracketFromEventName,
  cityFromGeo,
  cityTables,
  cityTabs,
  displayCity,
  JOUW_TAFEL_SEAT_PRICE_CENTS,
  resolveSeatPriceCents,
  jouwTafelBookingWindow,
  bookingOpensOverride,
  withBookingWindow,
  closedReason,
  isClosedEmpty,
  isNoLongerBookable,
  isShownTable,
  nextDatesPerCity,
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

test("geo: our cities, in any spelling Vercel sends", () => {
  assert.equal(cityFromGeo("Rotterdam", "NL"), "Rotterdam");
  assert.equal(cityFromGeo("The%20Hague", "NL"), "Den Haag");
  assert.equal(cityFromGeo("Den%20Haag", "NL"), "Den Haag");
  assert.equal(cityFromGeo("%27s-Gravenhage", "NL"), "Den Haag");
  assert.equal(cityFromGeo("utrecht", null), "Utrecht");
  assert.equal(cityFromGeo("Amsterdam"), "Amsterdam");
});

test("geo: a town near one of our cities gives no preselect", () => {
  assert.equal(cityFromGeo("Schiedam", "NL"), null);
  assert.equal(cityFromGeo("Delft", "NL"), null);
  assert.equal(cityFromGeo("Haarlem", "NL"), null);
});

test("geo: unknown, far away, abroad or missing gives no city", () => {
  assert.equal(cityFromGeo("Zwolle", "NL"), null);
  assert.equal(cityFromGeo("Eindhoven", "NL"), "Eindhoven");
  assert.equal(cityFromGeo("Arnhem", "NL"), null);
  assert.equal(cityFromGeo("Tilburg", "NL"), null);
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

test("nearby: our cities within 30 km of each other, only ours", () => {
  // Rotterdam and Den Haag are about 20 km apart; every other pair is
  // further than 30 km (Utrecht and Amsterdam about 35 km).
  assert.deepEqual(nearbyCities("Rotterdam"), ["Den Haag"]);
  assert.deepEqual(nearbyCities("den haag"), ["Rotterdam"]);
  assert.deepEqual(nearbyCities("Utrecht"), []);
  assert.deepEqual(nearbyCities("Amsterdam"), []);
  // A place that is not ours has no nearby cities.
  assert.deepEqual(nearbyCities("Delft"), []);
  assert.deepEqual(nearbyCities("Zwolle"), []);
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

test("city tables: a full or past table stays until the day after its date", () => {
  const list = [
    event({ slug: "long-past", city: "Rotterdam", bracket: "35+", startsAt: "2026-09-27T12:00:00Z" }),
    event({ slug: "yesterday", city: "Rotterdam", bracket: "35+", startsAt: "2026-09-30T13:00:00Z" }),
    event({ slug: "full", city: "Rotterdam", bracket: "35+", startsAt: "2026-10-25T13:00:00Z", spotsSold: 12 }),
    event({ slug: "open", city: "Rotterdam", bracket: "35+", startsAt: "2026-11-25T13:00:00Z" }),
  ];
  assert.deepEqual(slugs(cityTables(list, "Rotterdam", NOW)), ["yesterday", "full", "open"]);
});

test("closed: full, nobody booked 14 days before (unless an admin opened it), or too late", () => {
  const t = (partial: Partial<QuizEvent> = {}) =>
    event({ slug: "t", city: "Rotterdam", bracket: null, startsAt: "2026-10-25T13:00:00Z", ...partial });
  const at = (iso: string) => Date.parse(iso);
  assert.equal(closedReason(t(), at("2026-10-11T12:59:00Z")), null);
  assert.equal(closedReason(t(), at("2026-10-11T13:00:00Z")), "empty");
  assert.equal(isClosedEmpty(t({ spotsSold: 1 }), at("2026-10-20T13:00:00Z")), false);
  assert.equal(isClosedEmpty(t({ bookingOpensAt: "2026-10-01T00:00:00Z" }), at("2026-10-20T13:00:00Z")), false);
  assert.equal(closedReason(t({ spotsSold: 12 }), NOW), "full");
  assert.equal(closedReason(t({ spotsSold: 3 }), at("2026-10-23T13:00:00Z")), "past");
  assert.equal(isNoLongerBookable(t({ spotsSold: 3 }), at("2026-10-20T13:00:00Z")), false);
  assert.equal(isShownTable(t(), at("2026-10-26T12:59:00Z")), true);
  assert.equal(isShownTable(t(), at("2026-10-26T13:00:00Z")), false);
});

test("city tabs: the visitor's city first and open, then only cities with tables", () => {
  const withTables = ["Rotterdam", "Den Haag", "Utrecht", "Amsterdam"].filter(
    (c) => cityTables(EVENTS, c, NOW).length > 0,
  );
  assert.deepEqual(cityTabs(EVENTS, "Utrecht", NOW), {
    cities: ["Utrecht", ...withTables.filter((c) => c !== "Utrecht")],
    initial: "Utrecht",
  });
  // A visitor from a city without tables still sees their own city first.
  assert.equal(cityTabs(EVENTS, "Nijmegen", NOW).cities[0], "Nijmegen");
  assert.ok(!cityTabs(EVENTS, null, NOW).cities.includes("Breda"));
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

test("seat price: €10 for a Jouw tafel Sunday Table, the event price otherwise", () => {
  assert.equal(JOUW_TAFEL_SEAT_PRICE_CENTS, 1000);
  assert.equal(resolveSeatPriceCents({ eventPriceCents: 1500, isJouwTafel: true }), 1000);
  assert.equal(resolveSeatPriceCents({ eventPriceCents: 4900, isJouwTafel: true }), 1000);
  assert.equal(resolveSeatPriceCents({ eventPriceCents: 1000, isJouwTafel: false }), 1000);
});

test("booking window: 28 days before; everyone at once while the membership is not offered", () => {
  const { membersFrom, everyoneFrom } = jouwTafelBookingWindow("2026-11-01T13:00:00Z");
  assert.equal(membersFrom.toISOString(), "2026-10-04T13:00:00.000Z");
  assert.equal(everyoneFrom.toISOString(), MEMBERSHIP_OPEN ? "2026-10-06T13:00:00.000Z" : "2026-10-04T13:00:00.000Z");
});

test("withBookingWindow: not bookable before members can, members only for 48 hours", () => {
  const table = { startsAt: "2026-11-29T13:00:00Z", comingSoon: false, membersOnlyUntil: null };
  const before = withBookingWindow(table, Date.parse("2026-10-31T12:00:00Z"));
  assert.equal(before.comingSoon, true);
  assert.equal(before.opensAt, "2026-11-01T13:00:00.000Z");
  const members = withBookingWindow(table, Date.parse("2026-11-02T12:00:00Z"));
  assert.equal(members.comingSoon, false);
  assert.equal(members.membersOnlyUntil, MEMBERSHIP_OPEN ? "2026-11-03T13:00:00.000Z" : "2026-11-01T13:00:00.000Z");
  // An admin's later moment wins (only while the membership is offered).
  const later = withBookingWindow({ ...table, membersOnlyUntil: "2026-11-10T10:00:00.000Z" }, Date.parse("2026-11-02T12:00:00Z"));
  assert.equal(later.membersOnlyUntil, MEMBERSHIP_OPEN ? "2026-11-10T10:00:00.000Z" : "2026-11-01T13:00:00.000Z");
});

test("nextDatesPerCity keeps the next two dates of each city", () => {
  const e = (city: string, startsAt: string) => ({ city, startsAt });
  const kept = nextDatesPerCity([
    e("Rotterdam", "2026-12-27T13:00:00Z"),
    e("Rotterdam", "2026-11-01T13:00:00Z"),
    e("rotterdam", "2026-11-29T13:00:00Z"),
    e("Den Haag", "2026-11-08T13:00:00Z"),
  ]);
  assert.deepEqual(kept.map((k) => `${k.city} ${k.startsAt.slice(0, 10)}`), [
    "Rotterdam 2026-11-01",
    "Den Haag 2026-11-08",
    "rotterdam 2026-11-29",
  ]);
});

test("nextDatesPerCity: a closed table does not use up one of the two dates", () => {
  const e = (startsAt: string, closed = false) => ({ city: "Rotterdam", startsAt, closed });
  const kept = nextDatesPerCity(
    [e("2026-10-25T13:00:00Z", true), e("2026-11-01T13:00:00Z", true), e("2026-11-29T13:00:00Z"), e("2026-12-27T13:00:00Z"), e("2027-01-24T13:00:00Z")],
    2,
    (x) => !x.closed,
  );
  assert.deepEqual(kept.map((k) => k.startsAt.slice(0, 10)), ["2026-10-25", "2026-11-01", "2026-11-29", "2026-12-27"]);
  // A closed table after the two dates is not shown.
  const after = nextDatesPerCity([e("2026-11-29T13:00:00Z"), e("2026-12-27T13:00:00Z"), e("2027-01-24T13:00:00Z", true)], 2, (x) => !x.closed);
  assert.equal(after.length, 2);
});

test("an admin's exception opens a table for everyone at once", () => {
  const table = { startsAt: "2026-11-22T13:00:00Z", comingSoon: false, membersOnlyUntil: null, bookingOpensAt: "2026-10-04T19:00:00.000Z" };
  const now = Date.parse("2026-10-04T20:00:00Z");
  const seen = withBookingWindow(table, now);
  assert.equal(seen.comingSoon, false);
  assert.equal(seen.membersOnlyUntil, "2026-10-04T19:00:00.000Z");
  assert.ok(Date.parse(seen.membersOnlyUntil) <= now);
  assert.equal(bookingOpensOverride({ bookingOpensAt: "nonsense" }), null);
});
