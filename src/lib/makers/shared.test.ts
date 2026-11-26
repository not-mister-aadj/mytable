import assert from "node:assert/strict";
import test from "node:test";
import { commissionCents, makerEstimate, commissionSeats, makerCodeFromName, referralCounts, sanitizeMakerCode } from "./shared";

test("maker code: letters and digits, upper case", () => {
  assert.equal(sanitizeMakerCode(" sanne "), "SANNE");
  assert.equal(sanitizeMakerCode("eet2"), "EET2");
  assert.equal(sanitizeMakerCode("a"), null);
  assert.equal(sanitizeMakerCode("san ne"), null);
  assert.equal(sanitizeMakerCode("<script>"), null);
  assert.equal(sanitizeMakerCode(null), null);
});

test("maker code from a name: the first name without accents", () => {
  assert.equal(makerCodeFromName("Sanne de Vries"), "SANNE");
  assert.equal(makerCodeFromName("Élise"), "ELISE");
  assert.equal(makerCodeFromName("x"), "MAKER");
});

test("a paid referral counts for two years", () => {
  const created = new Date("2026-12-01T12:00:00Z");
  const r = { createdAt: created, firstPaidAt: created };
  assert.equal(referralCounts(r, new Date("2028-11-30T12:00:00Z")), true);
  assert.equal(referralCounts(r, new Date("2028-12-02T12:00:00Z")), false);
});

test("an unpaid referral lapses after 30 days", () => {
  const r = { createdAt: new Date("2026-12-01T12:00:00Z"), firstPaidAt: null };
  assert.equal(referralCounts(r, new Date("2026-12-20T12:00:00Z")), true);
  assert.equal(referralCounts(r, new Date("2027-01-02T12:00:00Z")), false);
});

test("the free friend never earns a commission", () => {
  assert.equal(commissionSeats(2, true, 1000), 1);
  assert.equal(commissionSeats(2, false, 2000), 2);
  assert.equal(commissionSeats(1, false, 0), 0);
});

test("commission: €7 per paid seat, €3,50 for the half-price seat", () => {
  assert.equal(commissionCents({ seats: 2, freeSeat: true, halfSeat: false, amountCents: 1000 }), 700);
  assert.equal(commissionCents({ seats: 1, freeSeat: false, halfSeat: true, amountCents: 500 }), 350);
  assert.equal(commissionCents({ seats: 2, freeSeat: false, halfSeat: true, amountCents: 1500 }), 1050);
  assert.equal(commissionCents({ seats: 2, freeSeat: false, halfSeat: false, amountCents: 2000 }), 1400);
  assert.equal(commissionCents({ seats: 1, freeSeat: false, halfSeat: false, amountCents: 0 }), 0);
});

test("estimate: 5 a month is 60 people, 240 seats, 8 members, €2.352", () => {
  assert.deepEqual(makerEstimate(5), { people: 60, seats: 240, members: 8, totalCents: 235_200 });
  assert.equal(makerEstimate(0).totalCents, 0);
});
