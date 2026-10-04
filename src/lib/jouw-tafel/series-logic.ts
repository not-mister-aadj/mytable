/**
 * "Jouw tafel" Sunday Table series, the pure part: which dates a series has,
 * given its rhythm, the pauses and the dates an admin removed. Dates are
 * "YYYY-MM-DD" (Amsterdam calendar days) throughout.
 */

/** How far ahead tables are created: two rounds of a 4-week rhythm. */
export const SERIES_HORIZON_DAYS = 56;

/** A table still "Binnenkort" this close to its date gets flagged in admin. */
export const SERIES_WARN_DAYS = 21;

export type SeriesRhythm = {
  firstDate: string;
  intervalWeeks: number;
  active: boolean;
};

export type SeriesPause = { startsOn: string; endsOn: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** `iso` plus `days` calendar days. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekday(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

export function isPaused(date: string, pauses: readonly SeriesPause[]): boolean {
  return pauses.some((p) => date >= p.startsOn && date <= p.endsOn);
}

/**
 * The dates a series should have a table on, from `from` up to and
 * including `to`: every `intervalWeeks` from its first date. A date in a
 * pause or removed by an admin is left out, but the rhythm runs on, so the
 * series keeps its own weeks after a break. Nothing for an inactive series.
 */
export function seriesDates(
  series: SeriesRhythm,
  window: { from: string; to: string },
  pauses: readonly SeriesPause[] = [],
  skipped: ReadonlySet<string> = new Set(),
): string[] {
  if (!series.active || !isIsoDate(series.firstDate)) return [];
  const step = Math.max(1, Math.floor(series.intervalWeeks)) * 7;
  const out: string[] = [];
  let date = series.firstDate;
  // Jump close to the window instead of walking from a first date far back.
  if (date < window.from) {
    const gap = Math.floor(
      (Date.parse(`${window.from}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
    );
    date = addDays(date, Math.floor(gap / step) * step);
  }
  for (; date <= window.to; date = addDays(date, step)) {
    if (date < window.from) continue;
    if (isPaused(date, pauses) || skipped.has(date)) continue;
    out.push(date);
  }
  return out;
}

/** The window the cron fills: today (a table today is still made, unless it
 * exists) up to SERIES_HORIZON_DAYS ahead. */
export function seriesWindow(today: string, horizonDays = SERIES_HORIZON_DAYS): { from: string; to: string } {
  return { from: today, to: addDays(today, horizonDays) };
}

/** "14:00" style, 00:00 to 23:59. */
export function isStartTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
