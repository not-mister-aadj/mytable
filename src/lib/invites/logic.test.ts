import assert from "node:assert/strict";
import test from "node:test";
import {
  amsterdamParts,
  dailyCap,
  engagement,
  inviteMail,
  isTestAddress,
  nextAllowedAt,
  nextSlot,
  scarcityLine,
} from "./logic";

const DAY = 24 * 60 * 60 * 1000;

test("the slot is on the signup weekday and time, inside the window", () => {
  // Signed up on a Tuesday at 21:14 Amsterdam time (19:14 UTC in October).
  const signup = new Date("2026-09-29T19:14:00Z");
  const slot = nextSlot(new Date("2026-10-19T10:00:00Z"), signup, "seed");
  const p = amsterdamParts(slot);
  assert.equal(p.weekday, 2);
  assert.ok(Math.abs(p.minutes - (21 * 60 + 14)) <= 7 || p.minutes === 21 * 60 + 30);
  assert.ok(slot.getTime() >= Date.parse("2026-10-19T10:00:00Z"));
});

test("a night-time signup is moved into the morning", () => {
  const signup = new Date("2026-09-29T00:30:00Z"); // 02:30 Amsterdam
  const p = amsterdamParts(nextSlot(new Date("2026-10-19T10:00:00Z"), signup, "x"));
  assert.ok(p.minutes >= 8 * 60 && p.minutes <= 8 * 60 + 7);
});

test("one invite a month, two for more than two cities, one per two months when slowed", () => {
  const last = new Date("2026-10-01T10:00:00Z");
  assert.equal(nextAllowedAt([last], 1, false)?.getTime(), last.getTime() + 30 * DAY);
  assert.equal(nextAllowedAt([last], 3, false)?.getTime(), last.getTime() + 10 * DAY);
  const earlier = new Date("2026-09-20T10:00:00Z");
  assert.equal(nextAllowedAt([last, earlier], 3, false)?.getTime(), earlier.getTime() + 30 * DAY);
  assert.equal(nextAllowedAt([last], 1, true)?.getTime(), last.getTime() + 60 * DAY);
  assert.equal(nextAllowedAt([], 1, false), null);
});

test("ignored invites slow down, then ask, then stop", () => {
  const now = new Date("2026-12-31T10:00:00Z");
  const sent = (daysAgo: number, engaged = false, kind: "invite" | "checkin" = "invite") => ({
    sentAt: new Date(now.getTime() - daysAgo * DAY),
    kind,
    engaged,
  });
  assert.equal(engagement([sent(40), sent(70)], now).status, "active");
  assert.equal(engagement([sent(40), sent(70), sent(100)], now).status, "slow");
  assert.equal(engagement([sent(10), sent(40), sent(70), sent(100), sent(130)], now).status, "checkin");
  assert.equal(engagement([sent(3, false, "checkin"), sent(40), sent(70), sent(100), sent(130), sent(160)], now).status, "checkin");
  assert.equal(engagement([sent(20, false, "checkin"), sent(40), sent(70), sent(100), sent(130), sent(160)], now).status, "stopped");
  assert.equal(engagement([sent(20, true, "checkin"), sent(40), sent(70)], now).status, "active");
  // A click resets the count.
  assert.equal(engagement([sent(40), sent(70, true), sent(100), sent(130)], now).status, "active");
});

test("seats: the number only when 10 or fewer are left", () => {
  assert.equal(scarcityLine({ capacity: 20, sold: 2, lastSoldOut: false }, "nl"), null);
  assert.equal(scarcityLine({ capacity: 20, sold: 11, lastSoldOut: false }, "nl"), "Nog 9 plekken");
  assert.equal(scarcityLine({ capacity: 30, sold: 16, lastSoldOut: false }, "nl"), "Loopt snel vol");
  assert.equal(scarcityLine({ capacity: 30, sold: 2, lastSoldOut: true }, "en"), "Filling up fast");
  assert.equal(scarcityLine({ capacity: 10, sold: 9, lastSoldOut: false }, "nl"), "Nog 1 plek");
  assert.equal(scarcityLine({ capacity: 10, sold: 10, lastSoldOut: false }, "nl"), null);
});

test("the invite lists every Sunday under each other, soonest first", () => {
  const { subject, body } = inviteMail({
    name: "Tom",
    cities: ["Rotterdam", "Amsterdam"],
    events: [
      { city: "Rotterdam", startsAt: "2026-11-29T13:00:00Z", priceCents: 1000, scarcity: null, url: "https://x/2" },
      { city: "Amsterdam", startsAt: "2026-11-15T13:00:00Z", priceCents: 1000, scarcity: "Nog 6 plekken", url: "https://x/1" },
    ],
    member: false,
    manageUrl: "https://x/m",
    locale: "nl",
  });
  assert.equal(subject, "Je uitnodiging: 2 zondagen in november");
  assert.ok(body.indexOf("Amsterdam\nNog 6 plekken\nhttps://x/1") < body.indexOf("Zondag 29 november, 14:00, Rotterdam"));
  assert.match(body, /Een plek kost €10\./);
  assert.match(body, /Je krijgt dit omdat je Rotterdam en Amsterdam volgt/);
  assert.doesNotMatch(body, /—/);
});

test("the daily cap grows per week", () => {
  const s = { startedAt: "2026-10-01T00:00:00Z", capStart: 50, capGrowthPerWeek: 10 };
  assert.equal(dailyCap(s, new Date("2026-10-03T00:00:00Z")), 50);
  assert.equal(dailyCap(s, new Date("2026-10-16T00:00:00Z")), 70);
});

test("age groups: only left out when we know they don't fit", async () => {
  const { fitsBracket } = await import("./logic");
  const sunday = "2026-11-01T13:00:00Z";
  assert.equal(fitsBracket("20-39", { ageRange: "45_plus", birthDate: null }, sunday), false);
  assert.equal(fitsBracket("20-39", { ageRange: "35_44", birthDate: null }, sunday), true);
  assert.equal(fitsBracket("35+", { ageRange: "25_34", birthDate: null }, sunday), false);
  assert.equal(fitsBracket("35+", { ageRange: null, birthDate: null }, sunday), true);
  assert.equal(fitsBracket("20-39", { ageRange: "35_44", birthDate: new Date("1983-10-25T00:00:00Z") }, sunday), false);
  assert.equal(fitsBracket("20-39", { ageRange: "35_44", birthDate: new Date("1990-03-05T00:00:00Z") }, sunday), true);
  assert.equal(fitsBracket(null, { ageRange: "45_plus", birthDate: null }, sunday), true);
});

test("test signups are never invited", () => {
  for (const e of ["testina-verify@example.com", "test-sophie-rot2@example.com", "siraaadj+test1@gmail.com", "a@b.invalid", "test1@gmail.com"]) {
    assert.equal(isTestAddress(e), true, e);
  }
  for (const e of ["angeliqueraeven@gmail.com", "tessa@gmail.com", "testerman@hotmail.com", "anna@example-bakery.nl"]) {
    assert.equal(isTestAddress(e), false, e);
  }
});
