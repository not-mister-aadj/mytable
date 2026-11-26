import assert from "node:assert/strict";
import test from "node:test";
import { pickNextSundays, type Candidate } from "./next-sundays";

const now = new Date("2026-12-02T18:00:00Z");
const sunday = (id: string, city: string, iso: string, extra: Partial<Candidate> = {}): Candidate => ({
  eventId: id,
  city,
  startsAt: new Date(iso),
  capacity: 20,
  sold: 5,
  heldBack: false,
  everyoneFrom: new Date("2026-11-01T00:00:00Z"),
  membersFrom: new Date("2026-11-01T00:00:00Z"),
  bracket: null,
  ...extra,
});
const base = {
  now,
  city: "Rotterdam",
  followed: ["Rotterdam", "Den Haag"],
  member: false,
  bookedAhead: false,
  declined: new Set<string>(),
  person: { birthDate: null, ageRange: null },
  friendsOf: new Map<string, string[]>(),
};

test("next is the soonest open Sunday in their city", () => {
  const r = pickNextSundays({ ...base, candidates: [sunday("b", "Rotterdam", "2027-01-24T13:00:00Z"), sunday("a", "Rotterdam", "2027-02-21T13:00:00Z"), sunday("c", "Utrecht", "2026-12-13T13:00:00Z")] });
  assert.equal(r.next?.eventId, "b");
  assert.equal(r.friend, null);
});

test("skips full, held back, not yet on sale, declined, closing and wrong age group", () => {
  const r = pickNextSundays({
    ...base,
    declined: new Set(["declined"]),
    person: { birthDate: new Date("1995-01-01"), ageRange: null },
    candidates: [
      sunday("full", "Rotterdam", "2026-12-13T13:00:00Z", { sold: 20 }),
      sunday("held", "Rotterdam", "2026-12-20T13:00:00Z", { heldBack: true }),
      sunday("later", "Rotterdam", "2026-12-27T13:00:00Z", { everyoneFrom: new Date("2026-12-10T00:00:00Z") }),
      sunday("declined", "Rotterdam", "2027-01-03T13:00:00Z"),
      sunday("closing", "Rotterdam", "2026-12-04T13:00:00Z"),
      sunday("35plus", "Rotterdam", "2027-01-10T13:00:00Z", { bracket: "35+" }),
      sunday("ok", "Rotterdam", "2027-01-24T13:00:00Z"),
    ],
  });
  assert.equal(r.next?.eventId, "ok");
});

test("a member may book from the members' date", () => {
  const c = [sunday("x", "Rotterdam", "2027-01-24T13:00:00Z", { everyoneFrom: new Date("2026-12-20T00:00:00Z"), membersFrom: new Date("2026-11-20T00:00:00Z") })];
  assert.equal(pickNextSundays({ ...base, candidates: c }).next, null);
  assert.equal(pickNextSundays({ ...base, member: true, candidates: c }).next?.eventId, "x");
});

test("a Sunday elsewhere with a tafelvriend comes as friend; the same Sunday carries the names", () => {
  const candidates = [sunday("rdam", "Rotterdam", "2027-01-24T13:00:00Z"), sunday("dh", "Den Haag", "2027-01-31T13:00:00Z"), sunday("utr", "Utrecht", "2027-01-17T13:00:00Z")];
  const r = pickNextSundays({ ...base, candidates, friendsOf: new Map([["dh", ["Karin"]], ["utr", ["Inge"]]]) });
  assert.equal(r.next?.eventId, "rdam");
  assert.equal(r.friend?.eventId, "dh"); // Utrecht is not a city they follow
  assert.deepEqual(r.friend?.friends, ["Karin"]);

  const same = pickNextSundays({ ...base, candidates, friendsOf: new Map([["rdam", ["Karin"]]]) });
  assert.deepEqual(same.next?.friends, ["Karin"]);
  assert.equal(same.friend, null);
});

test("nothing when they already booked a coming Sunday", () => {
  const r = pickNextSundays({ ...base, bookedAhead: true, candidates: [sunday("b", "Rotterdam", "2027-01-24T13:00:00Z")] });
  assert.deepEqual(r, { next: null, friend: null });
});
