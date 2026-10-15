// Which Sunday Socials to open early so every city always has two that can
// be booked. Pure: the cron (auto-open.ts) loads the tables and saves.

import {
  JOUW_TAFEL_DATES_PER_CITY,
  isNoLongerBookable,
  jouwTafelBookingWindow,
  supportedCity,
} from "@/lib/jouw-tafel/logic";

export type AutoOpenTable = {
  id: string;
  city: string;
  startsAt: Date;
  capacity: number;
  spotsSold: number;
  /** "jouw-tafel" (a series table, opens 4 weeks before) or "sunday-table"
   * (hand-made, open from the moment it was made). */
  handMade: boolean;
  comingSoon: boolean;
  bookingOpensAt: string | null;
};

/** Can be booked right now (open, seats left, not closed). */
export function isBookableNow(t: AutoOpenTable, now: number): boolean {
  if (t.comingSoon || t.capacity <= 0) return false;
  if (!t.handMade && now < jouwTafelBookingWindow(t.startsAt, t.bookingOpensAt).membersFrom.getTime()) return false;
  return !isNoLongerBookable(
    { startsAt: t.startsAt, capacity: t.capacity, spotsSold: t.spotsSold, bookingOpensAt: t.handMade ? null : t.bookingOpensAt },
    now,
  );
}

/**
 * The series tables to open now: per city of ours, the next ones that are
 * not open yet (their usual window, 4 weeks before, has not started and
 * nobody opened them by hand), until the city has JOUW_TAFEL_DATES_PER_CITY
 * bookable Sundays. A table that already had its window and closed (full,
 * or empty two weeks before) is never opened again; a date with a
 * hand-made table never gets its series table opened as well.
 */
export function tablesToOpen(tables: readonly AutoOpenTable[], now: number, perCity = JOUW_TAFEL_DATES_PER_CITY): string[] {
  const future = tables.filter((t) => t.startsAt.getTime() > now);
  const byCity = new Map<string, AutoOpenTable[]>();
  for (const t of future) {
    const city = supportedCity(t.city);
    if (!city) continue;
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city)!.push(t);
  }
  const out: string[] = [];
  for (const list of byCity.values()) {
    const handMadeDays = new Set(list.filter((t) => t.handMade && t.capacity > 0).map((t) => t.startsAt.toDateString()));
    let bookable = list.filter((t) => isBookableNow(t, now)).length;
    const candidates = list
      .filter(
        (t) =>
          !t.handMade &&
          !t.comingSoon &&
          !t.bookingOpensAt &&
          now < jouwTafelBookingWindow(t.startsAt).membersFrom.getTime() &&
          !handMadeDays.has(t.startsAt.toDateString()),
      )
      .filter((t) => t.capacity > t.spotsSold)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    for (const t of candidates) {
      if (bookable >= perCity) break;
      // Opened now it must stay bookable now (not closed as empty at once).
      if (!isBookableNow({ ...t, bookingOpensAt: new Date(now).toISOString() }, now)) continue;
      out.push(t.id);
      bookable += 1;
    }
  }
  return out;
}
