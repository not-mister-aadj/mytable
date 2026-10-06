// The table page and reserve step: pure, unit tested.

import { JOUW_TAFEL_SEAT_PRICE_CENTS, closedReason, spotsLeft, type QuizEvent } from "@/lib/jouw-tafel/logic";

/** "closed": full, nobody booked in time, or too late. One state on
 * purpose: a visitor never learns which of these it is. */
export type TableState = "open" | "soon" | "closed";

/** What the table page offers: reserve, notify (Binnenkort), or neither. */
export function tableState(event: QuizEvent, now: number = Date.now()): TableState {
  const reason = closedReason(event, now);
  if (reason === "past") return "closed";
  if (event.comingSoon) return "soon";
  return reason ? "closed" : "open";
}

/** Seats she can pick: 1 or 2, never more than are left. */
export function maxSeats(event: QuizEvent): 1 | 2 {
  return spotsLeft(event) >= 2 ? 2 : 1;
}

/** The single-seat total in the funnel (JOUW_TAFEL_SEAT_PRICE_CENTS each). */
export function singleTotalCents(seats: 1 | 2): number {
  return JOUW_TAFEL_SEAT_PRICE_CENTS * seats;
}
