import assert from "node:assert/strict";
import test from "node:test";
import { planSavingsCents } from "@/lib/membership/plans";
import { memberReserveTodayCents } from "@/lib/membership/reserve-logic";

test("joining: the first period, plus the guest at the plan's member price", () => {
  assert.equal(memberReserveTodayCents({ kind: "join", plan: "4m", seats: 1 }), 3600);
  assert.equal(memberReserveTodayCents({ kind: "join", plan: "4m", seats: 2 }), 3600 + 900);
  assert.equal(memberReserveTodayCents({ kind: "join", plan: "1m", seats: 2 }), 1299 + 1299);
  assert.equal(memberReserveTodayCents({ kind: "join", plan: "12m", seats: 2 }), 9900 + 825);
});

test("a member: own seat free, only a guest pays", () => {
  assert.equal(memberReserveTodayCents({ kind: "included", plan: "4m", seats: 1 }), 0);
  assert.equal(memberReserveTodayCents({ kind: "included", plan: "12m", seats: 2 }), 825);
});

test("plan savings: the first period against a single seat every month", () => {
  assert.equal(planSavingsCents("1m", 1500), 201);
  assert.equal(planSavingsCents("4m", 1500), 2400);
  assert.equal(planSavingsCents("12m", 1500), 8100);
  assert.equal(planSavingsCents("4m", 800), 0);
});
