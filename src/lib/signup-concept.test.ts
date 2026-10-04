// Run with: npx tsx --test src/lib/signup-concept.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { conceptStats, personConcepts, rowHasAccount, signupConcept } from "./signup-concept";

test("a row's concept follows its first touch", () => {
  assert.equal(signupConcept({ source: "jouw_tafel", preferences: {} }), "account");
  assert.equal(signupConcept({ source: "waitlist", preferences: { cities: ["Rotterdam"] } }), "waitlist");
  assert.equal(signupConcept({ source: "newsletter", preferences: null }), "waitlist");
  // Old-funnel row the quiz merged into: stays waitlist, but has an account.
  const merged = { source: "waitlist", preferences: { quizVersion: 1, has_account: true } };
  assert.equal(signupConcept(merged), "waitlist");
  assert.equal(rowHasAccount(merged), true);
  // Quiz row from before the jouw_tafel source existed.
  assert.equal(signupConcept({ source: "waitlist", preferences: { quizVersion: 1 } }), "account");
});

test("per person: earliest row decides, any account row marks the overlap", () => {
  const people = personConcepts([
    { email: "A@x.nl", source: "jouw_tafel", preferences: {}, createdAt: new Date("2026-10-02T10:00:00Z") },
    { email: "a@x.nl", source: "waitlist", preferences: {}, createdAt: new Date("2026-10-01T10:00:00Z") },
    { email: "b@x.nl", source: "jouw_tafel", preferences: {}, createdAt: new Date("2026-10-03T10:00:00Z") },
    { email: "c@x.nl", source: "waitlist", preferences: {}, createdAt: new Date("2026-09-01T10:00:00Z") },
  ]);
  assert.deepEqual(people.get("a@x.nl")?.concept, "waitlist");
  assert.equal(people.get("a@x.nl")?.hasAccount, true);
  assert.equal(people.get("b@x.nl")?.concept, "account");
  assert.equal(people.get("c@x.nl")?.hasAccount, false);

  const stats = conceptStats(people.values(), new Date("2026-10-04T12:00:00Z"), 5);
  assert.deepEqual(stats.total, { waitlist: 2, account: 1 });
  assert.deepEqual(stats.last7d, { waitlist: 1, account: 1 });
  assert.equal(stats.overlap, 1);
  assert.equal(stats.perDay.length, 5);
  assert.deepEqual(stats.perDay.find((d) => d.day === "2026-10-03"), { day: "2026-10-03", waitlist: 0, account: 1 });
  assert.deepEqual(stats.perDay.find((d) => d.day === "2026-10-01"), { day: "2026-10-01", waitlist: 1, account: 0 });
});
