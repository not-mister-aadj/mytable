import { and, desc, eq, gt } from "drizzle-orm";
import { bookings, events } from "@/db/schema";
import { getDb } from "@/db/index";
import { reservationCode } from "@/lib/booking-display";
import {
  paidSeatsByEventIds,
  reconcileEventSpotsSold,
} from "@/lib/reconcile-spots-sold";
import type {
  AdminBookingRow,
  AdminBookingsPageData,
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

function guestInsightLabel(row: {
  isReturningGuest: boolean;
  isGroup: boolean;
  isSolo: boolean;
}): string | null {
  if (row.isReturningGuest) return "Terugkerende gast";
  if (row.isGroup) return "Geboekt als groep";
  if (row.isSolo) return "Komt alleen";
  return "Eerste keer";
}

export async function getAdminBookingsPageData(): Promise<AdminBookingsPageData> {
  const db = getDb();
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const tomorrowStart = new Date(now);
  tomorrowStart.setHours(0, 0, 0, 0);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const upcomingPublished = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.workflowStatus, "published"),
        gt(events.startsAt, now),
      ),
    );

  await reconcileEventSpotsSold(upcomingPublished.map((e) => e.id));

  const rows = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.paymentStatus, "paid"))
    .orderBy(desc(bookings.createdAt))
    .limit(500);

  const eventIds = [...new Set(rows.map(({ event }) => event.id))];
  const paidSeatsMap = await paidSeatsByEventIds(eventIds);

  const paidByEmail = new Map<string, number>();
  for (const { booking } of rows) {
    paidByEmail.set(booking.email, (paidByEmail.get(booking.email) ?? 0) + 1);
  }

  let upcomingGuests = 0;
  let revenueThisWeekCents = 0;
  let guestsArrivingTomorrow = 0;

  const enriched: AdminBookingRow[] = rows.map(({ booking, event }) => {
    const previousPaidCount = Math.max(
      0,
      (paidByEmail.get(booking.email) ?? 0) - 1,
    );
    const isReturningGuest = previousPaidCount > 0;
    const isGroup = booking.seats > 1;
    const isSolo = booking.seats === 1;
    const confirmedSeats = paidSeatsMap.get(event.id) ?? booking.seats;

    if (booking.createdAt >= weekAgo) {
      revenueThisWeekCents += booking.amountCents;
    }
    if (
      event.startsAt >= tomorrowStart &&
      event.startsAt < tomorrowEnd
    ) {
      guestsArrivingTomorrow += booking.seats;
    }
    if (event.startsAt.getTime() > now.getTime()) {
      upcomingGuests += booking.seats;
    }

    const bookingStatus =
      event.startsAt.getTime() > now.getTime() ? "confirmed" : "completed";

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
        spotsSold: confirmedSeats,
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
      bookingStatus,
      guestInsight: guestInsightLabel({ isReturningGuest, isGroup, isSolo }),
    };
  });

  const upcomingPaidSeats = new Map<string, number>();
  for (const row of enriched) {
    if (new Date(row.event.startsAt).getTime() <= now.getTime()) continue;
    upcomingPaidSeats.set(
      row.event.id,
      (upcomingPaidSeats.get(row.event.id) ?? 0) + row.seats,
    );
  }

  let totalCapacity = 0;
  let totalSold = 0;
  let fillSum = 0;

  for (const event of upcomingPublished) {
    const sold = upcomingPaidSeats.get(event.id) ?? 0;
    totalCapacity += event.capacity;
    totalSold += sold;
    if (event.capacity > 0) {
      fillSum += (sold / event.capacity) * 100;
    }
  }

  const occupancyRatePct =
    totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;
  const avgTableFillPct =
    upcomingPublished.length > 0
      ? Math.round(fillSum / upcomingPublished.length)
      : 0;

  const uniquePaidEmails = [...paidByEmail.keys()];
  const returningEmails = uniquePaidEmails.filter(
    (email) => (paidByEmail.get(email) ?? 0) > 1,
  );
  const returningGuestsPct =
    uniquePaidEmails.length > 0
      ? Math.round((returningEmails.length / uniquePaidEmails.length) * 100)
      : 0;

  const cities = [...new Set(enriched.map((b) => b.event.city))].sort();
  const experienceTypes = [
    ...new Set(enriched.map((b) => b.event.experienceType)),
  ].sort();

  return {
    bookings: enriched,
    kpis: {
      upcomingGuests,
      revenueThisWeekCents,
      occupancyRatePct,
      upcomingTables: upcomingPublished.length,
      avgTableFillPct,
      returningGuestsPct,
      guestsArrivingTomorrow,
    },
    cities,
    experienceTypes,
    stripeDashboardBase: getStripeDashboardBase(),
  };
}

export function getGuestHistory(
  bookings: AdminBookingRow[],
  email: string,
  excludeId?: string,
): AdminBookingRow[] {
  return bookings.filter(
    (b) => b.email === email && b.id !== excludeId,
  );
}
