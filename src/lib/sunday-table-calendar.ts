import { clubmemberPath, type Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/env";
import {
  amsterdamDateTime,
  amsterdamDateIso,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

/** Sunday Table runs 14:00–17:00 Europe/Amsterdam. */
export const SUNDAY_TABLE_DURATION_HOURS = 3;

export type SundayTableCalendarInput = {
  city: string;
  /** YYYY-MM-DD */
  tableDate: string;
  tableType: "girls_only" | "mixed";
  locale?: Locale;
  signupId?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format Date as UTC ICS timestamp: 20260802T120000Z */
export function toIcsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldIcsLine(line: string): string {
  const limit = 75;
  if (line.length <= limit) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, limit));
  rest = rest.slice(limit);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, limit - 1)}`);
    rest = rest.slice(limit - 1);
  }
  return parts.join("\r\n");
}

export function sundayTableEventBounds(tableDateIso: string): {
  start: Date;
  end: Date;
} | null {
  const start = parseAmsterdamDateIso(tableDateIso);
  if (!start) return null;
  const iso = amsterdamDateIso(start);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const end = amsterdamDateTime(
    year,
    month,
    day,
    14 + SUNDAY_TABLE_DURATION_HOURS,
    0,
    0,
  );
  return { start, end };
}

export function buildSundayTableCalendarCopy(input: SundayTableCalendarInput): {
  title: string;
  description: string;
  location: string;
} {
  const nl = input.locale !== "en";
  const tableLabel =
    input.tableType === "girls_only"
      ? "Girls only"
      : nl
        ? "Gemengd"
        : "Mixed";
  const title = `MyTable Sunday Table · ${input.city}`;
  const hub = `${getSiteUrl()}${clubmemberPath(input.locale ?? (nl ? "nl" : "en"))}`;
  const description = nl
    ? [
        `Sunday Table in ${input.city} (${tableLabel}).`,
        "14:00-17:00. Drankjes en hapjes op locatie.",
        "Exacte locatie krijg je 24 uur van tevoren per mail.",
        `Beheer je RSVP: ${hub}`,
      ].join("\n")
    : [
        `Sunday Table in ${input.city} (${tableLabel}).`,
        "2:00-5:00 PM. Drinks and bites on location.",
        "You’ll get the exact location by email 24 hours beforehand.",
        `Manage your RSVP: ${hub}`,
      ].join("\n");

  return {
    title,
    description,
    location: input.city,
  };
}

export function buildSundayTableIcs(input: SundayTableCalendarInput): string | null {
  const bounds = sundayTableEventBounds(input.tableDate);
  if (!bounds) return null;

  const { title, description, location } = buildSundayTableCalendarCopy(input);
  const uid = input.signupId
    ? `sunday-table-${input.signupId}@mytable.club`
    : `sunday-table-${input.tableDate}-${input.city}-${input.tableType}@mytable.club`;
  const stamp = toIcsUtc(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyTable//Sunday Table//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toIcsUtc(bounds.start)}`,
    `DTEND:${toIcsUtc(bounds.end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    `URL:${getSiteUrl()}${clubmemberPath(input.locale ?? "nl")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

/** Absolute URL that downloads the .ics for this Sunday Table. */
export function sundayTableCalendarDownloadUrl(
  input: SundayTableCalendarInput,
): string {
  const params = new URLSearchParams({
    city: input.city,
    date: input.tableDate,
    type: input.tableType,
    locale: input.locale ?? "nl",
  });
  if (input.signupId) params.set("signup_id", input.signupId);
  return `${getSiteUrl()}/api/clubmember/calendar?${params.toString()}`;
}

/** Google Calendar template link (opens add-event UI). */
export function sundayTableGoogleCalendarUrl(
  input: SundayTableCalendarInput,
): string {
  const bounds = sundayTableEventBounds(input.tableDate);
  if (!bounds) return sundayTableCalendarDownloadUrl(input);
  const { title, description, location } = buildSundayTableCalendarCopy(input);
  const dates = `${toIcsUtc(bounds.start).replace(/Z$/, "")}/${toIcsUtc(bounds.end).replace(/Z$/, "")}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details: description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
