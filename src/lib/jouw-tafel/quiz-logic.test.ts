// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { QuizEvent } from "./logic";
import {
  ageBracket,
  ageFromBirthDate,
  analyticsAnswer,
  buildWaitlistPreferences,
  canShowStep,
  chapterOf,
  checkoutTableLanguage,
  chooseTables,
  defaultSeats,
  dietaryNotes,
  eligibleBrackets,
  firstMissingStep,
  firstNameFromMetadata,
  nextStep,
  parseBirthDate,
  previousStep,
  quizSteps,
  resolveStep,
  sanitizeQuizState,
  stepPosition,
  tableBrackets,
  waitlistAgeRange,
  type QuizAnswers,
} from "./quiz-logic";

const NOW = Date.parse("2026-10-01T12:00:00Z");

// ------------------------------------------------------------- birth date

test("parseBirthDate: valid adult date gives iso and age", () => {
  assert.deepEqual(parseBirthDate("7", "3", "1990", NOW), { ok: true, iso: "1990-03-07", age: 36 });
  assert.deepEqual(parseBirthDate("01", "10", "1991", NOW), { ok: true, iso: "1991-10-01", age: 35 });
  // Birthday tomorrow: still 34.
  assert.deepEqual(parseBirthDate("02", "10", "1991", NOW), { ok: true, iso: "1991-10-02", age: 34 });
});

test("parseBirthDate: incomplete, impossible and future dates", () => {
  assert.deepEqual(parseBirthDate("", "3", "1990", NOW), { ok: false, error: "incomplete" });
  assert.deepEqual(parseBirthDate("7", "3", "199", NOW), { ok: false, error: "incomplete" });
  assert.deepEqual(parseBirthDate("31", "2", "1990", NOW), { ok: false, error: "invalid" });
  assert.deepEqual(parseBirthDate("1", "13", "1990", NOW), { ok: false, error: "invalid" });
  assert.deepEqual(parseBirthDate("1", "1", "2030", NOW), { ok: false, error: "invalid" });
  assert.deepEqual(parseBirthDate("1", "1", "1890", NOW), { ok: false, error: "invalid" });
  assert.deepEqual(parseBirthDate("a", "1", "1990", NOW), { ok: false, error: "invalid" });
});

test("parseBirthDate: under 18 is refused, 18 today is fine", () => {
  assert.deepEqual(parseBirthDate("2", "10", "2008", NOW), { ok: false, error: "under_18" });
  assert.deepEqual(parseBirthDate("1", "10", "2008", NOW), { ok: true, iso: "2008-10-01", age: 18 });
});

test("ageFromBirthDate reads the stored form", () => {
  assert.equal(ageFromBirthDate("1990-03-07", NOW), 36);
  assert.equal(ageFromBirthDate("2010-01-01", NOW), null);
  assert.equal(ageFromBirthDate("nonsense", NOW), null);
});

test("age groups: under 35 at 20-39, 35+ from 35, 35 to 39 fits both", () => {
  assert.equal(ageBracket(19), "20-39");
  assert.equal(ageBracket(34), "20-39");
  assert.equal(ageBracket(35), "35+");
  assert.deepEqual(eligibleBrackets(28), ["20-39"]);
  assert.deepEqual(eligibleBrackets(35), ["35+", "20-39"]);
  assert.deepEqual(eligibleBrackets(39), ["35+", "20-39"]);
  assert.deepEqual(eligibleBrackets(40), ["35+"]);
  assert.deepEqual(tableBrackets(37, "yes"), ["35+"]);
  assert.deepEqual(tableBrackets(37, "no"), ["35+", "20-39"]);
  assert.deepEqual(tableBrackets(28, "no"), ["20-39"]);
  assert.equal(waitlistAgeRange(18), "18_24");
  assert.equal(waitlistAgeRange(30), "25_34");
  assert.equal(waitlistAgeRange(44), "35_44");
  assert.equal(waitlistAgeRange(45), "45_plus");
});

// ----------------------------------------------------------------- routing

const DONE_ALONE: QuizAnswers = {
  name: "Sam",
  birthDate: "1990-03-07",
  ageMatters: "yes",
  city: "Rotterdam",
  why: ["places"],
  conversation: "both",
  wine: "red",
  companion: "alone",
  language: "dutch",
  dietary: [],
  formats: ["wine_walk"],
  heardFrom: "instagram",
  ready: "yes",
};

test("quizSteps: alone gets one stop, with someone gets 'wie' and its stop", () => {
  const alone = quizSteps({ companion: "alone" });
  assert.ok(alone.includes("stop-alleen"));
  assert.ok(!alone.includes("wie"));
  assert.ok(!alone.includes("stop-wie"));
  const withSomeone = quizSteps({ companion: "with" });
  assert.ok(!withSomeone.includes("stop-alleen"));
  assert.deepEqual(
    withSomeone.slice(withSomeone.indexOf("gezelschap"), withSomeone.indexOf("taal") + 1),
    ["gezelschap", "wie", "stop-wie", "taal"],
  );
  assert.equal(stepPosition("kies", { companion: "alone" }).total, 22);
  assert.equal(stepPosition("kies", { companion: "with" }).total, 23);
});

test("nextStep / previousStep follow the branch", () => {
  assert.equal(nextStep("welkom", {}), "naam");
  assert.equal(nextStep("gezelschap", { companion: "alone" }), "stop-alleen");
  assert.equal(nextStep("stop-alleen", { companion: "alone" }), "taal");
  assert.equal(nextStep("gezelschap", { companion: "with" }), "wie");
  assert.equal(nextStep("stop-wie", { companion: "with" }), "taal");
  assert.equal(previousStep("taal", { companion: "with" }), "stop-wie");
  assert.equal(previousStep("taal", { companion: "alone" }), "stop-alleen");
  assert.equal(previousStep("naam", {}), "welkom");
  assert.equal(previousStep("welkom", {}), null);
  // Back from the table list skips the loader.
  assert.equal(previousStep("kies", DONE_ALONE), "klaar");
  assert.equal(nextStep("kies", DONE_ALONE), null);
});

test("firstMissingStep and optional steps", () => {
  assert.equal(firstMissingStep({}), "naam");
  assert.equal(firstMissingStep({ name: "Sam" }), "geboortedatum");
  assert.equal(firstMissingStep({ ...DONE_ALONE, companion: "with" }), "wie");
  assert.equal(firstMissingStep({ ...DONE_ALONE, dietary: undefined }), "dieet");
  assert.equal(firstMissingStep(DONE_ALONE), null);
  // An under-18 date stored somehow does not count as answered.
  assert.equal(firstMissingStep({ name: "Sam", birthDate: "2015-01-01" }), "geboortedatum");
});

test("resolveStep: fresh, halfway, done, deep links", () => {
  assert.equal(resolveStep(null, {}), "welkom");
  assert.equal(resolveStep(null, { name: "Sam" }), "geboortedatum");
  assert.equal(resolveStep(null, DONE_ALONE), "kies");
  // Deep link past an unanswered question goes to that question.
  assert.equal(resolveStep("kies", { name: "Sam" }), "geboortedatum");
  assert.equal(resolveStep("wijn", { name: "Sam", birthDate: "1990-03-07" }), "leeftijd");
  // A stop after answered questions opens as asked (reload on a stop).
  assert.equal(resolveStep("stop-zoekt", DONE_ALONE), "stop-zoekt");
  // Earlier screens stay reachable for someone who is done.
  assert.equal(resolveStep("naam", DONE_ALONE), "naam");
  // A branch screen that does not belong to their path.
  assert.equal(resolveStep("wie", DONE_ALONE), "kies");
  assert.equal(resolveStep("stop-alleen", { ...DONE_ALONE, companion: "with" }), "wie");
  // Garbage is treated as no step.
  assert.equal(resolveStep("zzz", { name: "Sam" }), "geboortedatum");
  assert.equal(canShowStep("zoeken", DONE_ALONE), true);
  assert.equal(canShowStep("zoeken", { ...DONE_ALONE, ready: undefined }), false);
});

test("chapters", () => {
  assert.equal(chapterOf("welkom"), "over_jou");
  assert.equal(chapterOf("stop-stad"), "over_jou");
  assert.equal(chapterOf("zoekt"), "aan_tafel");
  assert.equal(chapterOf("dieet"), "aan_tafel");
  assert.equal(chapterOf("formats"), "jouw_zondag");
  assert.equal(chapterOf("kies"), "jouw_zondag");
});

// ----------------------------------------------------------- the table list

function event(partial: Partial<QuizEvent> & Pick<QuizEvent, "slug" | "city" | "bracket" | "startsAt">): QuizEvent {
  return {
    id: partial.slug,
    priceCents: 1000,
    capacity: 12,
    spotsSold: 0,
    comingSoon: false,
    englishOpen: false,
    ...partial,
  };
}

const EVENTS: QuizEvent[] = [
  event({ slug: "rdam-22-nov-35", city: "Rotterdam", bracket: "35+", startsAt: "2026-11-22T13:00:00Z", comingSoon: true }),
  event({ slug: "rdam-25-okt-35", city: "Rotterdam", bracket: "35+", startsAt: "2026-10-25T13:00:00Z", spotsSold: 7 }),
  event({ slug: "rdam-1-nov-20", city: "Rotterdam", bracket: "20-39", startsAt: "2026-11-01T13:00:00Z" }),
  event({ slug: "rdam-18-okt-20", city: "Rotterdam", bracket: "20-39", startsAt: "2026-10-18T13:00:00Z" }),
  event({ slug: "rdam-full", city: "Rotterdam", bracket: "20-39", startsAt: "2026-10-11T13:00:00Z", spotsSold: 12 }),
  event({ slug: "rdam-closed", city: "Rotterdam", bracket: "20-39", startsAt: "2026-10-02T13:00:00Z" }),
  event({ slug: "dh-8-nov-35", city: "Den Haag", bracket: "35+", startsAt: "2026-11-08T13:00:00Z" }),
  event({ slug: "dh-22-nov-20", city: "Den Haag", bracket: "20-39", startsAt: "2026-11-22T13:00:00Z", comingSoon: true }),
  event({ slug: "utr-29-nov-35", city: "Utrecht", bracket: "35+", startsAt: "2026-11-29T13:00:00Z", comingSoon: true }),
];

function rows(input: Parameters<typeof chooseTables>[1]) {
  return chooseTables(EVENTS, input, NOW).rows.map((r) => `${r.event.slug}:${r.kind}${r.nearby ? ":nearby" : ""}`);
}

test("chooseTables: 37 who likes their own age sees 35+ only", () => {
  assert.deepEqual(rows({ city: "Rotterdam", age: 37, ageMatters: "yes" }), [
    "rdam-25-okt-35:open",
    "dh-8-nov-35:open:nearby",
    "rdam-22-nov-35:soon",
  ]);
});

test("chooseTables: 37 who does not mind sees both groups, 35+ first", () => {
  assert.deepEqual(rows({ city: "Rotterdam", age: 37, ageMatters: "no" }), [
    "rdam-25-okt-35:open",
    "rdam-18-okt-20:open",
    "rdam-1-nov-20:open",
    "dh-8-nov-35:open:nearby",
    "rdam-22-nov-35:soon",
    "dh-22-nov-20:soon:nearby",
  ]);
});

test("chooseTables: 28 sees 20-39 only, full and closed tables drop off", () => {
  const result = chooseTables(EVENTS, { city: "Rotterdam", age: 28, ageMatters: "no" }, NOW);
  assert.equal(result.hasMatch, true);
  assert.deepEqual(rows({ city: "Rotterdam", age: 28, ageMatters: "no" }), [
    "rdam-18-okt-20:open",
    "rdam-1-nov-20:open",
    "dh-22-nov-20:soon:nearby",
  ]);
});

test("chooseTables: a nearby town finds the hub; no table at all is no match", () => {
  assert.deepEqual(rows({ city: "Delft", age: 45, ageMatters: "yes" }), [
    "rdam-25-okt-35:open:nearby",
    "dh-8-nov-35:open:nearby",
    "rdam-22-nov-35:soon:nearby",
  ]);
  const utrecht = chooseTables(EVENTS, { city: "Utrecht", age: 45, ageMatters: "yes" }, NOW);
  assert.equal(utrecht.hasMatch, false);
  assert.deepEqual(utrecht.rows.map((r) => r.kind), ["soon"]);
  const groningen = chooseTables(EVENTS, { city: "Groningen", age: 30, ageMatters: "no" }, NOW);
  assert.deepEqual(groningen, { rows: [], hasMatch: false });
});

// ------------------------------------------------- checkout and waitlist

test("seats, language and dietary notes for checkout", () => {
  assert.equal(defaultSeats({ companion: "with" }), 2);
  assert.equal(defaultSeats({ companion: "alone" }), 1);
  assert.equal(checkoutTableLanguage("dutch"), "prefer_dutch");
  assert.equal(checkoutTableLanguage("english"), "prefer_english");
  assert.equal(checkoutTableLanguage("both"), "both_fine");
  assert.equal(dietaryNotes({ dietary: ["vegetarian", "other"], dietaryOther: "geen koriander" }), "Vegetarisch, geen koriander");
  assert.equal(dietaryNotes({ dietary: ["none"] }), "");
  assert.equal(dietaryNotes({}), "");
});

test("buildWaitlistPreferences keeps the waitlist modal's shape", () => {
  const prefs = buildWaitlistPreferences(
    { ...DONE_ALONE, companion: "with", companionWho: "partner", why: ["places", "cosy"], formats: ["sunday_only"] },
    NOW,
  );
  assert.deepEqual(prefs.cities, ["Rotterdam"]);
  assert.deepEqual(prefs.ageRange, ["35_44"]);
  assert.deepEqual(prefs.why, ["discover_places", "just_fun"]);
  assert.deepEqual(prefs.company, ["bring_partner"]);
  assert.deepEqual(prefs.language, ["dutch"]);
  assert.deepEqual(prefs.tableType, ["mixed"]);
  assert.deepEqual(prefs.interests, ["sunday_table"]);
  assert.equal(prefs.birthDate, "1990-03-07");
  assert.equal(prefs.ageMatters, "yes");
  assert.equal(prefs.conversationStyle, "both");
  assert.equal(prefs.wine, "red");
  assert.equal(prefs.companion, "partner");
  assert.deepEqual(prefs.futureFormats, ["sunday_only"]);
  assert.equal(prefs.heardFrom, "instagram");
});

test("analyticsAnswer never carries personal data", () => {
  assert.equal(analyticsAnswer("naam", { name: "Sam" }), "filled");
  assert.equal(analyticsAnswer("geboortedatum", { birthDate: "1990-03-07" }), "filled");
  assert.equal(analyticsAnswer("stad", { city: "Den Haag" }), "Den Haag");
  assert.equal(analyticsAnswer("stad", { city: "Zwolle" }), "other");
  assert.equal(analyticsAnswer("dieet", { dietary: ["vegan", "other"], dietaryOther: "pinda" }), "vegan,other");
  assert.equal(analyticsAnswer("dieet", { dietary: [] }), "skipped");
  assert.equal(analyticsAnswer("zoekt", { why: ["wines", "treat"] }), "wines,treat");
});

test("sanitizeQuizState drops unknown values", () => {
  const state = sanitizeQuizState({
    v: 1,
    answers: {
      name: "  Sam  ",
      why: ["places", "hack", "cosy", "wines"],
      wine: "beer",
      birthDate: "2015-01-01",
      dietary: ["vegan", "vegan"],
      evil: "x",
    },
    startedAt: 123,
    notify: ["ok-id", "<script>"],
  });
  assert.deepEqual(state, {
    v: 1,
    answers: { name: "Sam", why: ["places", "cosy"], dietary: ["vegan"] },
    startedAt: 123,
    notify: ["ok-id"],
  });
  assert.deepEqual(sanitizeQuizState(null), { v: 1, answers: {} });
});

test("firstNameFromMetadata", () => {
  assert.equal(firstNameFromMetadata({ given_name: "Anna", full_name: "Anna de Vries" }), "Anna");
  assert.equal(firstNameFromMetadata({ full_name: "Joris van Dam" }), "Joris");
  assert.equal(firstNameFromMetadata({ name: "someone@example.com" }), "");
  assert.equal(firstNameFromMetadata({}), "");
});
