// "Jouw tafel" quiz (/jouw-tafel/start): pure, client-safe logic. The step
// list and routing, birth date and age group, the table list on the last
// screen, and how the answers map onto the waitlist preferences. No db or
// browser imports here, so it can be unit tested:
// npx tsx --test src/lib/jouw-tafel/*.test.ts

import { isEventClosedForBooking } from "@/lib/event-visibility";
import {
  nearbyCities,
  sameCity,
  spotsLeft,
  supportedCity,
  type QuizBracket,
  type QuizEvent,
} from "@/lib/jouw-tafel/logic";

export const QUIZ_VERSION = 1;

/** Key in the Supabase user's metadata that holds the quiz state. */
export const QUIZ_METADATA_KEY = "jouw_tafel_quiz";

/** Every screen, in order. Branches are filtered out by quizSteps(). */
export const QUIZ_STEPS = [
  "welkom",
  "naam",
  "geboortedatum",
  "leeftijd",
  "stad",
  "stop-stad",
  "zoekt",
  "stop-zoekt",
  "gesprek",
  "stop-gesprek",
  "wijn",
  "stop-wijn",
  "gezelschap",
  "stop-alleen",
  "wie",
  "stop-wie",
  "taal",
  "dieet",
  "formats",
  "bron",
  "stop-reviews",
  "klaar",
  "zoeken",
  "kies",
] as const;

export type QuizStepId = (typeof QUIZ_STEPS)[number];

export function isQuizStepId(value: unknown): value is QuizStepId {
  return typeof value === "string" && (QUIZ_STEPS as readonly string[]).includes(value);
}

export type QuizChapter = "over_jou" | "aan_tafel" | "jouw_zondag";
export const QUIZ_CHAPTERS: QuizChapter[] = ["over_jou", "aan_tafel", "jouw_zondag"];

export function chapterOf(step: QuizStepId): QuizChapter {
  const index = QUIZ_STEPS.indexOf(step);
  if (index <= QUIZ_STEPS.indexOf("stop-stad")) return "over_jou";
  if (index <= QUIZ_STEPS.indexOf("dieet")) return "aan_tafel";
  return "jouw_zondag";
}

export type QuizStepKind = "intro" | "question" | "stop" | "loader" | "choose";

export function stepKind(step: QuizStepId): QuizStepKind {
  if (step === "welkom") return "intro";
  if (step === "zoeken") return "loader";
  if (step === "kies") return "choose";
  return step.startsWith("stop-") ? "stop" : "question";
}

// ------------------------------------------------------------------ answers

export const WHY_OPTIONS = ["places", "cosy", "wines", "treat", "new_city"] as const;
export type WhyAnswer = (typeof WHY_OPTIONS)[number];
export const WHY_MAX = 2;

export const CONVERSATION_OPTIONS = ["talker", "listener", "both"] as const;
export type ConversationAnswer = (typeof CONVERSATION_OPTIONS)[number];

export const WINE_OPTIONS = ["red", "white", "bubbles", "none"] as const;
export type WineAnswer = (typeof WINE_OPTIONS)[number];

export const COMPANION_OPTIONS = ["alone", "with"] as const;
export type CompanionAnswer = (typeof COMPANION_OPTIONS)[number];

export const COMPANION_WHO_OPTIONS = ["friend", "partner", "family", "colleague"] as const;
export type CompanionWhoAnswer = (typeof COMPANION_WHO_OPTIONS)[number];

export const LANGUAGE_OPTIONS = ["dutch", "english", "both"] as const;
export type LanguageAnswer = (typeof LANGUAGE_OPTIONS)[number];

export const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "lactose_free",
  "nut_allergy",
  "other",
  "none",
] as const;
export type DietaryAnswer = (typeof DIETARY_OPTIONS)[number];

export const FORMAT_OPTIONS = ["wine_tasting", "wine_walk", "chefs_special", "sunday_only"] as const;
export type FormatAnswer = (typeof FORMAT_OPTIONS)[number];

export const HEARD_FROM_OPTIONS = ["instagram", "facebook", "friends", "google", "other"] as const;
export type HeardFromAnswer = (typeof HEARD_FROM_OPTIONS)[number];

export const READY_OPTIONS = ["yes", "unsure"] as const;
export type ReadyAnswer = (typeof READY_OPTIONS)[number];

export const AGE_MATTERS_OPTIONS = ["yes", "no"] as const;
export type AgeMattersAnswer = (typeof AGE_MATTERS_OPTIONS)[number];

export type QuizAnswers = {
  name?: string;
  /** YYYY-MM-DD, 18 or older. */
  birthDate?: string;
  ageMatters?: AgeMattersAnswer;
  /** One of our four cities, or what they typed under "Andere stad". */
  city?: string;
  why?: WhyAnswer[];
  conversation?: ConversationAnswer;
  wine?: WineAnswer;
  companion?: CompanionAnswer;
  companionWho?: CompanionWhoAnswer;
  language?: LanguageAnswer;
  /** [] after "Verder" without a choice: answered, nothing to pass on. */
  dietary?: DietaryAnswer[];
  dietaryOther?: string;
  /** [] after "Verder" without a choice. */
  formats?: FormatAnswer[];
  heardFrom?: HeardFromAnswer;
  ready?: ReadyAnswer;
};

export type QuizState = {
  v: typeof QUIZ_VERSION;
  answers: QuizAnswers;
  /** Epoch ms of the first answer, for quiz_completed's duration. */
  startedAt?: number;
  completedAt?: number;
  /** Epoch ms of the last change; the newer of the account's copy and the
   * browser's copy wins on load. */
  updatedAt?: number;
  /** Event ids they asked to hear about ("Houd me op de hoogte"). */
  notify?: string[];
};

export function emptyQuizState(): QuizState {
  return { v: QUIZ_VERSION, answers: {} };
}

// ------------------------------------------------------------------ routing

/** The screens this person sees, in order: "Alleen" gets one stop, "Met
 * iemand" gets "Wie neem je mee?" and its stop instead. */
export function quizSteps(answers: QuizAnswers): QuizStepId[] {
  return QUIZ_STEPS.filter((step) => {
    if (step === "stop-alleen") return answers.companion !== "with";
    if (step === "wie" || step === "stop-wie") return answers.companion === "with";
    return true;
  });
}

export function isStepAnswered(step: QuizStepId, a: QuizAnswers): boolean {
  switch (step) {
    case "naam":
      return Boolean(a.name?.trim());
    case "geboortedatum":
      return Boolean(a.birthDate) && ageFromBirthDate(a.birthDate!) !== null;
    case "leeftijd":
      return a.ageMatters !== undefined;
    case "stad":
      return Boolean(a.city?.trim());
    case "zoekt":
      return (a.why?.length ?? 0) > 0;
    case "gesprek":
      return a.conversation !== undefined;
    case "wijn":
      return a.wine !== undefined;
    case "gezelschap":
      return a.companion !== undefined;
    case "wie":
      return a.companionWho !== undefined;
    case "taal":
      return a.language !== undefined;
    case "dieet":
      return a.dietary !== undefined;
    case "formats":
      return a.formats !== undefined;
    case "bron":
      return a.heardFrom !== undefined;
    case "klaar":
      return a.ready !== undefined;
    default:
      // Intro, stops, loader and the last screen have nothing to answer.
      return true;
  }
}

/** The first question this person still has to answer, or null when done. */
export function firstMissingStep(a: QuizAnswers): QuizStepId | null {
  for (const step of quizSteps(a)) {
    if (stepKind(step) === "question" && !isStepAnswered(step, a)) return step;
  }
  return null;
}

export function isQuizComplete(a: QuizAnswers): boolean {
  return firstMissingStep(a) === null;
}

export function hasAnyAnswer(a: QuizAnswers): boolean {
  return quizSteps(a).some((step) => stepKind(step) === "question" && isStepAnswered(step, a));
}

/** Whether a screen may be shown: it belongs to this person's path and every
 * question before it has an answer. */
export function canShowStep(step: QuizStepId, a: QuizAnswers): boolean {
  const steps = quizSteps(a);
  const index = steps.indexOf(step);
  if (index < 0) return false;
  for (const earlier of steps.slice(0, index)) {
    if (stepKind(earlier) === "question" && !isStepAnswered(earlier, a)) return false;
  }
  return true;
}

/**
 * The screen to open for `?stap=` (or none). A screen that can be shown
 * opens as asked; a deep link past an unanswered question goes to that
 * question. With no step: the intro for someone new, the first open
 * question for someone halfway, the table list for someone who is done.
 */
export function resolveStep(requested: string | null | undefined, a: QuizAnswers): QuizStepId {
  if (isQuizStepId(requested) && canShowStep(requested, a)) return requested;
  const missing = firstMissingStep(a);
  if (isQuizStepId(requested)) return missing ?? "kies";
  if (!missing) return "kies";
  return hasAnyAnswer(a) ? missing : "welkom";
}

export function nextStep(step: QuizStepId, a: QuizAnswers): QuizStepId | null {
  const steps = quizSteps(a);
  const index = steps.indexOf(step);
  return index >= 0 && index < steps.length - 1 ? steps[index + 1]! : null;
}

/** One screen back. The loader is skipped: back from the table list goes to
 * "Klaar om aan te schuiven?". */
export function previousStep(step: QuizStepId, a: QuizAnswers): QuizStepId | null {
  const steps = quizSteps(a);
  let index = steps.indexOf(step) - 1;
  while (index >= 0 && steps[index] === "zoeken") index -= 1;
  return index >= 0 ? steps[index]! : null;
}

/** 0-based position and the total, for the progress bar and analytics. */
export function stepPosition(step: QuizStepId, a: QuizAnswers): { index: number; total: number } {
  const steps = quizSteps(a);
  return { index: Math.max(0, steps.indexOf(step)), total: steps.length };
}

// --------------------------------------------------------------- birth date

const AMSTERDAM = "Europe/Amsterdam";

/** Today's date in Amsterdam as [year, month, day]. */
function todayParts(now: number): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: AMSTERDAM,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(now));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? NaN);
  return [get("year"), get("month"), get("day")];
}

function ageOn(year: number, month: number, day: number, now: number): number {
  const [ty, tm, td] = todayParts(now);
  let age = ty - year;
  if (tm < month || (tm === month && td < day)) age -= 1;
  return age;
}

const MAX_AGE = 110;

export type BirthDateError = "incomplete" | "invalid" | "under_18";

export type BirthDateResult =
  | { ok: true; iso: string; age: number }
  | { ok: false; error: BirthDateError };

/** "7", "3", "1990" -> 1990-03-07, checked: a real date, not in the future,
 * 18 or older. */
export function parseBirthDate(
  day: string,
  month: string,
  year: string,
  now: number = Date.now(),
): BirthDateResult {
  const d = day.trim();
  const m = month.trim();
  const y = year.trim();
  if (!d || !m || y.length < 4) return { ok: false, error: "incomplete" };
  if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) {
    return { ok: false, error: "invalid" };
  }
  const dn = Number(d);
  const mn = Number(m);
  const yn = Number(y);
  const date = new Date(Date.UTC(yn, mn - 1, dn));
  if (
    date.getUTCFullYear() !== yn ||
    date.getUTCMonth() !== mn - 1 ||
    date.getUTCDate() !== dn
  ) {
    return { ok: false, error: "invalid" };
  }
  const age = ageOn(yn, mn, dn, now);
  if (age < 0 || age > MAX_AGE) return { ok: false, error: "invalid" };
  if (age < 18) return { ok: false, error: "under_18" };
  const iso = `${y}-${String(mn).padStart(2, "0")}-${String(dn).padStart(2, "0")}`;
  return { ok: true, iso, age };
}

/** Age today for a stored YYYY-MM-DD, or null when it is not a valid 18+
 * birth date. */
export function ageFromBirthDate(iso: string, now: number = Date.now()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const result = parseBirthDate(match[3]!, match[2]!, match[1]!, now);
  return result.ok ? result.age : null;
}

/** The age group someone is placed in first: under 35 sits at "20-39"
 * tables, 35 and over at "35+". */
export function ageBracket(age: number): QuizBracket {
  return age < 35 ? "20-39" : "35+";
}

/** Every age group someone may join, their own first: 35 to 39 fits both. */
export function eligibleBrackets(age: number): QuizBracket[] {
  if (age < 35) return ["20-39"];
  if (age <= 39) return ["35+", "20-39"];
  return ["35+"];
}

/** Age groups for the table list: only their own when they like to sit with
 * people their age, otherwise every group they may join. */
export function tableBrackets(age: number, ageMatters: AgeMattersAnswer | undefined): QuizBracket[] {
  return ageMatters === "yes" ? [ageBracket(age)] : eligibleBrackets(age);
}

export type WaitlistAgeRange = "18_24" | "25_34" | "35_44" | "45_plus";

export function waitlistAgeRange(age: number): WaitlistAgeRange {
  if (age < 25) return "18_24";
  if (age < 35) return "25_34";
  if (age < 45) return "35_44";
  return "45_plus";
}

// ------------------------------------------------------------ the table list

export type ChooseRow = {
  event: QuizEvent;
  /** "open": can be booked now. "soon": shown, not on sale yet. */
  kind: "open" | "soon";
  /** In a city within reach, not their own. */
  nearby: boolean;
};

/**
 * "Kies je zondag": tables in their city for their age group(s) first (their
 * own group first, then by date), then tables in cities within reach, then
 * tables that are coming soon. Full tables and tables closed for booking
 * drop off.
 */
export function chooseTables(
  events: QuizEvent[],
  input: { city: string; age: number; ageMatters: AgeMattersAnswer | undefined },
  now: number = Date.now(),
): { rows: ChooseRow[]; hasMatch: boolean } {
  const brackets = tableBrackets(input.age, input.ageMatters);
  const near = nearbyCities(input.city);
  const rank = (e: QuizEvent) => brackets.indexOf(e.bracket);
  const nearRank = (e: QuizEvent) => near.findIndex((c) => sameCity(c, e.city));
  const time = (e: QuizEvent) => new Date(e.startsAt).getTime();

  const eligible = events.filter(
    (e) =>
      brackets.includes(e.bracket) &&
      time(e) > now &&
      !isEventClosedForBooking(new Date(e.startsAt), new Date(now)),
  );
  const own = eligible.filter((e) => sameCity(e.city, input.city));
  const nearby = eligible.filter((e) => !sameCity(e.city, input.city) && nearRank(e) >= 0);
  const isOpen = (e: QuizEvent) => !e.comingSoon && spotsLeft(e) > 0;

  const ownOpen = own.filter(isOpen).sort((a, b) => rank(a) - rank(b) || time(a) - time(b));
  const nearbyOpen = nearby
    .filter(isOpen)
    .sort((a, b) => nearRank(a) - nearRank(b) || time(a) - time(b));
  const soon = [
    ...own.filter((e) => e.comingSoon).sort((a, b) => time(a) - time(b)),
    ...nearby.filter((e) => e.comingSoon).sort((a, b) => nearRank(a) - nearRank(b) || time(a) - time(b)),
  ];

  const rows: ChooseRow[] = [
    ...ownOpen.map((event) => ({ event, kind: "open" as const, nearby: false })),
    ...nearbyOpen.map((event) => ({ event, kind: "open" as const, nearby: true })),
    ...soon.map((event) => ({ event, kind: "soon" as const, nearby: !sameCity(event.city, input.city) })),
  ];
  return { rows, hasMatch: ownOpen.length + nearbyOpen.length > 0 };
}

/** Seats preselected on the table list: 2 for someone bringing a person. */
export function defaultSeats(a: QuizAnswers): 1 | 2 {
  return a.companion === "with" ? 2 : 1;
}

/** The checkout's table language for this answer. */
export function checkoutTableLanguage(
  language: LanguageAnswer | undefined,
): "prefer_dutch" | "prefer_english" | "both_fine" {
  if (language === "dutch") return "prefer_dutch";
  if (language === "english") return "prefer_english";
  return "both_fine";
}

const DIETARY_TEXT_NL: Record<Exclude<DietaryAnswer, "other" | "none">, string> = {
  vegetarian: "Vegetarisch",
  vegan: "Veganistisch",
  gluten_free: "Glutenvrij",
  lactose_free: "Lactosevrij",
  nut_allergy: "Notenallergie",
};

/** Dietary wishes as one line for the booking's dietary field (read by the
 * team, so in Dutch), or "" when there are none. */
export function dietaryNotes(a: QuizAnswers): string {
  const list = a.dietary ?? [];
  const parts: string[] = [];
  for (const id of list) {
    if (id === "none") continue;
    if (id === "other") {
      const text = a.dietaryOther?.trim();
      if (text) parts.push(text);
      continue;
    }
    parts.push(DIETARY_TEXT_NL[id]);
  }
  return parts.join(", ").slice(0, 500);
}

// -------------------------------------------------- waitlist preferences

const WHY_TO_WAITLIST: Record<WhyAnswer, string> = {
  places: "discover_places",
  cosy: "just_fun",
  wines: "discover_wines",
  treat: "treat",
  new_city: "new_city",
};

const COMPANY_TO_WAITLIST: Record<CompanionWhoAnswer, string> = {
  friend: "bring_friends",
  partner: "bring_partner",
  family: "bring_friends",
  colleague: "bring_friends",
};

/**
 * The waitlist row's `preferences`, in the shape the waitlist modal stores
 * (cities, ageRange, why, company, language, tableType, interests, ...) plus
 * the quiz's own keys (birthDate, ageMatters, conversationStyle, wine,
 * companion, dietary, heardFrom, futureFormats).
 */
export function buildWaitlistPreferences(
  a: QuizAnswers,
  now: number = Date.now(),
): Record<string, unknown> {
  const age = a.birthDate ? ageFromBirthDate(a.birthDate, now) : null;
  const formats = a.formats ?? [];
  const chosenFormats = formats.filter((f) => f !== "sunday_only");
  const companion =
    a.companion === "alone" ? "alone" : a.companion === "with" ? a.companionWho ?? "with" : null;
  return {
    interests: ["sunday_table", ...chosenFormats],
    priceRanges: { ticket: [], allInclusive: [] },
    priceRangeSource: "self_reported",
    why: (a.why ?? []).map((w) => WHY_TO_WAITLIST[w]),
    company:
      a.companion === "alone"
        ? ["solo"]
        : a.companion === "with" && a.companionWho
          ? [COMPANY_TO_WAITLIST[a.companionWho]]
          : [],
    tableType: ["mixed"],
    cities: a.city ? [a.city] : [],
    regionFlexible: false,
    gender: [],
    ageRange: age !== null ? [waitlistAgeRange(age)] : [],
    vibe: [],
    experience: [],
    language: a.language ? [a.language] : [],
    sundayAvailability: [],
    altDays: [],
    whyOther: "",
    // Quiz-only keys.
    birthDate: a.birthDate ?? null,
    ageMatters: a.ageMatters ?? null,
    conversationStyle: a.conversation ?? null,
    wine: a.wine ?? null,
    companion,
    dietary: (a.dietary ?? []).filter((d) => d !== "none"),
    dietaryOther: a.dietaryOther?.trim() || "",
    heardFrom: a.heardFrom ?? null,
    futureFormats: formats,
    readyToBook: a.ready ?? null,
    quizVersion: QUIZ_VERSION,
  };
}

// --------------------------------------------------------------- analytics

/** What quiz_step_completed reports as `answer`: answer ids only, never a
 * name, a date or typed text. */
export function analyticsAnswer(step: QuizStepId, a: QuizAnswers): string | null {
  switch (step) {
    case "naam":
      return a.name?.trim() ? "filled" : "skipped";
    case "geboortedatum":
      return a.birthDate ? "filled" : "skipped";
    case "leeftijd":
      return a.ageMatters ?? null;
    case "stad": {
      if (!a.city) return null;
      return supportedCity(a.city) ?? "other";
    }
    case "zoekt":
      return (a.why ?? []).join(",") || null;
    case "gesprek":
      return a.conversation ?? null;
    case "wijn":
      return a.wine ?? null;
    case "gezelschap":
      return a.companion ?? null;
    case "wie":
      return a.companionWho ?? null;
    case "taal":
      return a.language ?? null;
    case "dieet":
      return (a.dietary ?? []).join(",") || "skipped";
    case "formats":
      return (a.formats ?? []).join(",") || "skipped";
    case "bron":
      return a.heardFrom ?? null;
    case "klaar":
      return a.ready ?? null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------- storage

function pick<T extends string>(value: unknown, options: readonly T[]): T | undefined {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function pickList<T extends string>(value: unknown, options: readonly T[], max = options.length): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: T[] = [];
  for (const item of value) {
    const id = pick(item, options);
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, max);
}

function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/\s+/g, " ").trim().slice(0, max);
  return text || undefined;
}

function cleanTime(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
}

/** A stored or posted quiz state, with anything unknown dropped. */
export function sanitizeQuizState(raw: unknown): QuizState {
  if (!raw || typeof raw !== "object") return emptyQuizState();
  const r = raw as Record<string, unknown>;
  const ra = (r.answers && typeof r.answers === "object" ? r.answers : {}) as Record<string, unknown>;
  const birthDate =
    typeof ra.birthDate === "string" && ageFromBirthDate(ra.birthDate) !== null ? ra.birthDate : undefined;
  const answers: QuizAnswers = {
    name: cleanText(ra.name, 60),
    birthDate,
    ageMatters: pick(ra.ageMatters, AGE_MATTERS_OPTIONS),
    city: cleanText(ra.city, 60),
    why: pickList(ra.why, WHY_OPTIONS, WHY_MAX),
    conversation: pick(ra.conversation, CONVERSATION_OPTIONS),
    wine: pick(ra.wine, WINE_OPTIONS),
    companion: pick(ra.companion, COMPANION_OPTIONS),
    companionWho: pick(ra.companionWho, COMPANION_WHO_OPTIONS),
    language: pick(ra.language, LANGUAGE_OPTIONS),
    dietary: pickList(ra.dietary, DIETARY_OPTIONS),
    dietaryOther: cleanText(ra.dietaryOther, 120),
    formats: pickList(ra.formats, FORMAT_OPTIONS),
    heardFrom: pick(ra.heardFrom, HEARD_FROM_OPTIONS),
    ready: pick(ra.ready, READY_OPTIONS),
  };
  if (answers.why && answers.why.length === 0) delete answers.why;
  for (const key of Object.keys(answers) as Array<keyof QuizAnswers>) {
    if (answers[key] === undefined) delete answers[key];
  }
  const notify = Array.isArray(r.notify)
    ? [...new Set(r.notify.filter((id): id is string => typeof id === "string" && /^[\w-]{1,64}$/.test(id)))].slice(0, 20)
    : undefined;
  return {
    v: QUIZ_VERSION,
    answers,
    ...(cleanTime(r.startedAt) ? { startedAt: cleanTime(r.startedAt) } : {}),
    ...(cleanTime(r.completedAt) ? { completedAt: cleanTime(r.completedAt) } : {}),
    ...(cleanTime(r.updatedAt) ? { updatedAt: cleanTime(r.updatedAt) } : {}),
    ...(notify && notify.length ? { notify } : {}),
  };
}

/** First name for the table card from what Google or the account holds. */
export function firstNameFromMetadata(meta: Record<string, unknown> | null | undefined): string {
  if (!meta) return "";
  const pickString = (key: string) => (typeof meta[key] === "string" ? (meta[key] as string).trim() : "");
  const given = pickString("given_name") || pickString("first_name");
  if (given) return given.split(/\s+/)[0]!.slice(0, 60);
  const full = pickString("full_name") || pickString("name");
  if (!full || full.includes("@")) return "";
  return full.split(/\s+/)[0]!.slice(0, 60);
}
