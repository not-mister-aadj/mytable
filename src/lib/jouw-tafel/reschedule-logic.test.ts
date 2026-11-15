// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { canReschedule, daysBefore, moveTargets, pickRescheduleTarget, type RescheduleCandidate } from "./reschedule-logic";

const NOW = Date.parse("2026-10-04T10:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const source = { id: "src", city: "Rotterdam", nameNl: "Sunday Table · 35+", startsAt: new Date("2026-10-25T13:00:00Z") };

function ev(id: string, partial: Partial<RescheduleCandidate> = {}): RescheduleCandidate {
  return {
    id, city: "Rotterdam", nameNl: "Sunday Table · 35+", startsAt: new Date("2026-11-01T13:00:00Z"),
    capacity: 12, spotsSold: 0, workflowStatus: "published", experienceType: "jouw-tafel", comingSoon: false, ...partial,
  };
}

test("the 7-day rule", () => {
  assert.equal(canReschedule(new Date(NOW + 7 * DAY), NOW), true);
  assert.equal(canReschedule(new Date(NOW + 7 * DAY - 1), NOW), false);
  assert.equal(canReschedule(new Date(NOW + 20 * DAY), NOW), true);
  assert.equal(daysBefore(new Date(NOW + 9.5 * DAY), NOW), 9);
});

test("next table: same city, same bracket, later, room for the seats", () => {
  const list = [
    ev("later", { startsAt: new Date("2026-11-08T13:00:00Z") }),
    ev("next"),
    ev("other-city", { city: "Utrecht", startsAt: new Date("2026-10-26T13:00:00Z") }),
    ev("other-bracket", { nameNl: "Sunday Table · 20-39", startsAt: new Date("2026-10-27T13:00:00Z") }),
    ev("earlier", { startsAt: new Date("2026-10-18T13:00:00Z") }),
    ev("src", { startsAt: new Date("2026-10-25T13:00:00Z") }),
  ];
  assert.equal(pickRescheduleTarget(source, list, 1, NOW)?.id, "next");
});

test("skips full, coming soon, draft, other formats; none when nothing fits", () => {
  const list = [
    ev("full", { spotsSold: 11 }),
    ev("soon", { comingSoon: true, startsAt: new Date("2026-11-02T13:00:00Z") }),
    ev("draft", { workflowStatus: "draft", startsAt: new Date("2026-11-03T13:00:00Z") }),
    ev("tasting", { experienceType: "wine-tasting", startsAt: new Date("2026-11-04T13:00:00Z") }),
    ev("ok", { startsAt: new Date("2026-11-15T13:00:00Z") }),
  ];
  assert.equal(pickRescheduleTarget(source, list, 2, NOW)?.id, "ok");
  assert.equal(pickRescheduleTarget(source, list, 1, NOW)?.id, "full");
  assert.equal(pickRescheduleTarget(source, [ev("x", { city: "Breda" })], 1, NOW), null);
  // Closed for booking (within 48 hours) does not count.
  const close = [ev("close", { startsAt: new Date(NOW + DAY) })];
  assert.equal(pickRescheduleTarget({ ...source, startsAt: new Date(NOW - DAY) }, close, 1, NOW), null);
});

test("never to a table that closed because nobody booked it 14 days before", () => {
  const source = { id: "src", city: "Rotterdam", nameNl: "Sunday Table · 35+", startsAt: new Date("2026-10-11T13:00:00Z") };
  const empty = ev("empty", { startsAt: new Date("2026-10-15T13:00:00Z") });
  const booked = ev("booked", { startsAt: new Date("2026-10-15T13:00:00Z"), spotsSold: 2 });
  // Opened by an admin inside the last 14 days: stays open.
  const opened = ev("opened", { startsAt: new Date("2026-10-15T13:00:00Z"), bookingOpensAt: "2026-10-02T10:00:00Z" });
  assert.equal(pickRescheduleTarget(source, [empty], 1, NOW), null);
  assert.equal(pickRescheduleTarget(source, [empty, booked], 1, NOW)?.id, "booked");
  assert.equal(pickRescheduleTarget(source, [opened], 1, NOW)?.id, "opened");
});

test("moveTargets: every open Sunday in the guest's cities, soonest first", () => {
  const now = Date.parse("2026-12-01T10:00:00Z");
  const table = (id: string, city: string, startsAt: string, over: Partial<RescheduleCandidate> = {}): RescheduleCandidate => ({
    id,
    city,
    nameNl: "Sunday Social",
    startsAt: new Date(startsAt),
    capacity: 20,
    spotsSold: 5,
    workflowStatus: "published",
    experienceType: "jouw-tafel",
    comingSoon: false,
    ...over,
  });
  const source = table("own", "Amsterdam", "2026-12-13T13:00:00Z");
  const found = moveTargets(
    source,
    [
      source,
      table("utrecht", "Utrecht", "2027-01-17T13:00:00Z"),
      table("rotterdam", "Rotterdam", "2027-01-24T13:00:00Z"),
      table("earlier", "Amsterdam", "2026-12-06T13:00:00Z"),
      table("full", "Utrecht", "2027-01-10T13:00:00Z", { spotsSold: 20 }),
      table("soon", "Utrecht", "2027-02-07T13:00:00Z", { comingSoon: true }),
      table("eindhoven", "Eindhoven", "2027-01-03T13:00:00Z"),
    ],
    1,
    ["Utrecht", "Amsterdam"],
    now,
  );
  assert.deepEqual(
    found.map((e) => e.id),
    ["earlier", "utrecht"],
  );
});
