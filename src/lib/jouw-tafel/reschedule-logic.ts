// Self-service "verzetten" for a single (non-member) Sunday Table seat:
// pure and unit tested (npx tsx --test src/lib/jouw-tafel/*.test.ts).

import { isEventClosedForBooking } from "@/lib/event-visibility";
import { bracketFromEventName, sameCity } from "@/lib/jouw-tafel/logic";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";

/** Moving is free up to this many days before the start (terms art. 6). */
export const RESCHEDULE_CUTOFF_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** True while the booking can still be moved (at least 7 days ahead). */
export function canReschedule(startsAt: Date, now: number = Date.now()): boolean {
  return startsAt.getTime() - now >= RESCHEDULE_CUTOFF_DAYS * DAY_MS;
}

/** Whole days between now and the start (for analytics). */
export function daysBefore(startsAt: Date, now: number = Date.now()): number {
  return Math.floor((startsAt.getTime() - now) / DAY_MS);
}

export type RescheduleCandidate = {
  id: string;
  city: string;
  nameNl: string;
  startsAt: Date;
  capacity: number;
  spotsSold: number;
  workflowStatus: string;
  experienceType: string;
  comingSoon: boolean;
};

/**
 * The table a booking moves to: the next published, bookable Sunday Table
 * after the current one, in the same city, with the same age bracket
 * ("· 20-39" / "· 35+", or both without one: a table for everyone), with
 * room for all its seats. Null when there is none.
 */
export function pickRescheduleTarget(
  source: { id: string; city: string; nameNl: string; startsAt: Date },
  candidates: readonly RescheduleCandidate[],
  seats: number,
  now: number = Date.now(),
): RescheduleCandidate | null {
  const bracket = bracketFromEventName(source.nameNl);
  const options = candidates
    .filter(
      (e) =>
        e.id !== source.id &&
        e.experienceType === JOUW_TAFEL_TYPE &&
        e.workflowStatus === "published" &&
        !e.comingSoon &&
        sameCity(e.city, source.city) &&
        bracketFromEventName(e.nameNl) === bracket &&
        e.startsAt.getTime() > source.startsAt.getTime() &&
        !isEventClosedForBooking(e.startsAt, new Date(now)) &&
        e.capacity - e.spotsSold >= seats,
    )
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return options[0] ?? null;
}
