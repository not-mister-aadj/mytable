// Run with: npx tsx --test src/lib/jouw-tafel/*.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { QuizEvent } from "./logic";
import { getQuizCopy } from "./quiz-copy";
import {
  ageBracket,
  ageFromBirthDate,
  analyticsAnswer,
  buildWaitlistPreferences,
  canShowStep,
  chapterOf,
  checkoutTableLanguage,
  chooseTables,
  chooseTablesForAnswers,
  cityMask,
  cityStepAnswer,
  defaultSeats,
  dietaryNotes,
  eligibleBrackets,
  firstMissingStep,
  firstNameFromMetadata,
  infoPrice,
  kiesCities,
  nextStep,
  parseBirthDate,
  previousStep,
  quizSteps,
  resolveStep,
  sanitizeQuizState,
  shouldSendQuizLead,
  signupCountsBySubset,
  stepPosition,
  stopCityCount,
  stopStadContent,
  stopZoektAnswer,
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
  gender: "male",
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
  assert.equal(stepPosition("kies", { companion: "alone" }).total, 23);
  assert.equal(stepPosition("kies", { companion: "with" }).total, 24);
  assert.equal(stepPosition("kies", { companion: "alone", ready: "unsure" }).total, 24);
});

test("gender: women get the table type question, everyone else skips it", () => {
  const woman = quizSteps({ gender: "female" });
  assert.deepEqual(woman.slice(woman.indexOf("leeftijd"), woman.indexOf("stad") + 1), [
    "leeftijd",
    "gender",
    "tafeltype",
    "stad",
  ]);
  for (const gender of ["male", "other", "unspecified"] as const) {
    const steps = quizSteps({ gender });
    assert.ok(!steps.includes("tafeltype"), gender);
    assert.equal(nextStep("gender", { gender }), "stad");
  }
  assert.ok(!quizSteps({}).includes("tafeltype"));
  assert.equal(nextStep("gender", { gender: "female" }), "tafeltype");
  assert.equal(previousStep("stad", { gender: "female" }), "tafeltype");
  assert.equal(previousStep("stad", { gender: "male" }), "gender");
  assert.equal(chapterOf("gender"), "over_jou");
  assert.equal(chapterOf("tafeltype"), "over_jou");
  // Answered or not.
  assert.equal(firstMissingStep({ ...DONE_ALONE, gender: "female" }), "tafeltype");
  assert.equal(firstMissingStep({ ...DONE_ALONE, gender: "female", tableType: "any" }), null);
  assert.equal(stepPosition("kies", { companion: "alone", gender: "female" }).total, 24);
  assert.equal(analyticsAnswer("gender", { gender: "unspecified" }), "unspecified");
  assert.equal(analyticsAnswer("tafeltype", { gender: "female", tableType: "girls_only" }), "girls_only");
});

test("resume: an old finished state without gender asks gender next", () => {
  const { gender: _gender, ...old } = DONE_ALONE;
  void _gender;
  assert.equal(firstMissingStep(old), "gender");
  assert.equal(resolveStep(null, old), "gender");
  assert.equal(resolveStep("kies", old), "gender");
  // The old answers stay.
  assert.equal(sanitizeQuizState({ v: 1, answers: old }).answers.city, "Rotterdam");
});

test("stop-twijfel: only after 'Nog niet zeker'", () => {
  const unsure = { ...DONE_ALONE, ready: "unsure" as const };
  assert.ok(quizSteps(unsure).includes("stop-twijfel"));
  assert.ok(!quizSteps(DONE_ALONE).includes("stop-twijfel"));
  assert.ok(!quizSteps({}).includes("stop-twijfel"));
  assert.equal(nextStep("klaar", unsure), "stop-twijfel");
  assert.equal(nextStep("stop-twijfel", unsure), "zoeken");
  assert.equal(nextStep("klaar", DONE_ALONE), "zoeken");
  assert.equal(previousStep("kies", unsure), "stop-twijfel");
  assert.equal(previousStep("kies", DONE_ALONE), "klaar");
  assert.equal(chapterOf("stop-twijfel"), "jouw_zondag");
  assert.equal(stepPosition("stop-twijfel", unsure).index, stepPosition("klaar", unsure).index + 1);
  assert.equal(stepPosition("kies", unsure).total, stepPosition("kies", DONE_ALONE).total + 1);
  assert.equal(resolveStep("stop-twijfel", unsure), "stop-twijfel");
  assert.equal(resolveStep("stop-twijfel", DONE_ALONE), "kies");
  assert.equal(firstMissingStep(unsure), null);
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
  assert.deepEqual(rows({ cities: ["Rotterdam"], age: 37, ageMatters: "yes" }), [
    "rdam-25-okt-35:open",
    "dh-8-nov-35:open:nearby",
    "rdam-22-nov-35:soon",
  ]);
});

test("chooseTables: 37 who does not mind sees both groups, 35+ first", () => {
  assert.deepEqual(rows({ cities: ["Rotterdam"], age: 37, ageMatters: "no" }), [
    "rdam-25-okt-35:open",
    "rdam-18-okt-20:open",
    "rdam-1-nov-20:open",
    "dh-8-nov-35:open:nearby",
    "rdam-22-nov-35:soon",
    "dh-22-nov-20:soon:nearby",
  ]);
});

test("chooseTables: 28 sees 20-39 only, full and closed tables drop off", () => {
  const result = chooseTables(EVENTS, { cities: ["Rotterdam"], age: 28, ageMatters: "no" }, NOW);
  assert.equal(result.hasMatch, true);
  assert.deepEqual(rows({ cities: ["Rotterdam"], age: 28, ageMatters: "no" }), [
    "rdam-18-okt-20:open",
    "rdam-1-nov-20:open",
    "dh-22-nov-20:soon:nearby",
  ]);
});

test("chooseTables: a place that is not ours has no tables of its own; no table at all is no match", () => {
  assert.deepEqual(rows({ cities: ["Delft"], age: 45, ageMatters: "yes" }), []);
  const utrecht = chooseTables(EVENTS, { cities: ["Utrecht"], age: 45, ageMatters: "yes" }, NOW);
  assert.equal(utrecht.hasMatch, false);
  assert.deepEqual(utrecht.rows.map((r) => r.kind), ["soon"]);
  const groningen = chooseTables(EVENTS, { cities: ["Groningen"], age: 30, ageMatters: "no" }, NOW);
  assert.deepEqual(groningen, { rows: [], hasMatch: false });
});

test("chooseTables: two cities, in the order they were picked", () => {
  const result = chooseTables(EVENTS, { cities: ["Den Haag", "Rotterdam"], age: 37, ageMatters: "no" }, NOW);
  assert.equal(result.hasMatch, true);
  assert.deepEqual(rows({ cities: ["Den Haag", "Rotterdam"], age: 37, ageMatters: "no" }), [
    "dh-8-nov-35:open",
    "rdam-25-okt-35:open",
    "rdam-18-okt-20:open",
    "rdam-1-nov-20:open",
    "dh-22-nov-20:soon",
    "rdam-22-nov-35:soon",
  ]);
});

test("chooseTables: nearby means not in any chosen city", () => {
  assert.deepEqual(rows({ cities: ["Den Haag"], age: 45, ageMatters: "yes" }), [
    "dh-8-nov-35:open",
    "rdam-25-okt-35:open:nearby",
    "rdam-22-nov-35:soon:nearby",
  ]);
  // Delft adds nothing: only ours count, Utrecht is not near anything.
  assert.deepEqual(rows({ cities: ["Utrecht", "Delft"], age: 45, ageMatters: "yes" }), ["utr-29-nov-35:soon"]);
  // A chosen city is never listed as nearby, even when it is near another.
  assert.deepEqual(rows({ cities: ["Rotterdam", "Den Haag"], age: 45, ageMatters: "yes" }), [
    "rdam-25-okt-35:open",
    "dh-8-nov-35:open",
    "rdam-22-nov-35:soon",
  ]);
});

test("kiesCities: name only chosen cities with tables here; ours without get a line", () => {
  const input = { age: 45, ageMatters: "yes" as const };
  // Den Haag has its own table, Utrecht only a coming-soon one, Breda none.
  const r = chooseTables(EVENTS, { ...input, cities: ["Den Haag", "Utrecht", "Breda", "Zwolle"] }, NOW).rows;
  assert.deepEqual(kiesCities(["Den Haag", "Utrecht", "Breda", "Zwolle"], r), {
    named: ["Den Haag", "Utrecht"],
    noSunday: ["Breda"],
  });
  // Rotterdam with a table of its own.
  const rd = chooseTables(EVENTS, { ...input, cities: ["Rotterdam"] }, NOW).rows;
  assert.deepEqual(kiesCities(["Rotterdam"], rd), { named: ["Rotterdam"], noSunday: [] });
  // Only nearby tables: named (tables around it), but no Sunday of its own.
  const onlyNear = rd.filter((row) => row.event.city === "Rotterdam").map((row) => ({ ...row, nearby: true }));
  assert.deepEqual(kiesCities(["Den Haag"], onlyNear), { named: ["Den Haag"], noSunday: ["Den Haag"] });
});

test("infoPrice: the lowest price on the list, 'from' when they differ", () => {
  const r = chooseTables(EVENTS, { cities: ["Rotterdam"], age: 37, ageMatters: "no" }, NOW).rows;
  assert.deepEqual(infoPrice(r), { cents: 1000, from: false });
  const mixed = r.map((row, i) => ({ ...row, event: { ...row.event, priceCents: i === 0 ? 1500 : 1200 } }));
  assert.deepEqual(infoPrice(mixed), { cents: 1200, from: true });
  assert.equal(infoPrice([]), null);
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

test("buildWaitlistPreferences lists every chosen city, primary first", () => {
  const prefs = buildWaitlistPreferences(
    { ...DONE_ALONE, city: "Rotterdam", cities: ["Rotterdam", "Den Haag", "Zwolle"] },
    NOW,
  );
  assert.deepEqual(prefs.cities, ["Rotterdam", "Den Haag", "Zwolle"]);
  // An old state with only `city`.
  assert.deepEqual(buildWaitlistPreferences({ city: "Utrecht" }, NOW).cities, ["Utrecht"]);
});

test("the city step is answered with at least one city", () => {
  const { city: _city, ...noCity } = DONE_ALONE;
  void _city;
  assert.equal(firstMissingStep(noCity), "stad");
  assert.equal(firstMissingStep({ ...noCity, cities: [] }), "stad");
  assert.equal(firstMissingStep({ ...noCity, cities: ["Zwolle"] }), null);
  // Old state: `city` alone still counts.
  assert.equal(firstMissingStep(DONE_ALONE), null);
});

test("cityStepAnswer: order kept, a place stays its own place", () => {
  // Delft is never Rotterdam or Den Haag: whoever wants Rotterdam ticks it.
  assert.deepEqual(cityStepAnswer(["Rotterdam", "Delft"]), { cities: ["Rotterdam", "Delft"], city: "Rotterdam" });
  assert.deepEqual(cityStepAnswer(["Delft"]), { cities: ["Delft"], city: "Delft" });
  assert.deepEqual(cityStepAnswer(["Zwolle", "Den Haag", "Rotterdam"]), {
    cities: ["Zwolle", "Den Haag", "Rotterdam"],
    city: "Zwolle",
  });
  assert.deepEqual(cityStepAnswer(["Den Haag", "den haag"]), { cities: ["Den Haag"], city: "Den Haag" });
  const empty = cityStepAnswer([]);
  assert.equal(empty.cities, undefined);
  assert.equal(empty.city, undefined);
});

test("waitlist preferences: gender as is, table type mapped", () => {
  const prefs = (a: QuizAnswers) => buildWaitlistPreferences({ ...DONE_ALONE, ...a }, NOW);
  assert.deepEqual(prefs({ gender: "female", tableType: "mixed" }).tableType, ["mixed"]);
  assert.deepEqual(prefs({ gender: "female", tableType: "girls_only" }).tableType, ["girls_only"]);
  assert.deepEqual(prefs({ gender: "female", tableType: "any" }).tableType, ["mixed", "girls_only"]);
  // Not asked: a mixed table.
  assert.deepEqual(prefs({ gender: "male" }).tableType, ["mixed"]);
  assert.deepEqual(prefs({ gender: "female" }).tableType, ["mixed"]);
  assert.deepEqual(prefs({ gender: "male", tableType: "girls_only" }).tableType, ["mixed"]);
  assert.deepEqual(prefs({ gender: "unspecified" }).gender, ["unspecified"]);
  assert.deepEqual(prefs({ gender: "female" }).gender, ["female"]);
  assert.deepEqual(prefs({ gender: undefined }).gender, []);
});

test("sanitizeQuizState: gender and table type", () => {
  assert.deepEqual(sanitizeQuizState({ v: 1, answers: { gender: "female", tableType: "any" } }).answers, {
    gender: "female",
    tableType: "any",
  });
  // Table type only for women; unknown values dropped.
  assert.deepEqual(sanitizeQuizState({ v: 1, answers: { gender: "male", tableType: "girls_only" } }).answers, {
    gender: "male",
  });
  assert.deepEqual(sanitizeQuizState({ v: 1, answers: { gender: "robot", tableType: "vip" } }).answers, {});
});

test("analyticsAnswer never carries personal data", () => {
  assert.equal(analyticsAnswer("naam", { name: "Sam" }), "filled");
  assert.equal(analyticsAnswer("geboortedatum", { birthDate: "1990-03-07" }), "filled");
  assert.equal(analyticsAnswer("stad", { city: "Den Haag" }), "Den Haag");
  assert.equal(analyticsAnswer("stad", { city: "Zwolle" }), "other");
  assert.equal(analyticsAnswer("stad", { city: "Rotterdam", cities: ["Rotterdam", "Den Haag", "Zwolle"] }), "Rotterdam,Den Haag,other");
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

test("sanitizeQuizState: an old single city becomes a list of one", () => {
  assert.deepEqual(sanitizeQuizState({ v: 1, answers: { city: " Rotterdam " } }).answers, {
    city: "Rotterdam",
    cities: ["Rotterdam"],
  });
});

test("sanitizeQuizState: cities are cleaned, deduped, capped, city is the first", () => {
  const state = sanitizeQuizState({
    v: 1,
    answers: { city: "Utrecht", cities: ["  Den   Haag ", "den haag", "Rotterdam", 5, "", "ROTTERDAM", "Zwolle"] },
  });
  assert.deepEqual(state.answers, { city: "Den Haag", cities: ["Den Haag", "Rotterdam", "Zwolle"] });
  const many = sanitizeQuizState({
    v: 1,
    answers: { cities: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"] },
  });
  assert.equal(many.answers.cities?.length, 8);
  assert.equal(many.answers.city, "A1");
  // An empty list falls back to the old city.
  assert.deepEqual(sanitizeQuizState({ v: 1, answers: { city: "Breda", cities: [] } }).answers.cities, ["Breda"]);
});

test("stopCityCount: the chosen city with the highest count, never a sum", () => {
  const counts = { Rotterdam: 120, "Den Haag": 340, Utrecht: 100 };
  assert.deepEqual(stopCityCount(["Rotterdam"], counts), { city: "Rotterdam", n: 120 });
  assert.deepEqual(stopCityCount(["Rotterdam", "Den Haag", "Zwolle"], counts), { city: "Den Haag", n: 340 });
  // Any spelling of our city matches.
  assert.deepEqual(stopCityCount(["the hague"], counts), { city: "the hague", n: 340 });
  assert.equal(stopCityCount(["Zwolle", "Breda"], counts), null);
  assert.equal(stopCityCount([], counts), null);
});

test("signupCountsBySubset: distinct people per combination of our cities", () => {
  const rows: { email: string; city: string }[] = [];
  // 60 only in Rotterdam, 50 only in Den Haag, 40 in both, 30 in Utrecht.
  for (let i = 0; i < 60; i++) rows.push({ email: `r${i}@x.nl`, city: "Rotterdam" });
  for (let i = 0; i < 50; i++) rows.push({ email: `d${i}@x.nl`, city: "Den Haag" });
  for (let i = 0; i < 40; i++) {
    rows.push({ email: `b${i}@x.nl`, city: "Rotterdam" });
    rows.push({ email: `B${i}@X.nl`, city: "the hague" });
  }
  for (let i = 0; i < 30; i++) rows.push({ email: `u${i}@x.nl`, city: "Utrecht" });
  rows.push({ email: "z@x.nl", city: "Zwolle" });
  const counts = signupCountsBySubset(rows);
  const rd = cityMask(["Rotterdam", "Den Haag"]);
  assert.equal(rd, 0b11);
  assert.equal(counts[String(rd)], 150); // 60 + 50 + 40, not 100 + 90
  assert.equal(counts[String(cityMask(["Rotterdam"]))], 100);
  assert.equal(counts[String(cityMask(["Den Haag"]))], undefined); // 90, under 100
  assert.equal(counts[String(cityMask(["Utrecht"]))], undefined); // under 100
  assert.equal(counts[String(cityMask(["Rotterdam", "Den Haag", "Utrecht"]))], 180);
  assert.equal(cityMask(["Zwolle"]), 0);
});

test("stopStadContent: one city, two, three, four or more, under and over 100", () => {
  const nl = getQuizCopy("nl");
  const en = getQuizCopy("en");
  const cityCounts = { Rotterdam: 120 };
  const rdz = cityMask(["Rotterdam", "Den Haag"]);
  const many = cityMask(["Rotterdam", "Den Haag", "Utrecht", "Breda"]);
  const subset = { [String(rdz)]: 150, [String(many)]: 400 };

  assert.deepEqual(stopStadContent(nl, "nl", ["Rotterdam"], cityCounts, subset), {
    title: "Je bent niet de enige in Rotterdam.",
    countLine: "In Rotterdam hebben zich al 120+ mensen aangemeld.",
    perCity: null,
    waitlistLine: null,
    stat: { n: 120, label: "aangemeld in Rotterdam" },
  });
  assert.deepEqual(stopStadContent(nl, "nl", ["Breda"], cityCounts, subset), {
    title: "Je bent niet de enige in Breda.",
    countLine: null,
    perCity: null,
    waitlistLine: null,
    stat: null,
  });

  const two = stopStadContent(nl, "nl", ["Rotterdam", "Den Haag"], cityCounts, subset);
  assert.equal(two.title, "Je bent in goed gezelschap.");
  assert.equal(two.countLine, "In Rotterdam en Den Haag hebben zich al 150+ mensen aangemeld.");
  assert.equal(two.perCity, "Straks zie je per stad welke zondagen er zijn.");
  assert.equal(two.stat, null);

  const rdu = cityMask(["Rotterdam", "Den Haag", "Utrecht"]);
  const three = stopStadContent(en, "en", ["Rotterdam", "Den Haag", "Utrecht"], cityCounts, { ...subset, [String(rdu)]: 210 });
  assert.equal(three.title, "You're in good company.");
  assert.equal(three.countLine, "210+ people in Rotterdam, The Hague and Utrecht have already signed up.");
  assert.equal(three.perCity, "Next, you'll see the Sundays in each city.");

  const four = stopStadContent(nl, "nl", ["Rotterdam", "Den Haag", "Utrecht", "Breda"], cityCounts, subset);
  assert.equal(four.countLine, "In de steden die jij koos hebben zich al 400+ mensen aangemeld.");

  // Under 100 (not in the counts) or no count at all: the fallback.
  const under = stopStadContent(nl, "nl", ["Utrecht", "Breda"], cityCounts, subset);
  assert.deepEqual(under, {
    title: "Meer steden, meer zondagen.",
    countLine: null,
    perCity: "Straks zie je per stad welke zondagen er zijn.",
    waitlistLine: null,
    stat: null,
  });
  assert.equal(stopStadContent(en, "en", ["Rotterdam", "Den Haag"], {}, {}).title, "More cities, more Sundays.");
});

test("stopStadContent: only towns outside our cities are a waitlist, never a count", () => {
  const nl = getQuizCopy("nl");
  const en = getQuizCopy("en");
  const counts = { Zwolle: 300 };
  assert.deepEqual(stopStadContent(nl, "nl", ["Zwolle"], counts, {}), {
    title: "We komen graag naar Zwolle.",
    countLine: null,
    perCity: null,
    waitlistLine:
      "Je staat op de wachtlijst voor Zwolle. Zodra er genoeg aanmeldingen zijn, plannen we daar een zondag en hoor jij het als eerste.",
    stat: null,
  });
  const several = stopStadContent(en, "en", ["Zwolle", "Deventer", "Enschede"], counts, {});
  assert.equal(several.title, "We'd love to come to Zwolle and 2 other cities.");
  assert.equal(
    several.waitlistLine,
    "You're on the waitlist for Zwolle, Deventer and Enschede. Once enough people sign up, we'll plan a Sunday there and you'll be the first to hear.",
  );
  assert.equal(stopStadContent(nl, "nl", ["Zwolle", "Deventer"], counts, {}).title, "We komen graag naar Zwolle en 1 andere stad.");
});

test("stopStadContent: our cities plus other towns", () => {
  const nl = getQuizCopy("nl");
  const en = getQuizCopy("en");
  const cityCounts = { Rotterdam: 120 };
  const subset = { [String(cityMask(["Rotterdam", "Den Haag"]))]: 150 };
  // One of our cities, typed town first: title and count follow Rotterdam.
  assert.deepEqual(stopStadContent(nl, "nl", ["Zwolle", "Rotterdam"], cityCounts, subset), {
    title: "Je bent niet de enige in Rotterdam.",
    countLine: "In Rotterdam hebben zich al 120+ mensen aangemeld.",
    perCity: null,
    waitlistLine: "Zwolle zetten we op de wachtlijst. Je hoort het als we daar starten.",
    stat: { n: 120, label: "aangemeld in Rotterdam" },
  });
  // Two of our cities: only ours named in the count line.
  const two = stopStadContent(en, "en", ["Rotterdam", "Den Haag", "Zwolle", "Deventer"], cityCounts, subset);
  assert.equal(two.title, "You're in good company.");
  assert.equal(two.countLine, "150+ people in Rotterdam and The Hague have already signed up.");
  assert.equal(two.perCity, "Next, you'll see the Sundays in each city.");
  assert.equal(two.waitlistLine, "We've put Zwolle and Deventer on the waitlist. You'll hear from us when we start there.");
});

test("chooseTablesForAnswers: only a town outside our cities shows our cities' tables", () => {
  const result = chooseTablesForAnswers(EVENTS, { cities: ["Zwolle"], age: 45, ageMatters: "yes" }, NOW);
  assert.equal(result.ourCities, true);
  assert.equal(result.hasMatch, true);
  assert.deepEqual(
    result.rows.map((r) => `${r.event.slug}:${r.kind}${r.nearby ? ":nearby" : ""}`),
    ["rdam-25-okt-35:open:nearby", "dh-8-nov-35:open:nearby", "rdam-22-nov-35:soon:nearby", "utr-29-nov-35:soon:nearby"],
  );
  // Only Delft (a place near Rotterdam and Den Haag, but not ours): the
  // same list of our cities, nothing is selected for her.
  assert.equal(chooseTablesForAnswers(EVENTS, { cities: ["Delft"], age: 45, ageMatters: "yes" }, NOW).ourCities, true);
  // Mixed: the usual list for our city.
  const mixed = chooseTablesForAnswers(EVENTS, { cities: ["Zwolle", "Utrecht"], age: 45, ageMatters: "yes" }, NOW);
  assert.equal(mixed.ourCities, false);
  assert.deepEqual(mixed.rows.map((r) => r.event.slug), ["utr-29-nov-35"]);
});

test("stopZoektAnswer: the chosen option highest in the list, not the first tapped", () => {
  assert.equal(stopZoektAnswer({ why: ["treat", "places"] }), "places");
  assert.equal(stopZoektAnswer({ why: ["new_city", "wines"] }), "wines");
  assert.equal(stopZoektAnswer({ why: ["treat"] }), "treat");
  assert.equal(stopZoektAnswer({}), "cosy");
});

test("shouldSendQuizLead: once per account, right after completing", () => {
  const done = { v: 1 as const, answers: DONE_ALONE, completedAt: NOW - 5000 };
  assert.equal(shouldSendQuizLead(done, {}, NOW), true);
  assert.equal(shouldSendQuizLead(done, null, NOW), true);
  // Already sent (another device, a retry).
  assert.equal(shouldSendQuizLead(done, { jouw_tafel_lead_sent_at: "2026-10-01T12:00:00Z" }, NOW), false);
  // Not completed, or an old completion saved again.
  assert.equal(shouldSendQuizLead({ v: 1, answers: DONE_ALONE }, {}, NOW), false);
  assert.equal(shouldSendQuizLead({ ...done, completedAt: NOW - 2 * 86_400_000 }, {}, NOW), false);
  assert.equal(shouldSendQuizLead({ ...done, answers: { ...DONE_ALONE, ready: undefined } }, {}, NOW), false);
});

test("firstNameFromMetadata", () => {
  assert.equal(firstNameFromMetadata({ given_name: "Anna", full_name: "Anna de Vries" }), "Anna");
  assert.equal(firstNameFromMetadata({ full_name: "Joris van Dam" }), "Joris");
  assert.equal(firstNameFromMetadata({ name: "someone@example.com" }), "");
  assert.equal(firstNameFromMetadata({}), "");
});
