import { citiesAnswer, type QuizAnswers, type QuizState } from "@/lib/jouw-tafel/quiz-logic";

export type BuyerBooking = {
  name: string | null;
  birth_date: string | null;
  age_preference: string | null;
  table_language_preference: string | null;
  city: string | null;
};

const LANGUAGE: Record<string, QuizAnswers["language"]> = {
  prefer_dutch: "dutch",
  prefer_english: "english",
  both_fine: "both",
};

/** Quiz answers from paid bookings, newest first: the first value found wins. */
export function buyerAnswers(rows: readonly BuyerBooking[]): Partial<QuizAnswers> {
  const first = <T,>(pick: (r: BuyerBooking) => T | null | undefined): T | undefined => {
    for (const r of rows) {
      const v = pick(r);
      if (v !== null && v !== undefined && v !== "") return v;
    }
    return undefined;
  };
  const answers: Partial<QuizAnswers> = {};
  const name = first((r) => r.name?.trim().split(/\s+/)[0]);
  if (name) answers.name = name;
  const birthDate = first((r) => (r.birth_date && /^\d{4}-\d{2}-\d{2}$/.test(r.birth_date) ? r.birth_date : null));
  if (birthDate) answers.birthDate = birthDate;
  const age = first((r) => r.age_preference);
  if (age === "similar") answers.ageMatters = "yes";
  else if (age === "any") answers.ageMatters = "no";
  const language = first((r) => (r.table_language_preference ? LANGUAGE[r.table_language_preference] : null));
  if (language) answers.language = language;
  Object.assign(answers, citiesAnswer(rows.map((r) => r.city ?? "").filter(Boolean)));
  if (!answers.cities) {
    delete answers.cities;
    delete answers.city;
  }
  return answers;
}

/** Their saved quiz with the booking answers under it (their own answers
 * win); dated now, so an older copy in the browser doesn't replace it. */
export function withBuyerAnswers(saved: QuizState, answers: Partial<QuizAnswers>): QuizState {
  return { ...saved, answers: { ...answers, ...saved.answers }, updatedAt: Date.now() };
}
