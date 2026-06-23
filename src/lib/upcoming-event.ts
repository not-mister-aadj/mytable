import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";

const MONTHS_NL: Record<string, number> = {
  januari: 0,
  februari: 1,
  maart: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  augustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  december: 11,
};

const MONTHS_EN: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** Parses agenda dateTime strings like "Zondag 16 juni · 12:00–17:00". */
export function parseExperienceStartsAt(
  dateTime: string,
  locale: Locale,
): Date | null {
  const segments = dateTime.split("·").map((s) => s.trim());
  if (segments.length < 2) return null;

  const datePart = segments[0].replace(/^\S+\s+/, "");
  const timePart = segments[1];
  const dateMatch = datePart.match(/^(\d{1,2})\s+(\S+)$/i);
  if (!dateMatch) return null;

  const day = Number.parseInt(dateMatch[1], 10);
  const monthKey = dateMatch[2].toLowerCase();
  const months = locale === "nl" ? MONTHS_NL : MONTHS_EN;
  const month = months[monthKey];
  if (month === undefined) return null;

  const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;

  const hours = Number.parseInt(timeMatch[1], 10);
  const minutes = Number.parseInt(timeMatch[2], 10);
  const now = new Date();
  const year = now.getFullYear();
  let candidate = new Date(year, month, day, hours, minutes, 0, 0);
  if (candidate.getTime() < now.getTime()) {
    candidate = new Date(year + 1, month, day, hours, minutes, 0, 0);
  }
  return candidate;
}

function experienceSortTime(item: ExperienceItem, locale: Locale): number {
  if (item.startsAt) {
    const parsed = Date.parse(item.startsAt);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return parseExperienceStartsAt(item.dateTime, locale)?.getTime() ?? Infinity;
}

export function sortExperiencesByDate(
  items: ExperienceItem[],
  locale: Locale,
): ExperienceItem[] {
  return [...items].sort(
    (a, b) => experienceSortTime(a, locale) - experienceSortTime(b, locale),
  );
}

/** First upcoming bookable event in the agenda timeline. */
export function getNextUpcomingExperience(
  items: ExperienceItem[],
  locale: Locale,
): ExperienceItem | null {
  const now = Date.now();
  const upcoming = sortExperiencesByDate(items, locale).filter((item) => {
    if (item.status === "soldOut" || item.status === "closed") return false;
    const at = item.startsAt
      ? Date.parse(item.startsAt)
      : parseExperienceStartsAt(item.dateTime, locale)?.getTime();
    return at !== undefined && !Number.isNaN(at) && at >= now;
  });
  return upcoming[0] ?? null;
}
