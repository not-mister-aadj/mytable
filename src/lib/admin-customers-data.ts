import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import type { Attribution } from "@/lib/analytics/attribution";
import {
  bookings,
  customerActivities,
  customers,
  events,
  waitlistSignups,
} from "@/db/schema";
import { getDb } from "@/db/index";
import { resolveOperationalBookingStatus } from "@/lib/booking-lifecycle";
import {
  customerDisplayName,
  normalizeEmail,
} from "@/lib/customers/normalize";
import {
  customerStatusLabel,
  resolveCustomerStatus,
} from "@/lib/customers/status";
import { reconcileAllCustomers } from "@/lib/customers/reconcile";
import {
  pickCustomerWaitlistAnswers,
  type CustomerWaitlistAnswers,
} from "@/lib/customers/list-answers";
import { syncPendingCheckoutsIfStale } from "@/lib/stripe/sync-pending-checkouts";
import type { CustomerStatusKey } from "@/lib/customers/types";
import { personConcepts, type SignupConcept } from "@/lib/signup-concept";

export type AdminCustomerListRow = {
  id: string;
  email: string;
  displayName: string;
  firstName: string | null;
  /** Favourite city from bookings, else the preferred or waitlist city. */
  city: string | null;
  favoriteCity: string | null;
  favoriteEventType: string | null;
  totalBookings: number;
  paidBookingsCount: number;
  totalSeatsBooked: number;
  totalSpentCents: number;
  failedPaymentsCount: number;
  waitlistCount: number;
  lastBookingAt: string | null;
  /** first_seen_at, falling back to created_at. */
  memberSince: string;
  firstBookingAt: string | null;
  /** Same rule as the KPI cards: at least one paid booking with revenue. */
  isBuyer: boolean;
  tags: string[];
  status: CustomerStatusKey;
  statusLabel: string;
  /** A/B concept of their sign-up (first touch), null without one. */
  signupConcept: SignupConcept | null;
  /** Has an account (also a waitlist person who later did the quiz). */
  hasAccount: boolean;
} & CustomerWaitlistAnswers;

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
  /** Where they came from (customer row, else their first waitlist signup). */
  attribution: Attribution | null;
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

function mapCustomerRow(
  row: typeof customers.$inferSelect,
  answers: CustomerWaitlistAnswers & { waitlistCity: string | null },
): Omit<AdminCustomerListRow, "signupConcept" | "hasAccount"> {
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
    city: row.favoriteCity ?? row.preferredCity ?? answers.waitlistCity,
    favoriteCity: row.favoriteCity,
    favoriteEventType: row.favoriteEventType,
    totalBookings: row.totalBookings,
    paidBookingsCount: row.paidBookingsCount,
    totalSeatsBooked: row.totalSeatsBooked,
    totalSpentCents: row.totalSpentCents,
    failedPaymentsCount: row.failedPaymentsCount,
    waitlistCount: row.waitlistCount,
    lastBookingAt: row.lastBookingAt?.toISOString() ?? null,
    memberSince: (row.firstSeenAt ?? row.createdAt).toISOString(),
    firstBookingAt: row.firstBookingAt?.toISOString() ?? null,
    isBuyer: row.paidBookingsCount > 0 && row.totalSpentCents > 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
    ageRange: answers.ageRange,
    gender: answers.gender,
    waitlistLanguage: answers.waitlistLanguage,
    ticketBudget: answers.ticketBudget,
    status,
    statusLabel: customerStatusLabel(status),
  };
}

export async function getAdminCustomersPageData(): Promise<AdminCustomersPageData> {
  await syncPendingCheckoutsIfStale();
  await reconcileAllCustomers();

  const db = getDb();
  const rows = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.lastSeenAt));

  const signupRows = await db
    .select({
      customerId: waitlistSignups.customerId,
      email: waitlistSignups.email,
      city: waitlistSignups.city,
      preferences: waitlistSignups.preferences,
      source: waitlistSignups.source,
      createdAt: waitlistSignups.createdAt,
    })
    .from(waitlistSignups)
    .orderBy(desc(waitlistSignups.createdAt));

  // Newest first, so the first match per customer is the latest answer.
  const signupsByCustomer = new Map<string, typeof signupRows>();
  const signupsByEmail = new Map<string, typeof signupRows>();
  for (const signup of signupRows) {
    if (signup.customerId) {
      const list = signupsByCustomer.get(signup.customerId) ?? [];
      list.push(signup);
      signupsByCustomer.set(signup.customerId, list);
    }
    const key = normalizeEmail(signup.email);
    const list = signupsByEmail.get(key) ?? [];
    list.push(signup);
    signupsByEmail.set(key, list);
  }

  const allCustomers = rows.map((row) => {
    const signups =
      signupsByCustomer.get(row.id) ??
      signupsByEmail.get(row.emailNormalized) ??
      [];
    const concept = [...personConcepts(signups.map((s) => ({ ...s, email: row.emailNormalized }))).values()][0];
    return {
      ...mapCustomerRow(row, {
        ...pickCustomerWaitlistAnswers(signups.map((s) => s.preferences)),
        waitlistCity: signups[0]?.city ?? null,
      }),
      signupConcept: concept?.concept ?? null,
      hasAccount: concept?.hasAccount ?? false,
    };
  });

  // KPI cards keep counting buyers only, as before.
  const customersList = allCustomers.filter((c) => c.isBuyer);

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
      allCustomers
        .map((c) => c.city)
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort();

  const eventTypes = [
    ...new Set(
      allCustomers
        .map((c) => c.favoriteEventType)
        .filter((t): t is string => Boolean(t)),
    ),
  ].sort();

  return {
    customers: allCustomers,
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

  const attribution =
    row.attribution ??
    (
      await db
        .select({ attribution: waitlistSignups.attribution })
        .from(waitlistSignups)
        .where(and(eq(waitlistSignups.email, row.emailNormalized), isNotNull(waitlistSignups.attribution)))
        .orderBy(asc(waitlistSignups.createdAt))
        .limit(1)
    )[0]?.attribution ??
    null;

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
    attribution,
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
