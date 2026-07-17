import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { bookings, customers, events } from "@/db/schema";
import { getDb } from "@/db/index";
import {
  formatSeatingPreference,
  isSeatingPreference,
} from "@/lib/booking-seating";
import {
  formatTableLanguagePreference,
  isTableLanguagePreference,
} from "@/lib/booking-table-language";
import { formatMoney, reservationCode } from "@/lib/booking-display";
import { tierForSeats, type BookingTier } from "@/lib/booking-tiers";
import { splitCustomerName } from "@/lib/customers/normalize";
import type {
  EventGuestExportRow,
  EventGuestsExportData,
  EventTicketsData,
} from "@/lib/event-tickets-types";

const TICKET_TYPE_LABELS: Record<BookingTier, string> = {
  solo: "Solo",
  duo: "Duo",
  group: "Groep",
};

function formatExportDateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function lifecycleLabel(
  status: "active" | "transferred" | "removed",
): string {
  if (status === "transferred") return "Verplaatst";
  if (status === "removed") return "Verwijderd";
  return "Actief";
}

export async function getEventTicketsData(
  eventId: string,
): Promise<EventTicketsData> {
  const db = getDb();

  const ticketRows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.eventId, eventId),
        eq(bookings.paymentStatus, "paid"),
        inArray(bookings.lifecycleStatus, ["active", "transferred"]),
      ),
    )
    .orderBy(desc(bookings.createdAt));

  const transferredToIds = [
    ...new Set(
      ticketRows
        .map((b) => b.transferredToEventId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const destinationEvents =
    transferredToIds.length > 0
      ? await db
          .select({
            id: events.id,
            nameNl: events.nameNl,
            city: events.city,
            startsAt: events.startsAt,
            slug: events.slug,
          })
          .from(events)
          .where(inArray(events.id, transferredToIds))
      : [];

  const destinationById = new Map(
    destinationEvents.map((event) => [event.id, event]),
  );

  const targetRows = await db
    .select({
      id: events.id,
      nameNl: events.nameNl,
      city: events.city,
      startsAt: events.startsAt,
      capacity: events.capacity,
      spotsSold: events.spotsSold,
      workflowStatus: events.workflowStatus,
    })
    .from(events)
    .where(
      and(ne(events.id, eventId), ne(events.workflowStatus, "cancelled")),
    )
    .orderBy(events.startsAt);

  return {
    tickets: ticketRows.map((b) => {
      const destination = b.transferredToEventId
        ? destinationById.get(b.transferredToEventId)
        : undefined;

      return {
        id: b.id,
        reservationCode: reservationCode(b.id),
        customerName: b.customerName,
        email: b.email,
        seats: b.seats,
        dietaryNotes: b.dietaryNotes,
        seatingPreference: b.seatingPreference,
        tableLanguagePreference: b.tableLanguagePreference,
        createdAt: b.createdAt.toISOString(),
        lifecycleStatus: b.lifecycleStatus,
        transferredAt: b.transferredAt?.toISOString() ?? null,
        transferredBy: b.transferredBy,
        transferDestination: destination
          ? {
              eventId: destination.id,
              nameNl: destination.nameNl,
              city: destination.city,
              startsAt: destination.startsAt.toISOString(),
              slug: destination.slug,
            }
          : null,
      };
    }),
    transferTargets: targetRows.map((e) => ({
      id: e.id,
      nameNl: e.nameNl,
      city: e.city,
      startsAt: e.startsAt.toISOString(),
      capacity: e.capacity,
      spotsSold: e.spotsSold,
      spotsAvailable: Math.max(0, e.capacity - e.spotsSold),
      workflowStatus: e.workflowStatus,
    })),
  };
}

export async function getEventGuestsExportData(
  eventId: string,
): Promise<EventGuestsExportData | null> {
  const db = getDb();

  const [event] = await db
    .select({
      id: events.id,
      nameNl: events.nameNl,
      city: events.city,
      slug: events.slug,
      startsAt: events.startsAt,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return null;

  const ticketRows = await db
    .select({
      id: bookings.id,
      email: bookings.email,
      customerName: bookings.customerName,
      seats: bookings.seats,
      amountCents: bookings.amountCents,
      currency: bookings.currency,
      locale: bookings.locale,
      dietaryNotes: bookings.dietaryNotes,
      seatingPreference: bookings.seatingPreference,
      tableLanguagePreference: bookings.tableLanguagePreference,
      adminNotes: bookings.adminNotes,
      lifecycleStatus: bookings.lifecycleStatus,
      transferredToEventId: bookings.transferredToEventId,
      createdAt: bookings.createdAt,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      phone: customers.phone,
    })
    .from(bookings)
    .leftJoin(customers, eq(bookings.customerId, customers.id))
    .where(
      and(
        eq(bookings.eventId, eventId),
        eq(bookings.paymentStatus, "paid"),
        inArray(bookings.lifecycleStatus, ["active", "transferred"]),
      ),
    )
    .orderBy(desc(bookings.createdAt));

  const transferredToIds = [
    ...new Set(
      ticketRows
        .map((b) => b.transferredToEventId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const destinationEvents =
    transferredToIds.length > 0
      ? await db
          .select({
            id: events.id,
            nameNl: events.nameNl,
            city: events.city,
            startsAt: events.startsAt,
          })
          .from(events)
          .where(inArray(events.id, transferredToIds))
      : [];

  const destinationById = new Map(
    destinationEvents.map((row) => [row.id, row]),
  );

  const rows: EventGuestExportRow[] = ticketRows.map((b) => {
    const fromCustomer = {
      firstName: b.customerFirstName?.trim() || null,
      lastName: b.customerLastName?.trim() || null,
    };
    const fromName = splitCustomerName(b.customerName);
    const firstName = fromCustomer.firstName || fromName.firstName || "";
    const lastName = fromCustomer.lastName || fromName.lastName || "";
    const tier = tierForSeats(b.seats);
    const seating =
      b.seatingPreference && isSeatingPreference(b.seatingPreference)
        ? formatSeatingPreference(b.seatingPreference, "nl")
        : (b.seatingPreference ?? "");
    const tableLanguage =
      b.tableLanguagePreference &&
      isTableLanguagePreference(b.tableLanguagePreference)
        ? formatTableLanguagePreference(b.tableLanguagePreference, "nl")
        : (b.tableLanguagePreference ?? "");
    const destination = b.transferredToEventId
      ? destinationById.get(b.transferredToEventId)
      : undefined;

    return {
      firstName,
      lastName,
      email: b.email,
      phone: b.phone?.trim() || "",
      dietaryNotes: b.dietaryNotes?.trim() || "",
      ticketType: TICKET_TYPE_LABELS[tier],
      seats: b.seats,
      locale: b.locale.toUpperCase(),
      tableLanguage,
      seatingPreference: seating,
      reservationCode: reservationCode(b.id),
      amount: formatMoney(
        b.amountCents,
        b.currency,
        b.locale === "en" ? "en" : "nl",
      ),
      status: lifecycleLabel(b.lifecycleStatus),
      adminNotes: b.adminNotes?.trim() || "",
      bookedAt: formatExportDateTime(b.createdAt),
      transferDestination: destination
        ? `${destination.nameNl} (${destination.city}, ${formatExportDateTime(destination.startsAt)})`
        : "",
    };
  });

  return {
    event: {
      id: event.id,
      nameNl: event.nameNl,
      city: event.city,
      slug: event.slug,
      startsAt: event.startsAt.toISOString(),
    },
    rows,
  };
}

export function guestRowsToExcelCsv(rows: EventGuestExportRow[]): string {
  const header = [
    "Voornaam",
    "Achternaam",
    "E-mail",
    "Telefoon",
    "Allergieën",
    "Tickettype",
    "Plekken",
    "Taal",
    "Tafeltaalvoorkeur",
    "Zitvoorkeur",
    "Code",
    "Bedrag",
    "Status",
    "Admin notities",
    "Geboekt op",
    "Verplaatst naar",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = [
    header.map(escape).join(";"),
    ...rows.map((row) =>
      [
        row.firstName,
        row.lastName,
        row.email,
        row.phone,
        row.dietaryNotes,
        row.ticketType,
        String(row.seats),
        row.locale,
        row.tableLanguage,
        row.seatingPreference,
        row.reservationCode,
        row.amount,
        row.status,
        row.adminNotes,
        row.bookedAt,
        row.transferDestination,
      ]
        .map(escape)
        .join(";"),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
