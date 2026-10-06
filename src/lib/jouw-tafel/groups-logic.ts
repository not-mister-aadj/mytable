/**
 * Groups at a "Jouw tafel" Sunday Table and the admin calendar, the pure
 * part. A group is 5 to 6 people (one conversation); under 4 or over 7 gets
 * a warning, never a block.
 */
import { isClosedEmpty, jouwTafelBookingWindow } from "@/lib/jouw-tafel/logic";

export const GROUP_TARGET = 6;
export const GROUP_MIN = 4;
export const GROUP_MAX = 7;

/** "Juni, groep 2". */
export function groupLabel(venueName: string, number: number): string {
  return `${venueName}, groep ${number}`;
}

/** A warning for a group of `seats` people, or null. An empty group is fine. */
export function groupWarning(seats: number): "too_small" | "too_big" | null {
  if (seats > GROUP_MAX) return "too_big";
  if (seats > 0 && seats < GROUP_MIN) return "too_small";
  return null;
}

/** The next free group number for a venue within an event. */
export function nextGroupNumber(existing: readonly number[]): number {
  let n = 1;
  const taken = new Set(existing);
  while (taken.has(n)) n += 1;
  return n;
}

export type CalendarState = "not_yet" | "bookable" | "full" | "closed";

/** What the calendar shows: not bookable yet (for anyone), bookable, full,
 * or closed because nobody booked it 14 days before. */
export function calendarState(
  event: { startsAt: string | Date; capacity: number; spotsSold: number; comingSoon: boolean; bookingOpensAt?: string | null },
  now: number = Date.now(),
): CalendarState {
  if (event.spotsSold >= event.capacity) return "full";
  if (isClosedEmpty(event, now)) return "closed";
  const opens = jouwTafelBookingWindow(event.startsAt, event.bookingOpensAt).membersFrom.getTime();
  if (event.comingSoon || now < opens) return "not_yet";
  return "bookable";
}

/** "2026-11" for a year and month (1-12). */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Parses "2026-11"; null when invalid. */
export function parseMonthKey(value: string | undefined | null): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? { year, month } : null;
}

/** The month before or after. */
export function shiftMonth(year: number, month: number, by: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + by;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/**
 * The weeks of a month view, Monday first: whole weeks of "YYYY-MM-DD",
 * including the days of the previous and next month that fill them.
 */
export function monthGrid(year: number, month: number): string[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // Monday = 0
  const start = new Date(first);
  start.setUTCDate(1 - offset);
  const last = new Date(Date.UTC(year, month, 0));
  const weeks: string[][] = [];
  const day = new Date(start);
  while (day <= last || weeks.length === 0 || weeks[weeks.length - 1]!.length < 7) {
    if (weeks.length === 0 || weeks[weeks.length - 1]!.length === 7) {
      if (day > last) break;
      weeks.push([]);
    }
    weeks[weeks.length - 1]!.push(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return weeks;
}

/** "35-44" style band for a guest card; null without an age. */
export function ageBand(age: number | null): string | null {
  if (age === null || !Number.isFinite(age)) return null;
  if (age < 25) return "<25";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}
