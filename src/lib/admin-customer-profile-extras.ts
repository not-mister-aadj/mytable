import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  bookings,
  customerActivities,
  customers,
  events,
  waitlistSignups,
} from "@/db/schema";
import { customerDisplayName } from "@/lib/customers/normalize";
import { CustomerActivityTypes } from "@/lib/customers/types";
import {
  parseWaitlistAnswers,
  type WaitlistAnswers,
} from "@/lib/waitlist-answers";

/**
 * Extra sections for the admin customer profile: waitlist answers, sent
 * mails and who they shared an event with. Kept apart from
 * admin-customers-data.ts so the list and the profile can change separately.
 */

export type CustomerWaitlistSignup = {
  city: string;
  source: string;
  createdAt: string;
};

export type CustomerWaitlistAnswers = {
  /** Every waitlist row (one per city), oldest first. */
  signups: CustomerWaitlistSignup[];
  /** Latest non-empty questionnaire, null when never filled in. */
  answers: WaitlistAnswers | null;
  answeredAt: string | null;
};

/** Waitlist rows linked by customer id, or by email for older rows. */
export async function getCustomerWaitlistAnswers(
  customerId: string,
  email: string,
): Promise<CustomerWaitlistAnswers> {
  const db = getDb();
  const rows = await db
    .select({
      city: waitlistSignups.city,
      source: waitlistSignups.source,
      preferences: waitlistSignups.preferences,
      createdAt: waitlistSignups.createdAt,
    })
    .from(waitlistSignups)
    .where(
      or(
        eq(waitlistSignups.customerId, customerId),
        sql`lower(${waitlistSignups.email}) = ${email.trim().toLowerCase()}`,
      ),
    )
    .orderBy(asc(waitlistSignups.createdAt));

  let answers: WaitlistAnswers | null = null;
  let answeredAt: string | null = null;
  for (const row of rows) {
    const parsed = parseWaitlistAnswers(row.preferences);
    // Ordered oldest first, so the last filled-in row wins.
    if (parsed) {
      answers = parsed;
      answeredAt = row.createdAt.toISOString();
    }
  }

  return {
    signups: rows.map((row) => ({
      city: row.city,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
    })),
    answers,
    answeredAt,
  };
}

export type CustomerSentEmail = {
  id: string;
  subject: string;
  campaign: string | null;
  createdAt: string;
};

function metadataString(
  metadata: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Every email_sent activity, newest first (not capped like the timeline). */
export async function getCustomerSentEmails(
  customerId: string,
): Promise<CustomerSentEmail[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(customerActivities)
    .where(
      and(
        eq(customerActivities.customerId, customerId),
        eq(customerActivities.type, CustomerActivityTypes.emailSent),
      ),
    )
    .orderBy(desc(customerActivities.createdAt));

  return rows.map((row) => ({
    id: row.id,
    // onEmailSent stores the subject as description, with a generic title.
    subject:
      row.description?.trim() ||
      metadataString(row.metadata, ["subject"]) ||
      row.title,
    campaign: metadataString(row.metadata, [
      "campaign",
      "campaignName",
      "campaignId",
      "template",
    ]),
    createdAt: row.createdAt.toISOString(),
  }));
}

export type CustomerTablemate = {
  customerId: string | null;
  name: string;
  email: string;
  timesTogether: number;
  lastEventName: string;
  lastEventAt: string;
};

/** Same rule as src/lib/venue-visits.ts: a paid, active booking. */
const visitedBooking = and(
  eq(bookings.paymentStatus, "paid"),
  eq(bookings.lifecycleStatus, "active"),
);

/**
 * Other buyers with a paid, active booking at the same events as this
 * customer. There is no table assignment data, so "same event" is the
 * grouping. Most shared events first.
 */
export async function getCustomerTablemates(
  customerId: string,
  email: string,
): Promise<CustomerTablemate[]> {
  const db = getDb();
  const ownEmail = email.trim().toLowerCase();
  const ownEvents = await db
    .selectDistinct({ eventId: bookings.eventId })
    .from(bookings)
    .where(and(eq(bookings.customerId, customerId), visitedBooking));

  const eventIds = ownEvents.map((e) => e.eventId);
  if (eventIds.length === 0) return [];

  const rows = await db
    .select({
      eventId: events.id,
      eventName: events.nameNl,
      startsAt: events.startsAt,
      customerId: bookings.customerId,
      bookingEmail: bookings.email,
      bookingName: bookings.customerName,
      firstName: customers.firstName,
      lastName: customers.lastName,
      customerEmail: customers.email,
    })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .leftJoin(customers, eq(customers.id, bookings.customerId))
    .where(
      and(
        inArray(bookings.eventId, eventIds),
        visitedBooking,
        or(sql`${bookings.customerId} is null`, ne(bookings.customerId, customerId)),
        sql`lower(${bookings.email}) <> ${ownEmail}`,
      ),
    )
    .orderBy(asc(events.startsAt));

  const byBuyer = new Map<
    string,
    CustomerTablemate & { eventIds: Set<string> }
  >();
  for (const row of rows) {
    const key =
      row.customerId ?? `email:${row.bookingEmail.trim().toLowerCase()}`;
    let mate = byBuyer.get(key);
    if (!mate) {
      const mateEmail = row.customerEmail ?? row.bookingEmail;
      const bookingName = row.bookingName?.trim();
      mate = {
        customerId: row.customerId,
        name:
          row.firstName || row.lastName
            ? customerDisplayName(row.firstName, row.lastName, mateEmail)
            : bookingName || customerDisplayName(null, null, mateEmail),
        email: mateEmail,
        timesTogether: 0,
        lastEventName: row.eventName,
        lastEventAt: row.startsAt.toISOString(),
        eventIds: new Set(),
      };
      byBuyer.set(key, mate);
    }
    mate.eventIds.add(row.eventId);
    // Rows are ordered by start time, so the last one seen is the latest.
    mate.lastEventName = row.eventName;
    mate.lastEventAt = row.startsAt.toISOString();
  }

  return [...byBuyer.values()]
    .map(({ eventIds: ids, ...mate }) => ({ ...mate, timesTogether: ids.size }))
    .sort(
      (a, b) =>
        b.timesTogether - a.timesTogether ||
        b.lastEventAt.localeCompare(a.lastEventAt) ||
        a.name.localeCompare(b.name, "nl"),
    );
}
