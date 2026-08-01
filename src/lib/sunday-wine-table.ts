/** Europe/Amsterdam calendar helpers for Sunday Wine Table (first Sunday of each month). */

const AMSTERDAM = "Europe/Amsterdam";

function amsterdamParts(date: Date): {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: AMSTERDAM,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Instant for a civil date/time in Europe/Amsterdam. */
export function amsterdamDateTime(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const asAmsterdam = amsterdamParts(new Date(utcGuess));
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const actualAsUtc = Date.UTC(
    asAmsterdam.year,
    asAmsterdam.month - 1,
    asAmsterdam.day,
    asAmsterdam.hour,
    asAmsterdam.minute,
    asAmsterdam.second,
  );
  return new Date(utcGuess + (desiredAsUtc - actualAsUtc));
}

/** First Sunday of a given month (month 1–12). */
export function firstSundayOfMonth(year: number, month: number): Date {
  const first = amsterdamDateTime(year, month, 1, 14, 0, 0);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: AMSTERDAM,
    weekday: "short",
  }).format(first);
  const offset: Record<string, number> = {
    Sun: 0,
    Mon: 6,
    Tue: 5,
    Wed: 4,
    Thu: 3,
    Fri: 2,
    Sat: 1,
  };
  const day = 1 + (offset[weekday] ?? 0);
  return amsterdamDateTime(year, month, day, 14, 0, 0);
}

/**
 * Next Sunday Wine Table: first Sunday of the month at 14:00 Europe/Amsterdam.
 * If today's first Sunday has already started (or passed), returns next month's.
 */
export function getNextSundayWineTable(from: Date = new Date()): Date {
  const { year, month } = amsterdamParts(from);
  const thisMonth = firstSundayOfMonth(year, month);
  if (thisMonth.getTime() > from.getTime()) return thisMonth;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return firstSundayOfMonth(nextYear, nextMonth);
}

/**
 * Next N first-Sunday Wine Tables still open for RSVP.
 * Skips months whose Friday 16:00 deadline has passed, so the following
 * month becomes bookable as soon as the current signup window closes.
 */
export function getUpcomingSundayWineTables(
  count = 3,
  from: Date = new Date(),
): Date[] {
  const out: Date[] = [];
  let cursor = from;
  let guard = 0;
  while (out.length < count && guard < 24) {
    guard += 1;
    const next = getNextSundayWineTable(cursor);
    if (isSundayTableRsvpOpen(next, from)) {
      out.push(next);
    }
    cursor = new Date(next.getTime() + 1000);
  }
  return out;
}

/**
 * First Sundays covering at least `minMonths` ahead (and always ≥ 2 dates).
 * E.g. from late July with minMonths=2 → August + September.
 */
export function getSundayWineTablesForHorizon(
  minMonths = 2,
  from: Date = new Date(),
): Date[] {
  const { year, month } = amsterdamParts(from);
  let endMonth = month + minMonths;
  let endYear = year;
  while (endMonth > 12) {
    endMonth -= 12;
    endYear += 1;
  }
  const horizon = firstSundayOfMonth(endYear, endMonth);

  const out: Date[] = [];
  let cursor = from;
  while (out.length < 12) {
    const next = getNextSundayWineTable(cursor);
    out.push(next);
    if (next.getTime() >= horizon.getTime() && out.length >= 2) break;
    cursor = new Date(next.getTime() + 1000);
  }
  return out;
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export function countdownParts(
  target: Date,
  now: Date = new Date(),
): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalMs };
}

export function formatSundayTableDate(
  date: Date,
  locale: "nl" | "en",
): string {
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    timeZone: AMSTERDAM,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Shorter date for compact cards/lists (no year). */
export function formatSundayTableCardDate(
  date: Date,
  locale: "nl" | "en",
): string {
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    timeZone: AMSTERDAM,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatSundayTableTime(locale: "nl" | "en"): string {
  return locale === "nl" ? "14:00" : "2:00 PM";
}

/** Card primary line: "Zondag 2 augustus · 14:00". */
export function formatSundayTableCardDateTime(
  date: Date,
  locale: "nl" | "en",
): string {
  const datePart = formatSundayTableCardDate(date, locale);
  const capitalized =
    datePart.charAt(0).toLocaleUpperCase(locale === "nl" ? "nl-NL" : "en-GB") +
    datePart.slice(1);
  return `${capitalized} · ${formatSundayTableTime(locale)}`;
}

/** Civil date YYYY-MM-DD in Europe/Amsterdam. */
export function amsterdamDateIso(date: Date): string {
  const { year, month, day } = amsterdamParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parse YYYY-MM-DD as a Sunday Table instant (14:00 Europe/Amsterdam). */
export function parseAmsterdamDateIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return amsterdamDateTime(year, month, day, 14, 0, 0);
}

/**
 * RSVP closes Friday 16:00 Europe/Amsterdam, two calendar days before the
 * Sunday Table.
 */
export function sundayTableRsvpDeadline(tableSunday: Date): Date {
  const { year, month, day } = amsterdamParts(tableSunday);
  // Noon anchor avoids DST edge cases when shifting calendar days.
  const sundayNoon = amsterdamDateTime(year, month, day, 12, 0, 0);
  const fridayParts = amsterdamParts(
    new Date(sundayNoon.getTime() - 2 * 24 * 60 * 60 * 1000),
  );
  return amsterdamDateTime(
    fridayParts.year,
    fridayParts.month,
    fridayParts.day,
    16,
    0,
    0,
  );
}

export type SundayTableRsvpWindow = "open" | "urgent" | "closed";

/** Last 48 hours before the Friday 16:00 deadline → urgent. */
const RSVP_URGENT_MS = 48 * 60 * 60 * 1000;

export function getSundayTableRsvpWindow(
  tableSunday: Date,
  now: Date = new Date(),
): SundayTableRsvpWindow {
  const deadline = sundayTableRsvpDeadline(tableSunday);
  if (now.getTime() >= deadline.getTime()) return "closed";
  if (deadline.getTime() - now.getTime() <= RSVP_URGENT_MS) return "urgent";
  return "open";
}

export function isSundayTableRsvpOpen(
  tableSunday: Date,
  now: Date = new Date(),
): boolean {
  return getSundayTableRsvpWindow(tableSunday, now) !== "closed";
}
