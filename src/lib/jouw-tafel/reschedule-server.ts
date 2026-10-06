import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings, customers, events, type Booking, type Event } from "@/db/schema";
import { transferBooking } from "@/lib/booking-transfer";
import { normalizeEmail } from "@/lib/customers/normalize";
import {
  canReschedule,
  daysBefore,
  pickRescheduleTarget,
  type RescheduleCandidate,
} from "@/lib/jouw-tafel/reschedule-logic";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { bookingOpensOverride, jouwTafelBookingWindow } from "@/lib/jouw-tafel/logic";

export type RescheduleOption =
  | { state: "available"; targetEventId: string; targetStartsAt: string }
  | { state: "too_late" }
  | { state: "none" };

/** Every published, upcoming Sunday Table (the possible targets). */
export async function loadRescheduleCandidates(): Promise<RescheduleCandidate[]> {
  const rows = await getDb()
    .select()
    .from(events)
    .where(and(eq(events.experienceType, JOUW_TAFEL_TYPE), eq(events.workflowStatus, "published"), gt(events.startsAt, new Date())));
  return rows.map(toCandidate);
}

function toCandidate(e: Event): RescheduleCandidate {
  return {
    id: e.id,
    city: e.city,
    nameNl: e.nameNl,
    startsAt: e.startsAt,
    capacity: e.capacity,
    spotsSold: e.spotsSold,
    workflowStatus: e.workflowStatus,
    experienceType: e.experienceType,
    bookingOpensAt: bookingOpensOverride(e.extras),
    // Only a table that is open for booking (at least for members).
    comingSoon: Boolean(e.extras?.comingSoon) || Date.now() < jouwTafelBookingWindow(e.startsAt, bookingOpensOverride(e.extras)).membersFrom.getTime(),
  };
}

/** Whether (and where) a single Sunday Table seat can be moved now. */
export function rescheduleOption(
  source: { id: string; city: string; nameNl: string; startsAt: Date },
  seats: number,
  candidates: readonly RescheduleCandidate[],
  now: number = Date.now(),
): RescheduleOption {
  if (!canReschedule(source.startsAt, now)) return { state: "too_late" };
  const target = pickRescheduleTarget(source, candidates, seats, now);
  return target
    ? { state: "available", targetEventId: target.id, targetStartsAt: target.startsAt.toISOString() }
    : { state: "none" };
}

export type RescheduleResult =
  | { ok: true; alreadyMoved: boolean; newBookingId: string; startsAt: string; city: string; daysBefore: number }
  | {
      ok: false;
      status: number;
      code: "not_found" | "not_movable" | "too_late" | "no_target" | "target_changed" | "failed";
      city?: string;
    };

/**
 * The customer moves their own single Sunday Table booking to the next
 * Sunday (same city and age bracket), through the same transfer the admin
 * uses. Only their own booking (by email or their customer id).
 * Idempotent: a booking that was already moved answers with where it went.
 */
export async function rescheduleOwnBooking(input: {
  bookingId: string;
  email: string;
  expectedTargetEventId?: string | null;
  now?: number;
  /** Extra rule from the caller (member bookings cancel instead). */
  isExcluded?: (booking: Booking) => boolean;
}): Promise<RescheduleResult> {
  const now = input.now ?? Date.now();
  const db = getDb();
  const normalized = normalizeEmail(input.email);
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.emailNormalized, normalized))
    .limit(1);
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  const owns =
    row && (row.booking.email.trim().toLowerCase() === normalized || (customer && row.booking.customerId === customer.id));
  if (!row || !owns) return { ok: false, status: 404, code: "not_found" };

  const alreadyMoved = async (): Promise<RescheduleResult | null> => {
    const [fresh] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
    if (fresh?.lifecycleStatus !== "transferred" || !fresh.transferredToBookingId) return null;
    const [moved] = await db
      .select({ booking: bookings, event: events })
      .from(bookings)
      .innerJoin(events, eq(bookings.eventId, events.id))
      .where(eq(bookings.id, fresh.transferredToBookingId))
      .limit(1);
    if (!moved) return null;
    return {
      ok: true,
      alreadyMoved: true,
      newBookingId: moved.booking.id,
      startsAt: moved.event.startsAt.toISOString(),
      city: moved.event.city,
      daysBefore: 0,
    };
  };

  if (row.booking.lifecycleStatus === "transferred") {
    return (await alreadyMoved()) ?? { ok: false, status: 409, code: "not_movable" };
  }
  if (
    row.event.experienceType !== JOUW_TAFEL_TYPE ||
    row.booking.paymentStatus !== "paid" ||
    row.booking.lifecycleStatus !== "active" ||
    input.isExcluded?.(row.booking)
  ) {
    return { ok: false, status: 409, code: "not_movable" };
  }

  const option = rescheduleOption(row.event, row.booking.seats, await loadRescheduleCandidates(), now);
  if (option.state === "too_late") return { ok: false, status: 409, code: "too_late" };
  if (option.state === "none") return { ok: false, status: 409, code: "no_target", city: row.event.city };
  if (input.expectedTargetEventId && input.expectedTargetEventId !== option.targetEventId) {
    return { ok: false, status: 409, code: "target_changed", city: row.event.city };
  }

  try {
    const moved = await transferBooking({
      bookingId: row.booking.id,
      targetEventId: option.targetEventId,
      by: "klant",
      selfService: true,
    });
    return {
      ok: true,
      alreadyMoved: false,
      newBookingId: moved.newBooking.id,
      startsAt: moved.targetEvent.startsAt.toISOString(),
      city: moved.targetEvent.city,
      daysBefore: daysBefore(row.event.startsAt, now),
    };
  } catch (error) {
    // A double tap: the other request moved it first.
    const done = await alreadyMoved();
    if (done) return done;
    console.error("[reschedule] transfer failed", error);
    return { ok: false, status: 500, code: "failed" };
  }
}
