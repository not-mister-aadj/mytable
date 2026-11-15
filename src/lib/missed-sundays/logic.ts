import { addOneMonth } from "@/lib/membership/logic";
import { amsterdamDateIso, amsterdamDateTime } from "@/lib/sunday-wine-table";

/**
 * Missed Sundays, agreed 15 November 2026. Everyone comes: a table is made
 * around the people who booked, so a seat given up late leaves a gap.
 *
 * Moving is free until 7 days before. After that the seat is fixed; giving
 * it up without someone in your place, or not showing up, is a miss.
 *
 * - The first miss of a kind is let go: a mail that says so, and what the
 *   next one means. No block.
 * - From the second: no booking for a while. Giving up the seat late 1 month,
 *   not showing up 3 months, and double that each time after.
 *
 * Members keep their own rule (terms art. 13, membership/no-show.ts).
 *
 * The mail goes out the Monday after, at 11:00, so a miss struck on Monday
 * morning can still take it back; a block starts right away.
 *
 * Each kind counts on its own, over the last 6 months, and only for Sundays
 * from the start of the policy on. A miss an admin struck does not count.
 */

export const MISS_POLICY_START = new Date("2026-11-15T23:00:00Z");
/** Moving closes this long before the start; a seat given up after that is a miss. */
export const LATE_CANCEL_HOURS = 7 * 24;
export const MISS_WINDOW_DAYS = 183;
/** The first block of each kind, in months; doubled for every miss after. */
export const BLOCK_MONTHS: Record<"late" | "no_show", number> = { late: 1, no_show: 3 };

export type MissKind = "late" | "no_show";

export type MissOutcome = { kind: "warning" } | { kind: "block"; until: Date };

export function addMonths(date: Date, months: number): Date {
  let out = date;
  for (let i = 0; i < months; i++) out = addOneMonth(out);
  return out;
}

/** After moving closed: less than 7 days before the start. */
export function isLateCancel(at: Date, startsAt: Date): boolean {
  return startsAt.getTime() - at.getTime() < LATE_CANCEL_HOURS * 3600_000;
}

/** Months off for the miss that follows `priorSameKind` earlier ones (the first of all is never a block: this is what the next one costs). */
export function blockMonthsAfter(kind: MissKind, priorSameKind: number): number {
  return BLOCK_MONTHS[kind] * 2 ** Math.max(0, priorSameKind - 1);
}

/** What this miss means, given how many of the same kind still count. */
export function missOutcome(kind: MissKind, priorSameKind: number, now: Date = new Date()): MissOutcome {
  return priorSameKind === 0 ? { kind: "warning" } : { kind: "block", until: addMonths(now, blockMonthsAfter(kind, priorSameKind)) };
}

/** The Monday after the Sunday, 11:00 Amsterdam; null once that has passed (send now). */
export function missMailAt(startsAt: Date, now: Date = new Date()): Date | null {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  const at = amsterdamDateTime(y, m, d + 1, 11, 0);
  return at.getTime() > now.getTime() + 2 * 60_000 ? at : null;
}
