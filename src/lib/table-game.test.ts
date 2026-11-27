import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTableGame, type GameMate } from "@/lib/table-game";

const mates: GameMate[] = [
  { bookingId: "b", firstName: "Daan", answers: { intoNow: "Zuurdesem", askMeAbout: "Fietsen" } },
  { bookingId: "a", firstName: "Lotte", answers: { favoriteSpot: "Het Park" } },
  { bookingId: "c", firstName: "Sara", answers: null },
  { bookingId: "d", firstName: "Milan", answers: { askMeAbout: "Jazz" } },
];

test("every phone at the table gets the same game, whatever the order of the mates", () => {
  const one = buildTableGame({ mates, locale: "nl", city: "Rotterdam", seed: "g3|2026-11-29" });
  const two = buildTableGame({ mates: [...mates].reverse(), locale: "nl", city: "Rotterdam", seed: "g3|2026-11-29" });
  assert.deepEqual(one, two);
});

test("one answer per person, at most four, names to choose from in order", () => {
  const game = buildTableGame({ mates, locale: "nl", city: "Rotterdam", seed: "x" });
  assert.equal(game.guesses.length, 3); // Sara gave no answers
  assert.equal(new Set(game.guesses.map((g) => g.bookingId)).size, 3);
  assert.deepEqual(game.names, ["Daan", "Lotte", "Milan", "Sara"]);
  assert.equal(game.questions.length, 8);
  assert.equal(new Set(game.questions).size, 8);
});

test("too few answers: no guessing round, the questions stay", () => {
  const game = buildTableGame({ mates: mates.slice(0, 1).concat(mates[2]!), locale: "en", city: "Utrecht", seed: "x" });
  assert.equal(game.guesses.length, 0);
  assert.equal(game.questions.length, 8);
});
