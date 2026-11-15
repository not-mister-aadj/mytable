// A seat that came free after a late cancellation ("Kun je toch niet?") is
// offered to the people on that Sunday's waitlist who fit the group by age.
// The Sunday stays full on the site: only who got the mail can book it.
// Pure rules, no database. See seat-offer.ts for the rest.

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** No offer when the Sunday starts sooner than this. */
export const OFFER_MIN_HOURS_BEFORE = 4;
/** No mail between these hours (Amsterdam): it waits for the morning. */
export const QUIET_FROM_HOUR = 22;
export const QUIET_UNTIL_HOUR = 8;
/** This close to the Sunday the groups are largely made: the seat is cheaper. */
export const DISCOUNT_WITHIN_DAYS = 3;
export const DISCOUNT_PCT = 50;
/** A waitlister fits a group when their age is within its ages, give or take this. */
export const AGE_SLACK_YEARS = 5;

function amsterdamHour(at: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", hourCycle: "h23" }).format(at));
}

function isQuiet(at: Date): boolean {
  const hour = amsterdamHour(at);
  return hour >= QUIET_FROM_HOUR || hour < QUIET_UNTIL_HOUR;
}

/**
 * When the offer for a seat freed at `now` may go out: at once, or at 08:00
 * when it is night. Null when that moment is less than OFFER_MIN_HOURS_BEFORE
 * before the start: then nobody is mailed and the seat stays shut.
 */
export function offerMoment(startsAt: Date, now: Date): Date | null {
  let at = new Date(now);
  if (isQuiet(at)) {
    // On to the first quarter of an hour that is no longer night.
    at = new Date(Math.ceil(at.getTime() / (15 * 60 * 1000)) * 15 * 60 * 1000);
    for (let i = 0; i < 48 && isQuiet(at); i++) at = new Date(at.getTime() + 15 * 60 * 1000);
  }
  return startsAt.getTime() - at.getTime() >= OFFER_MIN_HOURS_BEFORE * HOUR_MS ? at : null;
}

/** Still time to send (or book) an offer at `now`? */
export function offerStillOpen(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() - now.getTime() >= OFFER_MIN_HOURS_BEFORE * HOUR_MS;
}

/** 50 within three days of the Sunday, else 0. */
export function offerDiscountPct(startsAt: Date, now: Date): number {
  return startsAt.getTime() - now.getTime() <= DISCOUNT_WITHIN_DAYS * DAY_MS ? DISCOUNT_PCT : 0;
}

export function offerPriceCents(baseCents: number, startsAt: Date, now: Date): number {
  return Math.round((baseCents * (100 - offerDiscountPct(startsAt, now))) / 100);
}

/** Age in whole years on `at`, from YYYY-MM-DD; null when it is no date. */
export function ageOn(birthDate: string | null | undefined, at: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate ?? "");
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  let age = at.getUTCFullYear() - y;
  if (at.getUTCMonth() + 1 < m || (at.getUTCMonth() + 1 === m && at.getUTCDate() < d)) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

/**
 * Does this person fit the group by age? Within the youngest and the oldest
 * of the group, give or take AGE_SLACK_YEARS. An age we do not know never
 * fits, and neither does anyone when no age in the group is known.
 */
export function ageFitsGroup(birthDate: string | null | undefined, groupBirthDates: readonly (string | null | undefined)[], at: Date): boolean {
  const age = ageOn(birthDate, at);
  const ages = groupBirthDates.map((b) => ageOn(b, at)).filter((a): a is number => a !== null);
  if (age === null || ages.length === 0) return false;
  return age >= Math.min(...ages) - AGE_SLACK_YEARS && age <= Math.max(...ages) + AGE_SLACK_YEARS;
}

/**
 * The table's language is a hard line: someone who only speaks English does
 * not join a group where someone only speaks Dutch, and the other way round.
 * `person` and the group's entries: "dutch" | "english" | "both" (or unknown).
 */
export function languageFitsGroup(person: string | null | undefined, group: readonly (string | null | undefined)[]): boolean {
  const only = (value: string | null | undefined) => (value === "dutch" || value === "english" ? value : null);
  const mine = only(person);
  const theirs = new Set(group.map(only).filter(Boolean));
  if (mine === "english" && theirs.has("dutch")) return false;
  if (mine === "dutch" && theirs.has("english")) return false;
  return true;
}
