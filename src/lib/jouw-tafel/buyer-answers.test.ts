import assert from "node:assert/strict";
import { test } from "node:test";
import { buyerAnswers } from "./buyer-answers";
import { nextStep, resolveStep, type QuizAnswers } from "./quiz-logic";

test("answers from bookings, newest first", () => {
  const a = buyerAnswers([
    { name: "Scarlet Solar", birth_date: null, age_preference: null, table_language_preference: null, city: "Utrecht" },
    { name: "Scarlet", birth_date: "1990-04-02", age_preference: "similar", table_language_preference: "both_fine", city: "Amsterdam" },
  ]);
  assert.equal(a.name, "Scarlet");
  assert.equal(a.birthDate, "1990-04-02");
  assert.equal(a.ageMatters, "yes");
  assert.equal(a.language, "both");
  assert.deepEqual(a.cities, ["Utrecht", "Amsterdam"]);
});

test("a buyer goes straight to the table list", () => {
  const a = buyerAnswers([{ name: "Mirjam", birth_date: "1980-01-01", age_preference: "any", table_language_preference: null, city: "Utrecht" }]) as QuizAnswers;
  assert.equal(resolveStep(null, a, { photo: true, buyer: true }), "kies");
  assert.equal(resolveStep("kies", a, { photo: true, buyer: true }), "kies");
  // Without buyer mode the same answers still go through the onboarding.
  assert.notEqual(resolveStep(null, a, { photo: true }), "kies");
});

test("a buyer without a birth date is asked only that", () => {
  const a = buyerAnswers([{ name: "Senja", birth_date: null, age_preference: null, table_language_preference: null, city: "Utrecht" }]) as QuizAnswers;
  assert.equal(resolveStep(null, a, { buyer: true }), "geboortedatum");
});

test("after the one missing question a buyer goes to the list", () => {
  const a = buyerAnswers([{ name: "Senja", birth_date: "1990-01-01", age_preference: null, table_language_preference: null, city: "Utrecht" }]) as QuizAnswers;
  assert.equal(resolveStep(null, a, { buyer: true }), "leeftijd");
  assert.equal(nextStep("leeftijd", { ...a, ageMatters: "no" }, { buyer: true }), "zoeken");
});
