import { eq } from "drizzle-orm";
import {
  bookings,
  customers,
  events,
  waitlistSignups,
} from "@/db/schema";
import { getDb } from "@/db/index";
import { isActiveAttendance } from "@/lib/booking-lifecycle";

function modeValue(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

export async function recalculateCustomerStats(customerId: string): Promise<void> {
  const db = getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer) return;

  const bookingRows = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.customerId, customerId));

  const waitlistRows = await db
    .select()
    .from(waitlistSignups)
    .where(eq(waitlistSignups.customerId, customerId));

  let totalBookings = 0;
  let paidBookingsCount = 0;
  let cancelledBookingsCount = 0;
  let movedBookingsCount = 0;
  let failedPaymentsCount = 0;
  let totalSpentCents = 0;
  let totalSeatsBooked = 0;
  let firstBookingAt: Date | null = null;
  let lastBookingAt: Date | null = null;
  const paidCities: string[] = [];
  const paidTypes: string[] = [];

  for (const { booking, event } of bookingRows) {
    totalBookings += 1;

    if (booking.paymentStatus === "failed") {
      failedPaymentsCount += 1;
      continue;
    }

    if (booking.lifecycleStatus === "removed") {
      cancelledBookingsCount += 1;
    }
    if (booking.lifecycleStatus === "transferred") {
      movedBookingsCount += 1;
    }

    if (booking.paymentStatus === "paid" && isActiveAttendance(booking)) {
      paidBookingsCount += 1;
      totalSpentCents += booking.amountCents;
      totalSeatsBooked += booking.seats;
      paidCities.push(event.city);
      paidTypes.push(event.experienceType);

      const paidAt = booking.createdAt;
      if (!firstBookingAt || paidAt < firstBookingAt) firstBookingAt = paidAt;
      if (!lastBookingAt || paidAt > lastBookingAt) lastBookingAt = paidAt;
    }
  }

  const favoriteCity = modeValue(paidCities);
  const favoriteEventType = modeValue(paidTypes);

  const seenDates = [
    customer.createdAt,
    customer.firstSeenAt,
    ...bookingRows.map(({ booking }) => booking.createdAt),
    ...waitlistRows.map((w) => w.createdAt),
  ];
  const firstSeenAt = seenDates.reduce((min, d) => (d < min ? d : min));
  const lastSeenAt = seenDates.reduce((max, d) => (d > max ? d : max));

  await db
    .update(customers)
    .set({
      totalBookings,
      paidBookingsCount,
      cancelledBookingsCount,
      movedBookingsCount,
      failedPaymentsCount,
      waitlistCount: waitlistRows.length,
      totalSpentCents,
      totalSeatsBooked,
      favoriteCity,
      favoriteEventType,
      preferredCity: favoriteCity ?? customer.preferredCity,
      firstBookingAt,
      lastBookingAt,
      firstSeenAt,
      lastSeenAt,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));
}

export async function recalculateCustomerStatsByEmail(
  email: string,
): Promise<void> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.emailNormalized, normalized))
    .limit(1);
  if (customer) {
    await recalculateCustomerStats(customer.id);
  }
}
