// Run with: npx tsx --test src/lib/venue-questions.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { venueQuestionsMail } from "./venue-questions-mail";
import { parseVenueAnswers, summarizeVenueAnswers } from "./venue-questions";

const base = { sunday: "zondag 6 december", time: "14:00", locationDay: "zondag 29 november", city: "Den Haag", questionsUrl: "https://www.mytable.club/aan-tafel/T/vragen", musicFrom: "16:00", guestsOver: 30 };

test("mail: five taps, no venue name, the date", () => {
  const m = venueQuestionsMail({ ...base, locale: "nl", firstName: "Lili" });
  assert.equal(m.subject, "Twee vragen voor zondag 6 december");
  const hrefs = [...m.html.matchAll(/href="([^"]+)"/g)].map((x) => x[1]);
  assert.deepEqual(hrefs, ["dieet=nee", "dieet=ja", "muziek=ja", "muziek=misschien", "muziek=nee"].map((q) => `${base.questionsUrl}?${q}`));
  assert.match(m.text, /Zondag 6 december om 14:00 zit je aan tafel in Den Haag/);
  assert.match(m.text, /meer dan 30 gasten/);
  assert.match(m.text, /dat hoor je zondag 29 november\./);
  assert.doesNotMatch(m.text + m.html, /JAZZ Coffee|jazzcoffee/i);
  assert.ok(!m.text.includes("—"));
});

test("mail in English, and without the music question", () => {
  const en = venueQuestionsMail({ ...base, locale: "en", firstName: null, sunday: "Sunday 6 December", time: "2pm", locationDay: "Sunday 29 November" });
  assert.match(en.text, /you'll hear on Sunday 29 November\./);
  assert.match(en.text, /^Hi,/);
  assert.match(en.text, /in The Hague/);
  const none = venueQuestionsMail({ ...base, locale: "nl", firstName: "A", musicFrom: null });
  assert.equal([...none.html.matchAll(/href=/g)].length, 2);
});

test("answers: parse and count", () => {
  assert.deepEqual(parseVenueAnswers({ diet: "x", liveMusic: "maybe", dietary: ["vegan", "none", "bad"] }), { liveMusic: "maybe", dietary: ["vegan"] });
  const s = summarizeVenueAnswers([
    { name: "A", answers: { diet: "none", liveMusic: "yes" }, dietaryNotes: null },
    { name: "B", answers: { diet: "some", dietary: ["vegan"] }, dietaryNotes: "Veganistisch" },
    { name: "C", answers: null, dietaryNotes: null },
  ]);
  assert.equal(s.answered, 2);
  assert.deepEqual(s.liveMusic.yes, ["A"]);
  assert.deepEqual(s.diets, [{ name: "B", notes: "Veganistisch" }]);
});

test("a kitchen note counts without ticking 'Iets anders'", async () => {
  const { dietaryNotes } = await import("./jouw-tafel/quiz-logic");
  assert.equal(dietaryNotes({ dietary: ["vegetarian", "other"], dietaryOther: "geen koriander" }), "Vegetarisch, geen koriander");
});
