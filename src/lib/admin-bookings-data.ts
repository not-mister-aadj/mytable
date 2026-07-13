import { and, desc, eq, gt, inArray, ne } from "drizzle-orm";
import { bookings, customers, events } from "@/db/schema";
import { getDb } from "@/db/index";
import { reservationCode } from "@/lib/booking-display";
import {
  isActiveAttendance,
  resolveOperationalBookingStatus,
} from "@/lib/booking-lifecycle";
import { appendCreatedTimelineEntries } from "@/lib/booking-timeline";
import {
  paidSeatsByEventIds,
  reconcileEventSpotsSold,
} from "@/lib/reconcile-spots-sold";
import { syncPendingCheckoutsIfStale } from "@/lib/stripe/sync-pending-checkouts";
import type {
  AdminBookingEvent,
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

function mapEvent(
  event: typeof events.$inferSelect,
  spotsSold: number,
): AdminBookingEvent {
  return {
    id: event.id,
    nameNl: event.nameNl,
    nameEn: event.nameEn,
    slug: event.slug,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    capacity: event.capacity,
    spotsSold,
    femaleOnly: event.femaleOnly,
    experienceType: event.experienceType,
    imageUrl: event.imageUrl,
    workflowStatus: event.workflowStatus,
  };
}

function crmBadge(input: {
  isReturningGuest: boolean;
  customerFailedPayments: number;
  paymentStatus: string;
}): import("@/lib/admin-bookings-types").AdminCrmBadge {
  if (input.customerFailedPayments > 0) return "payment_issue";
  if (input.isReturningGuest) return "repeat";
  if (input.paymentStatus === "paid") return "first_time";
  return null;
}

function crmBadgeLabel(badge: import("@/lib/admin-bookings-types").AdminCrmBadge): string | null {
  switch (badge) {
    case "payment_issue":
      return "Betalingsprobleem";
    case "repeat":
      return "Terugkerende gast";
    case "first_time":
      return "Eerste keer";
    default:
      return null;
  }
}

export async function getAdminBookingsPageData(): Promise<AdminBookingsPageData> {
  await syncPendingCheckoutsIfStale();

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
    .select({ booking: bookings, event: events, customer: customers })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .leftJoin(customers, eq(bookings.customerId, customers.id))
    .where(ne(bookings.paymentStatus, "failed"))
    .orderBy(desc(bookings.createdAt))
    .limit(500);

  const eventIds = [...new Set(rows.map(({ event }) => event.id))];
  const paidSeatsMap = await paidSeatsByEventIds(eventIds);

  const transferDestIds = [
    ...new Set(
      rows
        .map(({ booking }) => booking.transferredToEventId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const transferDestEvents =
    transferDestIds.length > 0
      ? await db
          .select()
          .from(events)
          .where(inArray(events.id, transferDestIds))
      : [];

  const transferDestById = new Map(transferDestEvents.map((e) => [e.id, e]));
  const transferDestSpots = await paidSeatsByEventIds(transferDestIds);

  const bookingIds = rows.map(({ booking }) => booking.id);
  const createdAtById = new Map(
    rows.map(({ booking }) => [booking.id, booking.createdAt.toISOString()]),
  );
  const timelineByBooking = await appendCreatedTimelineEntries(
    bookingIds,
    createdAtById,
  );

  const paidByEmail = new Map<string, number>();
  for (const { booking } of rows) {
    if (booking.paymentStatus !== "paid") continue;
    paidByEmail.set(booking.email, (paidByEmail.get(booking.email) ?? 0) + 1);
  }

  let upcomingGuests = 0;
  let revenueThisWeekCents = 0;
  let guestsArrivingTomorrow = 0;

  const enriched: AdminBookingRow[] = rows.map(({ booking, event, customer }) => {
    const previousPaidCount = Math.max(
      0,
      (paidByEmail.get(booking.email) ?? 0) - 1,
    );
    const isReturningGuest = previousPaidCount > 0;
    const isGroup = booking.seats > 1;
    const isSolo = booking.seats === 1;
    const confirmedSeats = paidSeatsMap.get(event.id) ?? 0;

    if (isActiveAttendance(booking)) {
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
    }

    const bookingStatus = resolveOperationalBookingStatus({
      paymentStatus: booking.paymentStatus,
      lifecycleStatus: booking.lifecycleStatus,
      eventStartsAt: event.startsAt,
      now,
    });

    const destEvent = booking.transferredToEventId
      ? transferDestById.get(booking.transferredToEventId)
      : undefined;

    const customerFailedPayments = customer?.failedPaymentsCount ?? 0;
    const badge = crmBadge({
      isReturningGuest,
      customerFailedPayments,
      paymentStatus: booking.paymentStatus,
    });

    return {
      id: booking.id,
      reservationCode: reservationCode(booking.id),
      email: booking.email,
      customerId: booking.customerId,
      customerFailedPayments,
      crmBadge: badge,
      customerName: booking.customerName,
      seats: booking.seats,
      amountCents: booking.amountCents,
      currency: booking.currency,
      paymentStatus: booking.paymentStatus,
      lifecycleStatus: booking.lifecycleStatus,
      locale: booking.locale,
      dietaryNotes: booking.dietaryNotes,
      seatingPreference: booking.seatingPreference,
      tableLanguagePreference: booking.tableLanguagePreference,
      adminNotes: booking.adminNotes,
      createdAt: booking.createdAt.toISOString(),
      stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
      stripePaymentIntentId: booking.stripePaymentIntentId,
      event: mapEvent(event, confirmedSeats),
      transferDestination: destEvent
        ? mapEvent(
            destEvent,
            transferDestSpots.get(destEvent.id) ?? 0,
          )
        : null,
      transferredAt: booking.transferredAt?.toISOString() ?? null,
      transferredBy: booking.transferredBy,
      guestInitials: guestInitials(booking.customerName, booking.email),
      isReturningGuest,
      previousPaidCount,
      isGroup,
      isSolo,
      bookingStatus,
      guestInsight: crmBadgeLabel(badge) ?? guestInsightLabel({ isReturningGuest, isGroup, isSolo }),
      timeline: timelineByBooking.get(booking.id) ?? [],
    };
  });

  const upcomingPaidSeats = new Map<string, number>();
  for (const row of enriched) {
    if (!isActiveAttendance(row)) continue;
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
