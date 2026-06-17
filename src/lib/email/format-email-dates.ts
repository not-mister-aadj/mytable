import type { Locale } from "@/i18n/config";
import {
  formatEventWallClockTime,
  getEventZonedParts,
} from "@/lib/event-datetime-local";

export function formatEmailDate(startsAt: Date, locale: Locale = "nl"): string {
  const { weekday, day, month } = getEventZonedParts(startsAt, locale);
  return `${weekday} ${day} ${month}`;
}

export function formatEmailTime(
  startsAt: Date,
  endsAt: Date | null,
  locale: Locale = "nl",
): string {
  const startTime = formatEventWallClockTime(startsAt, locale);
  if (!endsAt) return startTime;
  return `${startTime}–${formatEventWallClockTime(endsAt, locale)}`;
}
