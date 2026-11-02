import { addOneMonth } from "@/lib/membership/logic";
import { amsterdamDateIso, amsterdamDateTime } from "@/lib/sunday-wine-table";

/**
 * Missed Sundays, agreed 2 November 2026: cancelling less than 48 hours
 * before, or not showing up, has consequences.
 *
 * - Late cancel: the first time a warning, the second time 3 months no
 *   booking (members 1 month: their membership keeps running).
 * - No-show: the first time a warning and 1 month no booking, the second
 *   time 6 months. Members keep their own no-show rule (membership/no-show.ts).
 *
 * The mail goes out the Monday after, at 11:00, so a move agreed on Monday
 * morning can still take it back; the block starts right away.
 *
 * Each kind counts on its own, over the last 6 months, and only for Sundays
 * from the start of the policy on. A miss an admin struck does not count.
 */

export const MISS_POLICY_START = new Date("2026-11-02T17:00:00Z");
export const LATE_CANCEL_HOURS = 48;
export const MISS_WINDOW_DAYS = 183;

export type MissKind = "late" | "no_show";

export type MissOutcome =
  | { kind: "warning" }
  | { kind: "warning_block"; until: Date }
  | { kind: "block"; until: Date };

export function addMonths(date: Date, months: number): Date {
  let out = date;
  for (let i = 0; i < months; i++) out = addOneMonth(out);
  return out;
}

/** Less than 48 hours before the start (and not after it). */
export function isLateCancel(at: Date, startsAt: Date): boolean {
  return startsAt.getTime() - at.getTime() < LATE_CANCEL_HOURS * 3600_000;
}

/** What this miss means, given how many of the same kind still count. */
export function missOutcome(kind: MissKind, priorSameKind: number, member: boolean, now: Date = new Date()): MissOutcome {
  if (kind === "late") {
    return priorSameKind === 0 ? { kind: "warning" } : { kind: "block", until: addMonths(now, member ? 1 : 3) };
  }
  return priorSameKind === 0 ? { kind: "warning_block", until: addMonths(now, 1) } : { kind: "block", until: addMonths(now, 6) };
}

/** The Monday after the Sunday, 11:00 Amsterdam; null once that has passed (send now). */
export function missMailAt(startsAt: Date, now: Date = new Date()): Date | null {
  const [y, m, d] = amsterdamDateIso(startsAt).split("-").map(Number) as [number, number, number];
  const at = amsterdamDateTime(y, m, d + 1, 11, 0);
  return at.getTime() > now.getTime() + 2 * 60_000 ? at : null;
}

/** Months off for a block, for the mail ("3 maanden"). */
export function blockMonths(kind: MissKind, outcome: MissOutcome, member: boolean): number {
  if (outcome.kind === "warning") return 0;
  if (kind === "no_show") return outcome.kind === "warning_block" ? 1 : 6;
  return member ? 1 : 3;
}
