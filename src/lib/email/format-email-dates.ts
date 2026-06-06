import type { Locale } from "@/i18n/config";

const WEEKDAYS_NL = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
] as const;

const MONTHS_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
] as const;

function formatTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatEmailDate(startsAt: Date, locale: Locale = "nl"): string {
  if (locale !== "nl") {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(startsAt);
  }

  const dayName = WEEKDAYS_NL[startsAt.getDay()];
  const day = startsAt.getDate();
  const month = MONTHS_NL[startsAt.getMonth()];
  return `${dayName} ${day} ${month}`;
}

export function formatEmailTime(
  startsAt: Date,
  endsAt: Date | null,
): string {
  const startTime = formatTime(startsAt);
  if (!endsAt) return startTime;
  return `${startTime}–${formatTime(endsAt)}`;
}
