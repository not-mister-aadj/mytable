import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTableGame, isRealAnswer, type GameMate } from "@/lib/table-game";

const mates: GameMate[] = [
  { bookingId: "b", firstName: "Daan", answers: { intoNow: "Zuurdesem", askMeAbout: "Fietsen" } },
  { bookingId: "a", firstName: "Lotte", answers: { favoriteSpot: "Het Park" } },
  { bookingId: "c", firstName: "Sara", answers: null },
  { bookingId: "d", firstName: "Milan", answers: { askMeAbout: "Jazz" } },
];

test("every real answer of the others, never your own, never the same person twice in a row", () => {
  const all: GameMate[] = [
    ...mates,
    { bookingId: "e", firstName: "Noor", answers: { intoNow: "Hardlopen", askMeAbout: "Bordspellen", favoriteSpot: "nvt" } },
  ];
  const game = buildTableGame({ mates: all, locale: "nl", city: "Rotterdam", seed: "x", myBookingId: "a" });
  assert.deepEqual(game.guesses.map((g) => g.answer).sort(), ["Bordspellen", "Fietsen", "Hardlopen", "Jazz", "Zuurdesem"]);
  assert.ok(!game.guesses.some((g) => g.bookingId === "a"));
  for (let i = 1; i < game.guesses.length; i += 1) assert.notEqual(game.guesses[i]!.bookingId, game.guesses[i - 1]!.bookingId);
});

test("an answer must say something", () => {
  assert.equal(isRealAnswer("Padel"), true);
  assert.equal(isRealAnswer("Zelf zuurdesembrood bakken"), true);
  assert.equal(isRealAnswer("nvt"), false);
  assert.equal(isRealAnswer("Geen."), false);
  assert.equal(isRealAnswer("-"), false);
  assert.equal(isRealAnswer("ok"), false);
});

test("all twenty questions, each once; the same phone draws the same order", () => {
  const one = buildTableGame({ mates, locale: "en", city: "Utrecht", seed: "phone-1", myBookingId: "a" });
  const again = buildTableGame({ mates: [...mates].reverse(), locale: "en", city: "Utrecht", seed: "phone-1", myBookingId: "a" });
  assert.equal(one.questions.length, 20);
  assert.equal(new Set(one.questions).size, 20);
  assert.deepEqual(one, again);
});

test("nobody shared answers: only questions", () => {
  const game = buildTableGame({ mates: mates.slice(2, 3), locale: "nl", city: "Utrecht", seed: "x", myBookingId: "z" });
  assert.equal(game.guesses.length, 0);
  assert.equal(game.questions.length, 20);
});
