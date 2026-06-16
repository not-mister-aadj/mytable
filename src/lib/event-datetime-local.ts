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
