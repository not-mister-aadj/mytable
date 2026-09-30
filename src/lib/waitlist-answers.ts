// Waitlist questionnaire answers for admin: one parser and one list of
// questions with Dutch labels, shared by the customer profile and the
// /customers/antwoorden overview. Client-safe (no db imports).

import {
  AGE_LABELS,
  ALL_INCLUSIVE_PRICE_LABELS,
  ALT_DAY_LABELS,
  COMPANY_LABELS,
  EXPERIENCE_LABELS,
  FORMAT_LABELS,
  GENDER_LABELS,
  LANGUAGE_LABELS,
  SUNDAY_AVAILABILITY_LABELS,
  TABLE_TYPE_LABELS,
  TICKET_PRICE_LABELS,
  VIBE_LABELS,
  WHY_LABELS,
} from "@/lib/priority-list-labels";

export type WaitlistAnswerKey =
  | "ageRange"
  | "gender"
  | "language"
  | "cities"
  | "interests"
  | "company"
  | "why"
  | "tableType"
  | "sundayAvailability"
  | "altDays"
  | "ticket"
  | "allInclusive"
  | "experience"
  | "vibe";

/** Every multiple-choice answer as a plain id list, plus the free text. */
export type WaitlistAnswers = Record<WaitlistAnswerKey, string[]> & {
  whyOther: string;
};

export type WaitlistQuestion = {
  key: WaitlistAnswerKey;
  label: string;
  /** Empty for free values such as city names. */
  labels: Record<string, string>;
};

/** In the order the profile shows them. */
export const WAITLIST_QUESTIONS: WaitlistQuestion[] = [
  { key: "ageRange", label: "Leeftijd", labels: AGE_LABELS },
  { key: "gender", label: "Geslacht", labels: GENDER_LABELS },
  { key: "language", label: "Taal", labels: LANGUAGE_LABELS },
  { key: "cities", label: "Steden", labels: {} },
  { key: "interests", label: "Interesse", labels: FORMAT_LABELS },
  { key: "company", label: "Gezelschap", labels: COMPANY_LABELS },
  { key: "why", label: "Waarom", labels: WHY_LABELS },
  { key: "tableType", label: "Tafeltype", labels: TABLE_TYPE_LABELS },
  {
    key: "sundayAvailability",
    label: "Zondag",
    labels: SUNDAY_AVAILABILITY_LABELS,
  },
  { key: "altDays", label: "Andere dag", labels: ALT_DAY_LABELS },
  { key: "ticket", label: "Ticketbudget", labels: TICKET_PRICE_LABELS },
  {
    key: "allInclusive",
    label: "All-in budget",
    labels: ALL_INCLUSIVE_PRICE_LABELS,
  },
  { key: "experience", label: "Ervaring", labels: EXPERIENCE_LABELS },
  { key: "vibe", label: "Vibe", labels: VIBE_LABELS },
];

export function answerLabel(question: WaitlistQuestion, id: string): string {
  return question.labels[id] ?? id;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item !== "")
    : [];
}

/** Null when the row has no answer at all (skipped the questionnaire). */
export function parseWaitlistAnswers(
  value: Record<string, unknown> | null | undefined,
): WaitlistAnswers | null {
  if (!value || typeof value !== "object") return null;
  const priceRanges =
    value.priceRanges && typeof value.priceRanges === "object"
      ? (value.priceRanges as Record<string, unknown>)
      : {};
  const answers: WaitlistAnswers = {
    ageRange: stringList(value.ageRange),
    gender: stringList(value.gender),
    language: stringList(value.language),
    cities: stringList(value.cities),
    interests: stringList(value.interests),
    company: stringList(value.company),
    why: stringList(value.why),
    tableType: stringList(value.tableType),
    sundayAvailability: stringList(value.sundayAvailability),
    altDays: stringList(value.altDays),
    ticket: stringList(priceRanges.ticket),
    allInclusive: stringList(priceRanges.allInclusive),
    experience: stringList(value.experience),
    vibe: stringList(value.vibe),
    whyOther: typeof value.whyOther === "string" ? value.whyOther.trim() : "",
  };
  const hasAny =
    answers.whyOther !== "" ||
    WAITLIST_QUESTIONS.some((q) => answers[q.key].length > 0);
  return hasAny ? answers : null;
}
