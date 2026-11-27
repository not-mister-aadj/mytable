import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTableGame, type GameMate } from "@/lib/table-game";

const mates: GameMate[] = [
  { bookingId: "b", firstName: "Daan", answers: { intoNow: "Zuurdesem", askMeAbout: "Fietsen" } },
  { bookingId: "a", firstName: "Lotte", answers: { favoriteSpot: "Het Park" } },
  { bookingId: "c", firstName: "Sara", answers: null },
  { bookingId: "d", firstName: "Milan", answers: { askMeAbout: "Jazz" } },
];

test("one answer per other person; never your own", () => {
  const game = buildTableGame({ mates, locale: "nl", city: "Rotterdam", seed: "x", myBookingId: "b" });
  assert.deepEqual(game.guesses.map((g) => g.name).sort(), ["Lotte", "Milan"]);
  assert.ok(!game.guesses.some((g) => g.bookingId === "b"));
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
