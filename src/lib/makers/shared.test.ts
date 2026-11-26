import assert from "node:assert/strict";
import test from "node:test";
import { commissionSeats, makerCodeFromName, referralCounts, sanitizeMakerCode } from "./shared";

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
