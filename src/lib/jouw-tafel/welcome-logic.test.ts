// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { QuizEvent } from "./logic";
import { ACCOUNT_WELCOME_DELAY_MS, accountWelcomeVariant, isAccountWelcomeDue } from "./welcome-logic";

const NOW = Date.parse("2026-10-10T12:00:00Z");
const SINCE = Date.parse("2026-10-05T00:00:00Z");
const MIN = 60_000;

function ev(city: string, partial: Partial<QuizEvent> = {}): QuizEvent {
  return {
    id: city, slug: city, city, bracket: "35+", startsAt: "2026-10-25T13:00:00Z",
    priceCents: 1500, capacity: 12, spotsSold: 0, comingSoon: false, englishOpen: false, ...partial,
  };
}

test("due 30 minutes after the quiz, only after deploy, not years back", () => {
  assert.equal(isAccountWelcomeDue(NOW - 31 * MIN, NOW, SINCE), true);
  assert.equal(isAccountWelcomeDue(NOW - ACCOUNT_WELCOME_DELAY_MS + 1, NOW, SINCE), false);
  assert.equal(isAccountWelcomeDue(Date.parse("2026-10-04T12:00:00Z"), Date.parse("2026-10-05T12:00:00Z"), SINCE), false);
  assert.equal(isAccountWelcomeDue(NOW - 3 * 24 * 60 * MIN, NOW, SINCE), false);
  assert.equal(isAccountWelcomeDue(undefined, NOW, SINCE), false);
});

test("variant A lists her cities with an open table, B all her cities", () => {
  const events = [ev("Rotterdam"), ev("Den Haag"), ev("Utrecht", { comingSoon: true }), ev("Breda", { spotsSold: 12 })];
  assert.deepEqual(accountWelcomeVariant(["Rotterdam", "Den Haag", "Zwolle"], events, NOW, "nl"), {
    variant: "open",
    cities: ["Rotterdam", "Den Haag"],
  });
  assert.deepEqual(accountWelcomeVariant(["Den Haag"], events, NOW, "en"), { variant: "open", cities: ["The Hague"] });
  assert.deepEqual(accountWelcomeVariant(["Utrecht", "Breda"], events, NOW, "nl"), { variant: "none", cities: ["Utrecht", "Breda"] });
  assert.deepEqual(accountWelcomeVariant(["Zwolle"], events, NOW, "nl"), { variant: "none", cities: ["Zwolle"] });
  // Closed for booking (within 48 hours) does not count as open.
  const soon = [ev("Rotterdam", { startsAt: "2026-10-11T13:00:00Z" })];
  assert.equal(accountWelcomeVariant(["Rotterdam"], soon, NOW, "nl").variant, "none");
});
