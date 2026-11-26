import { amsterdamDateIso, amsterdamDateTime } from "@/lib/sunday-wine-table";

/**
 * Missed Sundays, agreed 15 November 2026. Everyone comes: a table is made
 * around the people who booked, so a seat given up late leaves a gap.
 *
 * Moving is free until 7 days before. After that the seat is fixed; giving
 * it up without someone in your place, or not showing up, is a miss. Both
 * weigh the same.
 *
 * - Every miss gets the same mail: we may choose not to seat them anymore.
 *   Nothing changes on its own; admin shows who missed in red (24 Nov 2026,
 *   replaces the higher price for the next seat).
 *
 * Members keep their own rule (terms art. 13, membership/no-show.ts).
 *
 * Giving up a seat only counts as a miss from Friday 12:00 before the
 * Sunday (about 50 hours before the start; 26 Nov 2026). Between 7 days
 * before and then the seat goes back to the waitlist without a miss.
 *
 * The mail goes out the Monday after, at 11:00, so a miss struck on Monday
 * morning can still take it back.
 *
 * Misses count over the last 6 months, and only for Sundays from the start
 * of the policy on. A miss an admin struck does not count.
 */

export const MISS_POLICY_START = new Date("2026-11-15T23:00:00Z");
/** Moving closes this long before the start; a seat given up after that is "cancelled late". */
export const LATE_CANCEL_HOURS = 7 * 24;
export const MISS_WINDOW_DAYS = 183;
/** Cancelled ill: let go when they did not cancel ill in this many days before. */
export const SICK_WINDOW_DAYS = 92;

export type MissKind = "late" | "no_show";

export type MissOutcome = { kind: "first" } | { kind: "repeat" };

/** After moving closed: less than 7 days before the start. */
export function isLateCancel(at: Date, startsAt: Date): boolean {
  return startsAt.getTime() - at.getTime() < LATE_CANCEL_HOURS * 3600_000;
}

/** From this moment a seat given up counts as a miss: the Friday before, 12:00 Amsterdam. */
export function missCancelFrom(startsAt: Date): Date {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  return amsterdamDateTime(y, m, d - 2, 12, 0);
}

/** A seat given up from Friday 12:00 before the Sunday: a miss (mail, counts). */
export function isMissCancel(at: Date, startsAt: Date): boolean {
  return at.getTime() >= missCancelFrom(startsAt).getTime();
}

/** The same moment in SQL, for a booking joined with its event: Friday 12:00 Amsterdam before e.starts_at. */
export const MISS_CANCEL_FROM_SQL =
  "((date_trunc('day', e.starts_at at time zone 'Europe/Amsterdam') - interval '2 days' + interval '12 hours') at time zone 'Europe/Amsterdam')";

/** What this miss means, given how many earlier ones still count. */
export function missOutcome(prior: number): MissOutcome {
  return prior === 0 ? { kind: "first" } : { kind: "repeat" };
}

/** The Monday after the Sunday, 11:00 Amsterdam; null once that has passed (send now). */
export function missMailAt(startsAt: Date, now: Date = new Date()): Date | null {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  const at = amsterdamDateTime(y, m, d + 1, 11, 0);
  return at.getTime() > now.getTime() + 2 * 60_000 ? at : null;
}
