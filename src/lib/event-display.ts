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
  locale: Locale,
): string {
  const parts = dateTime.split(" · ");
  const datePart = parts[0] ?? dateTime;
  const timePart = parts.slice(1).join(" · ");
  const shortDate = datePart
    .replace(locale === "nl" ? WEEKDAY_PREFIX_NL : WEEKDAY_PREFIX_EN, "")
    .trim();
  return [shortDate, timePart].filter(Boolean).join(" · ");
}

/** Spots remaining at or below this → agenda card shows “bijna vol” */
export const ALMOST_FULL_SPOTS_THRESHOLD = 14;

export function formatAlmostFullImageHint(
  spotsLeft: number,
  locale: Locale,
): string {
  if (locale === "nl") {
    return `Bijna uitverkocht, ${spotsLeft} tickets beschikbaar`;
  }
  return `Almost sold out, ${spotsLeft} tickets available`;
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
