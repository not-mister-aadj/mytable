import { asc, eq, inArray } from "drizzle-orm";
import { bookingEvents, bookings, events } from "@/db/schema";
import { getDb } from "@/db/index";
import type { AdminBookingTimelineEntry } from "@/lib/admin-bookings-types";

type TimelinePayload = Record<string, unknown>;

function formatTimelineDate(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

async function eventLabel(eventId: string | undefined): Promise<string | null> {
  if (!eventId) return null;
  const db = getDb();
  const [event] = await db
    .select({ nameNl: events.nameNl, city: events.city })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  return event ? `${event.nameNl} · ${event.city}` : null;
}

export async function getBookingTimelineEntries(
  bookingIds: string[],
): Promise<Map<string, AdminBookingTimelineEntry[]>> {
  if (bookingIds.length === 0) return new Map();

  const db = getDb();
  const rows = await db
    .select()
    .from(bookingEvents)
    .where(inArray(bookingEvents.bookingId, bookingIds))
    .orderBy(asc(bookingEvents.createdAt));

  const eventIds = new Set<string>();
  for (const row of rows) {
    const payload = (row.payload ?? {}) as TimelinePayload;
    if (typeof payload.fromEventId === "string") eventIds.add(payload.fromEventId);
    if (typeof payload.toEventId === "string") eventIds.add(payload.toEventId);
    if (typeof payload.eventId === "string") eventIds.add(payload.eventId);
  }

  const eventRows =
    eventIds.size > 0
      ? await db
          .select({ id: events.id, nameNl: events.nameNl, city: events.city })
          .from(events)
          .where(inArray(events.id, [...eventIds]))
      : [];

  const eventNames = new Map(
    eventRows.map((event) => [event.id, `${event.nameNl} · ${event.city}`]),
  );

  const byBooking = new Map<string, AdminBookingTimelineEntry[]>();

  for (const row of rows) {
    const payload = (row.payload ?? {}) as TimelinePayload;
    const at = formatTimelineDate(row.createdAt.toISOString());
    const by =
      typeof payload.by === "string" ? payload.by : undefined;

    let label = row.type;
    let tone: AdminBookingTimelineEntry["tone"] = "neutral";

    switch (row.type) {
      case "payment_succeeded":
        label = "Betaling voltooid";
        tone = "success";
        break;
      case "transferred":
        label = `Verplaatst naar ${eventNames.get(String(payload.toEventId)) ?? "andere tafel"}`;
        tone = "warning";
        break;
      case "transferred_in":
        label = `Overgeboekt van ${eventNames.get(String(payload.fromEventId)) ?? "andere tafel"}`;
        tone = "warning";
        break;
      case "removed_by_admin":
        label = "Verwijderd door admin";
        tone = "danger";
        break;
      default:
        label = row.type;
    }

    const entry: AdminBookingTimelineEntry = {
      id: row.id,
      label,
      at,
      by,
      tone,
    };

    const list = byBooking.get(row.bookingId) ?? [];
    list.push(entry);
    byBooking.set(row.bookingId, list);
  }

  return byBooking;
}

export async function appendCreatedTimelineEntries(
  bookingIds: string[],
  createdAtById: Map<string, string>,
): Promise<Map<string, AdminBookingTimelineEntry[]>> {
  const timeline = await getBookingTimelineEntries(bookingIds);

  for (const bookingId of bookingIds) {
    const createdAt = createdAtById.get(bookingId);
    if (!createdAt) continue;

    const entries = timeline.get(bookingId) ?? [];
    entries.unshift({
      id: `${bookingId}-created`,
      label: "Boeking aangemaakt",
      at: formatTimelineDate(createdAt),
      tone: "neutral",
    });
    timeline.set(bookingId, entries);
  }

  return timeline;
}

/** Resolve stripe/payment info from original booking when transferred. */
export async function resolvePaymentBookingId(
  bookingId: string,
): Promise<string> {
  const db = getDb();
  const [booking] = await db
    .select({
      id: bookings.id,
      transferredFromBookingId: bookings.transferredFromBookingId,
      stripeCheckoutSessionId: bookings.stripeCheckoutSessionId,
      stripePaymentIntentId: bookings.stripePaymentIntentId,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return bookingId;

  if (
    !booking.stripeCheckoutSessionId &&
    !booking.stripePaymentIntentId &&
    booking.transferredFromBookingId
  ) {
    return booking.transferredFromBookingId;
  }

  return bookingId;
}

export { formatTimelineDate, eventLabel };
