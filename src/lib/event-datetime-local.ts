import type { Locale } from "@/i18n/config";

/** Event wall-clock times are always Europe/Amsterdam (NL events). */
const EVENT_TIMEZONE = "Europe/Amsterdam";

const LOCAL_INPUT_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;

/** Format a Date for `<input type="datetime-local">` in Amsterdam time. */
export function formatEventDateTimeLocal(date: Date): string {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: EVENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return formatted.replace(" ", "T");
}

/**
 * Parse a datetime-local value as Amsterdam wall clock.
 * Avoids `new Date("YYYY-MM-DDTHH:mm")` which follows the server/browser TZ.
 */
export function parseEventDateTimeLocal(value: string): Date {
  const trimmed = value.trim();
  const match = LOCAL_INPUT_RE.exec(trimmed);
  if (!match) {
    return new Date(trimmed);
  }

  const target = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  // Amsterdam is UTC+1 (CET) or UTC+2 (CEST) — try both offsets.
  for (const offsetMinutes of [120, 60]) {
    const candidate = new Date(
      Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60_000,
    );
    if (formatEventDateTimeLocal(candidate) === target) {
      return candidate;
    }
  }

  // DST edge case: scan ±1 day in 1-minute steps.
  const anchor = Date.UTC(year, month - 1, day, 12, 0);
  for (let ms = anchor - 86_400_000; ms <= anchor + 86_400_000; ms += 60_000) {
    const candidate = new Date(ms);
    if (formatEventDateTimeLocal(candidate) === target) {
      return candidate;
    }
  }

  return new Date(NaN);
}

function capitalizeWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export type EventZonedParts = {
  weekday: string;
  day: string;
  month: string;
  hour: string;
  minute: string;
};

/** Calendar parts in Amsterdam wall clock — use for all public event display. */
export function getEventZonedParts(date: Date, locale: Locale): EventZonedParts {
  const localeTag = locale === "nl" ? "nl-NL" : "en-GB";
  const parts = new Intl.DateTimeFormat(localeTag, {
    timeZone: EVENT_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    weekday: capitalizeWord(pick("weekday")),
    day: pick("day"),
    month: pick("month"),
    hour: pick("hour"),
    minute: pick("minute"),
  };
}

export function formatEventWallClockTime(
  date: Date,
  locale: Locale = "nl",
): string {
  const { hour, minute } = getEventZonedParts(date, locale);
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/** Public cards, detail pages, emails: "Zondag 16 juni · 14:00–17:00" */
export function formatEventDateTimeDisplay(
  startsAt: Date,
  endsAt: Date | null,
  locale: Locale,
): string {
  const start = getEventZonedParts(startsAt, locale);
  const startTime = `${start.hour.padStart(2, "0")}:${start.minute.padStart(2, "0")}`;
  let timePart = startTime;
  if (endsAt) {
    const end = getEventZonedParts(endsAt, locale);
    timePart = `${startTime}–${end.hour.padStart(2, "0")}:${end.minute.padStart(2, "0")}`;
  }
  return `${start.weekday} ${start.day} ${start.month} · ${timePart}`;
}

/** Admin lists: "21 jun, 14:00" */
export function formatEventAdminListDate(
  date: Date,
  locale: Locale = "nl",
  options?: { weekday?: "short" },
): string {
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    timeZone: EVENT_TIMEZONE,
    ...(options?.weekday ? { weekday: options.weekday } : {}),
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
