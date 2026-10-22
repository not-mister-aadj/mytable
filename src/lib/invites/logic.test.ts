import assert from "node:assert/strict";
import test from "node:test";
import {
  amsterdamParts,
  dailyCap,
  engagement,
  inviteMail,
  inviteWhy,
  isInSendWindow,
  isNoMailDay,
  isTestAddress,
  nextAllowedAt,
  nextSlot,
  nextSundayAt,
  nudgeMail,
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

test("seats: the number only when 9 or fewer are left", () => {
  assert.equal(scarcityLine({ capacity: 10, sold: 0, lastSoldOut: false }, "nl"), null);
  assert.equal(scarcityLine({ capacity: 10, sold: 0, lastSoldOut: true }, "nl"), "Loopt snel vol");
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

test("the invite opens with what they look for, and reassures solo guests", () => {
  const event = { city: "Rotterdam", startsAt: "2026-11-01T13:00:00Z", priceCents: 1000, scarcity: "Nog 8 plekken", url: "https://x/r/a1" };
  const base = { name: "Masé", cities: ["Rotterdam"], events: [event], member: false, manageUrl: "https://x/m", locale: "nl" as const };
  const cosy = inviteMail({ ...base, why: "cosy", solo: true }).body;
  assert.match(cosy, /Je zocht gezellige tafels in Rotterdam\. Er staat een tafel voor je klaar:/);
  assert.match(cosy, /Veel mensen schuiven alleen aan, net als jij\./);
  const plain = inviteMail(base).body;
  assert.match(plain, /Je volgt MyTable in Rotterdam voor gezellige wijntafels\. Er staat een tafel voor je klaar:/);
  assert.doesNotMatch(plain, /alleen aan/);
  assert.equal(inviteWhy(["other", "discover_wines"]), "wines");
  assert.equal(inviteWhy("just_fun"), "cosy");
  assert.equal(inviteWhy(null), null);
});

test("mails only go out between 08:00 and 21:30 Amsterdam", () => {
  assert.equal(isInSendWindow(new Date("2026-10-19T19:13:00Z")), true); // 21:13
  assert.equal(isInSendWindow(new Date("2026-10-19T19:31:00Z")), false); // 21:31
  assert.equal(isInSendWindow(new Date("2026-10-20T05:59:00Z")), false); // 07:59
  assert.equal(isInSendWindow(new Date("2026-10-20T06:00:00Z")), true); // 08:00
});

test("no mails on holidays: they move to the next normal day", () => {
  for (const d of ["2026-12-24", "2026-12-25", "2026-12-26", "2026-12-31", "2027-01-01", "2027-03-26", "2027-03-28", "2027-03-29", "2027-04-27", "2027-05-05", "2027-05-06", "2027-05-16", "2027-05-17", "2025-04-26"]) {
    assert.equal(isNoMailDay(d), true, d);
  }
  for (const d of ["2026-10-20", "2026-12-23", "2027-04-26", "2025-04-27"]) assert.equal(isNoMailDay(d), false, d);
  // Signed up on a Thursday; Christmas Eve 2026 is a Thursday: moved to Sunday 27 Dec (24, 25, 26 are off).
  const at = nextSlot(new Date("2026-12-22T09:00:00Z"), new Date("2026-09-03T12:00:00Z"), "x@y.nl");
  assert.equal(amsterdamParts(at).day, "2026-12-27");
  assert.equal(isInSendWindow(new Date("2026-12-25T10:00:00Z")), false);
});

test("the click reminder is on the next Sunday at 14:00, also over the clock change", () => {
  // Thursday 22 October 2026, 15:00 Amsterdam.
  const at = nextSundayAt(new Date("2026-10-22T13:00:00Z"))!;
  assert.equal(at.toISOString(), "2026-10-25T13:00:00.000Z"); // 14:00 after winter time starts
  // On a Sunday after 14:00: the Sunday after.
  assert.equal(nextSundayAt(new Date("2026-11-01T14:00:00Z"))!.toISOString(), "2026-11-08T13:00:00.000Z");
  // Easter Sunday is no mail day: a week later.
  assert.equal(amsterdamParts(nextSundayAt(new Date("2027-03-25T12:00:00Z"))!).day, "2027-04-04");
});

const sunday = new Date("2026-11-01T13:00:00Z"); // Sunday 1 November, 14:00
const base = { name: "Chris", cities: ["Amsterdam"], manageUrl: "https://x/u", locale: "nl" as const, sentAt: sunday };
const ev = (startsAt: string, scarcity: string | null = null) => ({ city: "Amsterdam", startsAt, priceCents: 1000, scarcity, url: "https://x/r/abc1" });

test("the reminder says it is 14:00 and when the table is", () => {
  const m = nudgeMail({ ...base, event: ev("2026-11-15T13:00:00Z"), soldOut: null });
  assert.equal(m.subject, "Zondag 15 november, 14:00");
  assert.match(m.body, /Het is zondag, 14:00\. Op zondag 15 november rond deze tijd zit je in Amsterdam aan tafel, met 4 tot 6 nieuwe mensen en een glas wijn\./);
  assert.match(m.body, /We denken dat dit echt iets voor jou is\. Er is nog plek\./);
  assert.doesNotMatch(m.body, /keek|looked/);
  const nextWeek = nudgeMail({ ...base, event: ev("2026-11-08T13:00:00Z", "Nog 4 plekken"), soldOut: null });
  assert.match(nextWeek.body, /Volgende week om deze tijd zit je in Amsterdam aan tafel/);
  assert.match(nextWeek.body, /Nog 4 plekken\./);
});

test("a sold-out Sunday points to the next Sunday Social", () => {
  const m = nudgeMail({ ...base, event: ev("2026-11-29T13:00:00Z"), soldOut: "2026-11-15T13:00:00Z" });
  assert.equal(m.subject, "Zondag 29 november, 14:00");
  assert.match(m.body, /De Sunday Social van zondag 15 november in Amsterdam zit vol, alle tafels zijn bezet\./);
  assert.match(m.body, /De volgende Sunday Social is op zondag 29 november, om 14:00\./);
  const en = nudgeMail({ ...base, locale: "en", event: ev("2026-11-29T13:00:00Z"), soldOut: "2026-11-15T13:00:00Z" });
  assert.match(en.body, /It's Sunday, 2pm\. The Sunday Social on Sunday 15 November in Amsterdam is full, every table is taken\./);
});
