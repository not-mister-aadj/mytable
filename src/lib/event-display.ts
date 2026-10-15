import type { Locale } from "@/i18n/config";
import type { ExperienceStatusKey } from "@/i18n/types";
import { formatEventDateTimeDisplay } from "@/lib/event-datetime-local";
import { isEventClosedForBooking } from "@/lib/event-visibility";

export function formatDateTime(
  startsAt: Date,
  endsAt: Date | null,
  locale: Locale,
): string {
  return formatEventDateTimeDisplay(startsAt, endsAt, locale);
}

const WEEKDAY_PREFIX_NL = /^(Zondag|Maandag|Dinsdag|Woensdag|Donderdag|Vrijdag|Zaterdag)\s+/;
const WEEKDAY_PREFIX_EN = /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+/;

/** Compact agenda card line: "16 juni · 14:00 · Rotterdam" */
export function formatCardMetaLine(
  dateTime: string,
  city: string,
  locale: Locale,
): string {
  const parts = dateTime.split(" · ");
  const datePart = parts[0] ?? dateTime;
  const timePart = parts.slice(1).join(" · ");
  const shortDate = datePart
    .replace(locale === "nl" ? WEEKDAY_PREFIX_NL : WEEKDAY_PREFIX_EN, "")
    .trim();
  return [shortDate, timePart, city].filter(Boolean).join(" · ");
}

/** Date and time only — city is shown separately on the card */
export function formatCardDateTimeLine(
  dateTime: string,
  _locale: Locale,
): string {
  const parts = dateTime.split(" · ");
  const datePart = parts[0] ?? dateTime;
  const timePart = parts.slice(1).join(" · ");
  const capitalizedDate =
    datePart.length > 0
      ? datePart.charAt(0).toUpperCase() + datePart.slice(1)
      : datePart;
  return [capitalizedDate, timePart].filter(Boolean).join(" · ");
}

/** Spots remaining at or below this → agenda card shows “bijna vol” */
export const ALMOST_FULL_SPOTS_THRESHOLD = 14;

export function formatSpotsLeftHint(
  spotsLeft: number,
  locale: Locale,
): string {
  if (locale === "nl") {
    return spotsLeft === 1 ? "Nog maar 1 plek" : `Nog maar ${spotsLeft} plekken`;
  }
  return spotsLeft === 1 ? "Only 1 spot left" : `Only ${spotsLeft} spots left`;
}

/** A Sunday Social is filled one table at a time: the seats shown are the
 * seats left at the table being filled (5 a table), never more than the
 * event has left. The event's capacity stays the real limit. */
export const SUNDAY_SOCIAL_TABLE_SIZE = 5;

export function tableSpotsLeft(
  capacity: number,
  spotsSold: number,
  tableSize: number = SUNDAY_SOCIAL_TABLE_SIZE,
): number {
  const left = Math.max(0, capacity - spotsSold);
  if (left === 0) return 0;
  const atTable = tableSize - (Math.max(0, spotsSold) % tableSize);
  return Math.min(atTable, left);
}

/** "Nog 2 plekken aan deze tafel": the table being filled, so it never
 * reads as if the whole afternoon is nearly full. */
export function formatTableSpotsLeftHint(spotsLeft: number, locale: Locale): string {
  if (locale === "nl") {
    return spotsLeft === 1 ? "Nog 1 plek aan deze tafel" : `Nog ${spotsLeft} plekken aan deze tafel`;
  }
  return spotsLeft === 1 ? "1 spot left at this table" : `${spotsLeft} spots left at this table`;
}

export function formatAlmostFullImageHint(
  spotsLeft: number,
  locale: Locale,
): string {
  if (locale === "nl") {
    return `Nog ${spotsLeft} tickets`;
  }
  return `${spotsLeft} tickets left`;
}

export function deriveDisplayStatus(
  capacity: number,
  spotsSold: number,
  publishedAt: Date | null,
  startsAt: Date,
  now = new Date(),
): ExperienceStatusKey {
  if (isEventClosedForBooking(startsAt, now)) return "closed";

  const left = capacity - spotsSold;
  if (left <= 0) return "soldOut";
  if (left <= ALMOST_FULL_SPOTS_THRESHOLD) return "almostFull";
  if (publishedAt) {
    const days =
      (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 14) return "new";
  }
  return "available";
}
