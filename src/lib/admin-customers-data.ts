import { desc, eq } from "drizzle-orm";
import {
  bookings,
  customerActivities,
  customers,
  events,
} from "@/db/schema";
import { getDb } from "@/db/index";
import { resolveOperationalBookingStatus } from "@/lib/booking-lifecycle";
import {
  customerDisplayName,
} from "@/lib/customers/normalize";
import {
  customerStatusLabel,
  resolveCustomerStatus,
} from "@/lib/customers/status";
import type { CustomerStatusKey } from "@/lib/customers/types";

export type AdminCustomerListRow = {
  id: string;
  email: string;
  displayName: string;
  favoriteCity: string | null;
  favoriteEventType: string | null;
  totalBookings: number;
  paidBookingsCount: number;
  totalSeatsBooked: number;
  totalSpentCents: number;
  failedPaymentsCount: number;
  waitlistCount: number;
  lastBookingAt: string | null;
  status: CustomerStatusKey;
  statusLabel: string;
};

export type AdminCustomersKpi = {
  totalCustomers: number;
  payingCustomers: number;
  repeatCustomers: number;
  totalRevenueCents: number;
  avgSpendPerCustomerCents: number;
};

export type AdminCustomersPageData = {
  customers: AdminCustomerListRow[];
  kpis: AdminCustomersKpi;
  cities: string[];
  eventTypes: string[];
};

export type AdminCustomerBookingRow = {
  id: string;
  eventName: string;
  city: string;
  startsAt: string;
  seats: number;
  amountCents: number;
  currency: string;
  paymentStatus: string;
  bookingStatus: string;
};

export type AdminCustomerActivityRow = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
};

export type AdminCustomerProfile = {
  id: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  preferredCity: string | null;
  language: string | null;
  favoriteCity: string | null;
  favoriteEventType: string | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  firstBookingAt: string | null;
  lastBookingAt: string | null;
  totalBookings: number;
  paidBookingsCount: number;
  cancelledBookingsCount: number;
  movedBookingsCount: number;
  failedPaymentsCount: number;
  waitlistCount: number;
  totalSpentCents: number;
  totalSeatsBooked: number;
  status: CustomerStatusKey;
  statusLabel: string;
  bookings: AdminCustomerBookingRow[];
  activities: AdminCustomerActivityRow[];
};

function mapCustomerRow(row: typeof customers.$inferSelect): AdminCustomerListRow {
  const status = resolveCustomerStatus({
    paidBookingsCount: row.paidBookingsCount,
    totalBookings: row.totalBookings,
    failedPaymentsCount: row.failedPaymentsCount,
    waitlistCount: row.waitlistCount,
  });

  return {
    id: row.id,
    email: row.email,
    displayName: customerDisplayName(row.firstName, row.lastName, row.email),
    favoriteCity: row.favoriteCity,
    favoriteEventType: row.favoriteEventType,
    totalBookings: row.totalBookings,
    paidBookingsCount: row.paidBookingsCount,
    totalSeatsBooked: row.totalSeatsBooked,
    totalSpentCents: row.totalSpentCents,
    failedPaymentsCount: row.failedPaymentsCount,
    waitlistCount: row.waitlistCount,
    lastBookingAt: row.lastBookingAt?.toISOString() ?? null,
    status,
    statusLabel: customerStatusLabel(status),
  };
}

export async function getAdminCustomersPageData(): Promise<AdminCustomersPageData> {
  const db = getDb();
  const rows = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.lastSeenAt));

  const customersList = rows.map(mapCustomerRow);

  const payingCustomers = customersList.filter((c) => c.paidBookingsCount > 0).length;
  const repeatCustomers = customersList.filter((c) => c.paidBookingsCount > 1).length;
  const totalRevenueCents = customersList.reduce(
    (sum, c) => sum + c.totalSpentCents,
    0,
  );
  const avgSpendPerCustomerCents =
    payingCustomers > 0 ? Math.round(totalRevenueCents / payingCustomers) : 0;

  const cities = [
    ...new Set(
      customersList
        .map((c) => c.favoriteCity)
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort();

  const eventTypes = [
    ...new Set(
      customersList
        .map((c) => c.favoriteEventType)
        .filter((t): t is string => Boolean(t)),
    ),
  ].sort();

  return {
    customers: customersList,
    kpis: {
      totalCustomers: customersList.length,
      payingCustomers,
      repeatCustomers,
      totalRevenueCents,
      avgSpendPerCustomerCents,
    },
    cities,
    eventTypes,
  };
}

export async function getAdminCustomerProfile(
  customerId: string,
): Promise<AdminCustomerProfile | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!row) return null;

  const now = new Date();
  const bookingRows = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .where(eq(bookings.customerId, customerId))
    .orderBy(desc(bookings.createdAt));

  const activityRows = await db
    .select()
    .from(customerActivities)
    .where(eq(customerActivities.customerId, customerId))
    .orderBy(desc(customerActivities.createdAt))
    .limit(100);

  const status = resolveCustomerStatus({
    paidBookingsCount: row.paidBookingsCount,
    totalBookings: row.totalBookings,
    failedPaymentsCount: row.failedPaymentsCount,
    waitlistCount: row.waitlistCount,
  });

  return {
    id: row.id,
    email: row.email,
    displayName: customerDisplayName(row.firstName, row.lastName, row.email),
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    preferredCity: row.preferredCity,
    language: row.language,
    favoriteCity: row.favoriteCity,
    favoriteEventType: row.favoriteEventType,
    tags: row.tags ?? [],
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    firstBookingAt: row.firstBookingAt?.toISOString() ?? null,
    lastBookingAt: row.lastBookingAt?.toISOString() ?? null,
    totalBookings: row.totalBookings,
    paidBookingsCount: row.paidBookingsCount,
    cancelledBookingsCount: row.cancelledBookingsCount,
    movedBookingsCount: row.movedBookingsCount,
    failedPaymentsCount: row.failedPaymentsCount,
    waitlistCount: row.waitlistCount,
    totalSpentCents: row.totalSpentCents,
    totalSeatsBooked: row.totalSeatsBooked,
    status,
    statusLabel: customerStatusLabel(status),
    bookings: bookingRows.map(({ booking, event }) => ({
      id: booking.id,
      eventName: event.nameNl,
      city: event.city,
      startsAt: event.startsAt.toISOString(),
      seats: booking.seats,
      amountCents: booking.amountCents,
      currency: booking.currency,
      paymentStatus: booking.paymentStatus,
      bookingStatus: resolveOperationalBookingStatus({
        paymentStatus: booking.paymentStatus,
        lifecycleStatus: booking.lifecycleStatus,
        eventStartsAt: event.startsAt,
        now,
      }),
    })),
    activities: activityRows.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
