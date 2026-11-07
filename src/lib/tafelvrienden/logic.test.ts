import assert from "node:assert/strict";
import test from "node:test";
import { isLikeWindowOpen, likeWindowClosesAt, mutualMatches } from "./logic";
import { matchMail } from "../invites/logic";

test("the pick window closes the next Sunday at 18:00 Amsterdam, also across the clock change", () => {
  // Sun 8 Nov 2026 14:00 Amsterdam (winter, UTC+1)
  assert.equal(likeWindowClosesAt(new Date("2026-11-08T13:00:00Z")).toISOString(), "2026-11-15T17:00:00.000Z");
  // Sun 25 Oct 2026 14:00 Amsterdam (the day clocks went back): next Sunday 18:00 is UTC+1
  assert.equal(likeWindowClosesAt(new Date("2026-10-25T13:00:00Z")).toISOString(), "2026-11-01T17:00:00.000Z");
  // Sun 22 Mar 2027 14:00 (UTC+1) to Sun 29 Mar 2027 18:00 (summer, UTC+2)
  assert.equal(likeWindowClosesAt(new Date("2027-03-21T13:00:00Z")).toISOString(), "2027-03-28T16:00:00.000Z");
});

test("the window is open from the Sunday itself until it closes", () => {
  const sunday = new Date("2026-11-08T13:00:00Z");
  assert.equal(isLikeWindowOpen(sunday, new Date("2026-11-08T12:00:00Z")), false);
  assert.equal(isLikeWindowOpen(sunday, new Date("2026-11-08T19:00:00Z")), true);
  assert.equal(isLikeWindowOpen(sunday, new Date("2026-11-15T16:59:00Z")), true);
  assert.equal(isLikeWindowOpen(sunday, new Date("2026-11-15T17:00:00Z")), false);
});

test("mutual only when both picked each other, and an open report in either direction blocks it", () => {
  const likes = [
    { from: "Anna@x.nl", to: "sophie@x.nl" },
    { from: "sophie@x.nl", to: "anna@x.nl" },
    { from: "anna@x.nl", to: "mark@x.nl" },
    { from: "lisa@x.nl", to: "eva@x.nl" },
    { from: "eva@x.nl", to: "lisa@x.nl" },
  ];
  const m = mutualMatches(likes, [{ from: "lisa@x.nl", to: "eva@x.nl" }]);
  assert.deepEqual([...(m.get("anna@x.nl") ?? [])], ["sophie@x.nl"]);
  assert.deepEqual([...(m.get("sophie@x.nl") ?? [])], ["anna@x.nl"]);
  assert.equal(m.has("mark@x.nl"), false);
  assert.equal(m.has("lisa@x.nl"), false);
  assert.equal(m.has("eva@x.nl"), false);
});

test("match mail names nobody, counts, and promises the same venue (not the same table)", () => {
  const event = { city: "Den Haag", startsAt: "2026-12-06T13:00:00Z", priceCents: 1500, scarcity: null, url: "https://x/i/abc" };
  const two = matchMail({ name: "Sophie", cities: ["Den Haag"], event, count: 2, manageUrl: "https://x/m", locale: "nl" });
  assert.equal(two.subject, "Bekende gezichten op zondag 6 december in Den Haag");
  assert.match(two.body, /^Hoi Sophie,/);
  assert.match(two.body, /2 mensen met wie je het gezellig had komen naar de Sunday Social in Den Haag op zondag 6 december\./);
  assert.match(two.body, /dezelfde zaak/);
  assert.doesNotMatch(two.body, /zelfde tafel|samen aan tafel/);
  const one = matchMail({ name: null, cities: ["Den Haag"], event, count: 1, manageUrl: "https://x/m", locale: "en" });
  assert.match(one.body, /^Hi,/);
  assert.match(one.body, /1 person you had a good time with is coming/);
  for (const t of [two.body, one.body]) assert.ok(!t.includes("—"));
});
