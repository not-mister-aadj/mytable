import type { Locale } from "@/i18n/config";
import { agendaPath, clubmemberPath } from "@/i18n/config";
import type {
  WaitlistInterestId,
  WaitlistTableTypeId,
} from "@/i18n/waitlist-page.types";

export type OnboardingCompanyId =
  | "solo"
  | "with_someone"
  | "with_friends"
  | "with_partner"
  | "with_date"
  | "with_group";

export const MEET_COMPANY_OPTIONS: OnboardingCompanyId[] = [
  "solo",
  "with_someone",
];

export const CULINARY_COMPANY_OPTIONS: OnboardingCompanyId[] = [
  "solo",
  "with_friends",
  "with_partner",
  "with_date",
  "with_group",
];

export function companyOptionsForIntent(
  intent: OnboardingIntentId | null | undefined,
): OnboardingCompanyId[] {
  if (intent === "with_group" || intent === "both") {
    return CULINARY_COMPANY_OPTIONS;
  }
  return MEET_COMPANY_OPTIONS;
}

export function isOnboardingCompanyId(
  value: unknown,
): value is OnboardingCompanyId {
  return (
    value === "solo" ||
    value === "with_someone" ||
    value === "with_friends" ||
    value === "with_partner" ||
    value === "with_date" ||
    value === "with_group"
  );
}

export type OnboardingIntentId = "meet_new" | "with_group" | "both";

export function wantsMeetPath(
  intent: OnboardingIntentId | null | undefined,
): boolean {
  return intent === "meet_new" || intent === "both";
}

export function wantsCulinaryPath(
  intent: OnboardingIntentId | null | undefined,
): boolean {
  return intent === "with_group" || intent === "both";
}

/**
 * Where to land after login/signup.
 * Culinary (or no quiz intent, e.g. normal login) → agenda.
 * Meet / both → clubmember.
 */
export function postLoginPath(
  locale: Locale,
  joinIntent: OnboardingIntentId | null | undefined,
  options?: { interests?: string[] },
): string {
  if (joinIntent === "meet_new" || joinIntent === "both") {
    return clubmemberPath(locale);
  }
  const base = agendaPath(locale);
  if (options?.interests && options.interests.length > 0) {
    return `${base}?interest=${options.interests.join(",")}`;
  }
  return base;
}

export type OnboardingGenderId =
  | "woman"
  | "man"
  | "non_binary"
  | "prefer_not";

export function canChooseGirlsOnly(
  gender: OnboardingGenderId | null | undefined,
): boolean {
  return gender === "woman";
}

/** Name, birth date and gender required to join Sunday Tables (girls-only is women-only). */
export function hasSundayTableProfile(
  prefs: Pick<MemberOnboardingPrefs, "name" | "birthDate" | "gender">,
): boolean {
  return (
    Boolean(prefs.name.trim()) &&
    Boolean(prefs.birthDate) &&
    prefs.gender !== null
  );
}

/**
 * Ready to use account / claim a Sunday Table seat.
 * Requires profile fields. `completed` should be true after finish; we also
 * recover profiles that have prefs + joinIntent but lost the completed flag.
 */
export function isSundayTableOnboardingReady(
  completed: boolean,
  prefs: Pick<
    MemberOnboardingPrefs,
    "name" | "birthDate" | "gender" | "joinIntent"
  >,
): boolean {
  if (!hasSundayTableProfile(prefs)) return false;
  if (completed) return true;
  return prefs.joinIntent !== null;
}

export type OnboardingTableTypeId = WaitlistTableTypeId;

export type OnboardingPersonalityId =
  | "introverted"
  | "ambivert"
  | "extroverted";

export function isOnboardingPersonalityId(
  value: unknown,
): value is OnboardingPersonalityId {
  return (
    value === "introverted" ||
    value === "ambivert" ||
    value === "extroverted"
  );
}

export type OnboardingLanguageId = "nl" | "en";

export type MemberOnboardingPrefs = {
  name: string;
  /** ISO date YYYY-MM-DD */
  birthDate: string | null;
  joinIntent: OnboardingIntentId | null;
  company: OnboardingCompanyId | null;
  cities: string[];
  cityFlexible: boolean;
  /** Meet path: used to gate girls-only Sunday Tables */
  gender: OnboardingGenderId | null;
  /** Sunday Table path only */
  tableType: OnboardingTableTypeId | null;
  /** Meet path: social energy for table matching */
  personality: OnboardingPersonalityId | null;
  /** Languages the member is comfortable communicating in at the table */
  languages: OnboardingLanguageId[];
  interests: WaitlistInterestId[];
  communityInterest: boolean;
};

export const EMPTY_ONBOARDING_PREFS: MemberOnboardingPrefs = {
  name: "",
  birthDate: null,
  joinIntent: null,
  company: null,
  cities: [],
  cityFlexible: false,
  gender: null,
  tableType: null,
  personality: null,
  languages: ["nl"],
  interests: [],
  communityInterest: false,
};

export const ONBOARDING_STORAGE_KEY = "mytable_onboarding_prefs";

export const MIN_ONBOARDING_AGE = 18;

/** All known Sunday Table cities (incl. paused). Keep for types + legacy prefs. */
export const ONBOARDING_CITIES = [
  "Rotterdam",
  "Den Haag",
  "Utrecht",
  "Amsterdam",
  "Eindhoven",
  "Groningen",
  "Maastricht",
  "Nijmegen",
  "Zwolle",
] as const;

export type OnboardingCityId = (typeof ONBOARDING_CITIES)[number];

export type OnboardingCityStatus = "active" | "coming_soon" | "hidden";

/** Launch focus: 3 live cities; AMS/EHV/GRQ teaser; rest hidden for now. */
export const ONBOARDING_CITY_STATUS: Record<
  OnboardingCityId,
  OnboardingCityStatus
> = {
  Rotterdam: "active",
  "Den Haag": "active",
  Utrecht: "active",
  Amsterdam: "coming_soon",
  Eindhoven: "coming_soon",
  Groningen: "coming_soon",
  Maastricht: "hidden",
  Nijmegen: "hidden",
  Zwolle: "hidden",
};

/** Cities shown in onboarding / club filters (active + coming soon). */
export const VISIBLE_ONBOARDING_CITIES = ONBOARDING_CITIES.filter(
  (city) => ONBOARDING_CITY_STATUS[city] !== "hidden",
);

/** Cities where Sunday Tables can be booked right now. */
export const ACTIVE_ONBOARDING_CITIES = ONBOARDING_CITIES.filter(
  (city) => ONBOARDING_CITY_STATUS[city] === "active",
);

export function isOnboardingCityId(value: unknown): value is OnboardingCityId {
  return (
    typeof value === "string" &&
    (ONBOARDING_CITIES as readonly string[]).includes(value)
  );
}

export function isActiveOnboardingCity(value: unknown): boolean {
  return isOnboardingCityId(value) && ONBOARDING_CITY_STATUS[value] === "active";
}

export function isComingSoonOnboardingCity(value: unknown): boolean {
  return (
    isOnboardingCityId(value) && ONBOARDING_CITY_STATUS[value] === "coming_soon"
  );
}

/** Drop paused / coming-soon cities from saved prefs for booking UI. */
export function sanitizeOnboardingCities(cities: string[]): string[] {
  return cities.filter(isActiveOnboardingCity);
}

/** Map onboarding taste IDs to agenda experience moods for sorting. */
export function interestsToMoods(
  interests: WaitlistInterestId[],
): Array<"tastings" | "wineWalk" | "chefsSpecial"> {
  const moods: Array<"tastings" | "wineWalk" | "chefsSpecial"> = [];
  for (const id of interests) {
    if (id === "wine_tasting") moods.push("tastings");
    if (id === "wine_walk" || id === "food_walk") moods.push("wineWalk");
    if (id === "chefs_special") moods.push("chefsSpecial");
  }
  return moods;
}

export function parseOnboardingLanguages(
  raw: unknown,
): OnboardingLanguageId[] {
  if (!Array.isArray(raw)) return ["nl"];
  const langs = raw.filter(
    (value): value is OnboardingLanguageId =>
      value === "nl" || value === "en",
  );
  return langs.length > 0 ? [...new Set(langs)] : ["nl"];
}

export function toggleOnboardingLanguage(
  current: OnboardingLanguageId[],
  id: OnboardingLanguageId,
): OnboardingLanguageId[] {
  if (current.includes(id)) {
    if (current.length <= 1) return current;
    return current.filter((lang) => lang !== id);
  }
  return [...current, id];
}

export function ageFromBirthDate(iso: string | null | undefined): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const month = today.getMonth() + 1;
  const day = today.getDate();
  if (month < m || (month === m && day < d)) age -= 1;
  return age;
}

/** Latest calendar date that still means minAge years old today. */
export function latestLegalBirthDate(
  minAge: number = MIN_ONBOARDING_AGE,
): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setFullYear(d.getFullYear() - minAge);
  return d;
}

export function isAtLeastMinAge(
  iso: string | null | undefined,
  minAge: number = MIN_ONBOARDING_AGE,
): boolean {
  const age = ageFromBirthDate(iso);
  return age !== null && age >= minAge;
}

/** Birth years that can still yield a legal age (newest first). */
export function onboardingBirthYears(
  minAge: number = MIN_ONBOARDING_AGE,
  span = 80,
): number[] {
  const newest = latestLegalBirthDate(minAge).getFullYear();
  return Array.from({ length: span }, (_, i) => newest - i);
}

export function buildBirthDate(
  day: number,
  month: number,
  year: number,
): string | null {
  if (!day || !month || !year) return null;
  if (year < 1920 || year > new Date().getFullYear()) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseBirthDateParts(iso: string | null): {
  day: number;
  month: number;
  year: number;
} {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { day: 0, month: 0, year: 0 };
  }
  const [y, m, d] = iso.split("-").map(Number);
  return { day: d ?? 0, month: m ?? 0, year: y ?? 0 };
}

function parseTableType(raw: unknown): OnboardingTableTypeId | null {
  if (
    raw === "girls_only" ||
    raw === "mixed" ||
    raw === "no_preference"
  ) {
    return raw;
  }
  return null;
}

export function readOnboardingFromMetadata(
  meta: Record<string, unknown> | null | undefined,
): {
  completed: boolean;
  prefs: MemberOnboardingPrefs;
} {
  const raw = meta?.onboarding;
  const nameFromTop =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : "";

  const flagCompleted =
    meta?.onboarding_completed === true ||
    meta?.onboarding_completed === "true";

  if (!raw || typeof raw !== "object") {
    return {
      completed: flagCompleted,
      prefs: { ...EMPTY_ONBOARDING_PREFS, name: nameFromTop },
    };
  }
  const o = raw as Record<string, unknown>;
  const joinIntent =
    o.joinIntent === "meet_new" ||
    o.joinIntent === "with_group" ||
    o.joinIntent === "both"
      ? o.joinIntent
      : null;
  const company = isOnboardingCompanyId(o.company) ? o.company : null;
  const cities = Array.isArray(o.cities)
    ? o.cities.filter((c): c is string => typeof c === "string")
    : [];
  const interests = Array.isArray(o.interests)
    ? o.interests.filter(
        (i): i is WaitlistInterestId =>
          i === "wine_walk" ||
          i === "food_walk" ||
          i === "wine_tasting" ||
          i === "chefs_special" ||
          i === "aperitivo",
      )
    : [];
  const name =
    typeof o.name === "string" && o.name.trim()
      ? o.name.trim()
      : nameFromTop;
  const birthDate =
    typeof o.birthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.birthDate)
      ? o.birthDate
      : null;
  const gender =
    o.gender === "woman" ||
    o.gender === "man" ||
    o.gender === "non_binary" ||
    o.gender === "prefer_not"
      ? o.gender
      : null;
  const tableType = parseTableType(o.tableType);
  const personality = isOnboardingPersonalityId(o.personality)
    ? o.personality
    : null;
  const languages = parseOnboardingLanguages(o.languages);

  const completed =
    flagCompleted ||
    (typeof o.completedAt === "string" && o.completedAt.length > 0);

  return {
    completed,
    prefs: {
      name,
      birthDate,
      joinIntent,
      company,
      cities,
      cityFlexible: o.cityFlexible === true,
      gender,
      tableType:
        gender && gender !== "woman" && tableType === "girls_only"
          ? "mixed"
          : tableType,
      personality,
      languages,
      interests,
      communityInterest: o.communityInterest === true,
    },
  };
}

export function writeOnboardingToSession(prefs: MemberOnboardingPrefs): void {
  try {
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function clearOnboardingSession(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
    sessionStorage.removeItem(JOIN_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** Set after join-funnel signup so /account can auto-finish without treating redo as join. */
export const JOIN_PENDING_KEY = "mytable_join_pending";

export function markJoinPending(): void {
  try {
    sessionStorage.setItem(JOIN_PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearJoinPending(): void {
  try {
    sessionStorage.removeItem(JOIN_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function isJoinPending(): boolean {
  try {
    return sessionStorage.getItem(JOIN_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function readOnboardingFromSession(): MemberOnboardingPrefs | null {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MemberOnboardingPrefs>;
    return {
      ...EMPTY_ONBOARDING_PREFS,
      ...parsed,
      name: typeof parsed.name === "string" ? parsed.name : "",
      birthDate:
        typeof parsed.birthDate === "string" ? parsed.birthDate : null,
      joinIntent:
        parsed.joinIntent === "meet_new" ||
        parsed.joinIntent === "with_group" ||
        parsed.joinIntent === "both"
          ? parsed.joinIntent
          : null,
      gender:
        parsed.gender === "woman" ||
        parsed.gender === "man" ||
        parsed.gender === "non_binary" ||
        parsed.gender === "prefer_not"
          ? parsed.gender
          : null,
      cities: Array.isArray(parsed.cities) ? parsed.cities : [],
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      tableType:
        parsed.tableType === "girls_only" ||
        parsed.tableType === "mixed" ||
        parsed.tableType === "no_preference"
          ? parsed.tableType
          : null,
      personality: isOnboardingPersonalityId(parsed.personality)
        ? parsed.personality
        : null,
      languages: parseOnboardingLanguages(parsed.languages),
    };
  } catch {
    return null;
  }
}
