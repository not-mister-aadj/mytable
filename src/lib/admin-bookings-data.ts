import { desc, eq } from "drizzle-orm";
import type { Event } from "@/db/schema";
import { bookings, events } from "@/db/schema";
import { getDb } from "@/db/index";
import { reservationCode } from "@/lib/booking-display";
import type {
  AdminBookingRow,
  AdminBookingsPageData,
  AdminPaymentStatus,
} from "@/lib/admin-bookings-types";

function guestInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getStripeDashboardBase(): string {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live")
    ? "https://dashboard.stripe.com/"
    : "https://dashboard.stripe.com/test/";
}

function resolveBookingStatus(
  paymentStatus: AdminPaymentStatus,
  eventStartsAt: Date,
): AdminBookingRow["bookingStatus"] {
  const now = Date.now();
  if (paymentStatus === "pending") return "pending";
  if (paymentStatus === "failed") return "failed";
  if (paymentStatus === "refunded") return "refunded";
  return eventStartsAt.getTime() > now ? "confirmed" : "completed";
}

function guestInsightLabel(row: {
  paymentStatus: AdminPaymentStatus;
  isReturningGuest: boolean;
  isGroup: boolean;
  isSolo: boolean;
}): string | null {
  if (row.paymentStatus !== "paid") return null;
  if (row.isReturningGuest) return "Terugkerende gast";
  if (row.isGroup) return "Geboekt als groep";
  if (row.isSolo) return "Komt alleen";
  return "Eerste keer";
}

export async function getAdminBookingsPageData(): Promise<AdminBookingsPageData> {
  const db = getDb();
  const rows = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .orderBy(desc(bookings.createdAt))
    .limit(500);

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const tomorrowStart = new Date(now);
  tomorrowStart.setHours(0, 0, 0, 0);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const paidByEmail = new Map<string, number>();
  for (const { booking } of rows) {
    if (booking.paymentStatus !== "paid") continue;
    paidByEmail.set(booking.email, (paidByEmail.get(booking.email) ?? 0) + 1);
  }

  const upcomingEvents = new Map<string, Event>();
  for (const { event } of rows) {
    if (
      event.workflowStatus === "published" &&
      event.startsAt.getTime() > now.getTime()
    ) {
      upcomingEvents.set(event.id, event);
    }
  }

  let upcomingGuests = 0;
  let revenueThisWeekCents = 0;
  let pendingPayments = 0;
  let guestsArrivingTomorrow = 0;

  const enriched: AdminBookingRow[] = rows.map(({ booking, event }) => {
    const previousPaidCount = Math.max(
      0,
      (paidByEmail.get(booking.email) ?? 0) -
        (booking.paymentStatus === "paid" ? 1 : 0),
    );
    const isReturningGuest = previousPaidCount > 0;
    const isGroup = booking.seats > 1;
    const isSolo = booking.seats === 1;

    if (booking.paymentStatus === "pending") pendingPayments += 1;
    if (
      booking.paymentStatus === "paid" &&
      booking.createdAt >= weekAgo
    ) {
      revenueThisWeekCents += booking.amountCents;
    }
    if (
      booking.paymentStatus === "paid" &&
      event.startsAt >= tomorrowStart &&
      event.startsAt < tomorrowEnd
    ) {
      guestsArrivingTomorrow += booking.seats;
    }
    if (
      booking.paymentStatus === "paid" &&
      event.startsAt.getTime() > now.getTime()
    ) {
      upcomingGuests += booking.seats;
    }

    return {
      id: booking.id,
      reservationCode: reservationCode(booking.id),
      email: booking.email,
      customerName: booking.customerName,
      seats: booking.seats,
      amountCents: booking.amountCents,
      currency: booking.currency,
      paymentStatus: booking.paymentStatus,
      locale: booking.locale,
      dietaryNotes: booking.dietaryNotes,
      adminNotes: booking.adminNotes,
      createdAt: booking.createdAt.toISOString(),
      stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
      stripePaymentIntentId: booking.stripePaymentIntentId,
      event: {
        id: event.id,
        nameNl: event.nameNl,
        nameEn: event.nameEn,
        slug: event.slug,
        city: event.city,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
        capacity: event.capacity,
        spotsSold: event.spotsSold,
        femaleOnly: event.femaleOnly,
        experienceType: event.experienceType,
        imageUrl: event.imageUrl,
        workflowStatus: event.workflowStatus,
      },
      guestInitials: guestInitials(booking.customerName, booking.email),
      isReturningGuest,
      previousPaidCount,
      isGroup,
      isSolo,
      bookingStatus: resolveBookingStatus(
        booking.paymentStatus,
        event.startsAt,
      ),
      guestInsight: guestInsightLabel({
        paymentStatus: booking.paymentStatus,
        isReturningGuest,
        isGroup,
        isSolo,
      }),
    };
  });

  const upcomingList = [...upcomingEvents.values()];
  const upcomingTables = upcomingList.length;
  let totalCapacity = 0;
  let totalSold = 0;
  let fillSum = 0;

  for (const event of upcomingList) {
    totalCapacity += event.capacity;
    totalSold += event.spotsSold;
    if (event.capacity > 0) {
      fillSum += (event.spotsSold / event.capacity) * 100;
    }
  }

  const occupancyRatePct =
    totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;
  const avgTableFillPct =
    upcomingList.length > 0 ? Math.round(fillSum / upcomingList.length) : 0;

  const uniquePaidEmails = [...paidByEmail.keys()];
  const returningEmails = uniquePaidEmails.filter(
    (email) => (paidByEmail.get(email) ?? 0) > 1,
  );
  const returningGuestsPct =
    uniquePaidEmails.length > 0
      ? Math.round((returningEmails.length / uniquePaidEmails.length) * 100)
      : 0;

  const cities = [...new Set(rows.map(({ event }) => event.city))].sort();
  const experienceTypes = [
    ...new Set(rows.map(({ event }) => event.experienceType)),
  ].sort();

  return {
    bookings: enriched,
    kpis: {
      upcomingGuests,
      revenueThisWeekCents,
      occupancyRatePct,
      upcomingTables,
      pendingPayments,
      avgTableFillPct,
      returningGuestsPct,
      guestsArrivingTomorrow,
    },
    cities,
    experienceTypes,
    stripeDashboardBase: getStripeDashboardBase(),
  };
}
