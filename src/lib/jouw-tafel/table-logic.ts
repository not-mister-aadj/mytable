// The table page and reserve step: pure, unit tested.

import { isEventClosedForBooking } from "@/lib/event-visibility";
import { JOUW_TAFEL_SEAT_PRICE_CENTS, spotsLeft, type QuizEvent } from "@/lib/jouw-tafel/logic";

export type TableState = "open" | "soon" | "sold_out" | "closed";

/** What the table page offers: reserve, notify (Binnenkort), or neither. */
export function tableState(event: QuizEvent, now: number = Date.now()): TableState {
  if (new Date(event.startsAt).getTime() <= now || isEventClosedForBooking(new Date(event.startsAt), new Date(now))) {
    return "closed";
  }
  if (event.comingSoon) return "soon";
  if (spotsLeft(event) <= 0) return "sold_out";
  return "open";
}

/** Seats she can pick: 1 or 2, never more than are left. */
export function maxSeats(event: QuizEvent): 1 | 2 {
  return spotsLeft(event) >= 2 ? 2 : 1;
}

/** The single-seat total in the funnel (JOUW_TAFEL_SEAT_PRICE_CENTS each). */
export function singleTotalCents(seats: 1 | 2): number {
  return JOUW_TAFEL_SEAT_PRICE_CENTS * seats;
}
