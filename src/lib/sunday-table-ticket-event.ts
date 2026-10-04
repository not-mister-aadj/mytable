import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { events, type Event } from "@/db/schema";
import type { SundayTableKey } from "@/lib/sunday-table-shared";
import { parseAmsterdamDateIso } from "@/lib/sunday-wine-table";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { sendEventTicketsOpenEmails } from "@/lib/email/sendEventTicketsOpenEmails";
import { applyMembersOnlyDefault } from "@/lib/membership/early-access";
import { isMembersOnly } from "@/lib/membership/logic";

/** The ticketed events row backing one Sunday Social cohort, if any. */
export async function findSundayTableTicketEvent(
  key: SundayTableKey,
): Promise<Event | null> {
  if (!isDbConfigured()) return null;
  const startsAt = parseAmsterdamDateIso(key.tableDate);
  if (!startsAt) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.experienceType, "sunday-table"),
        eq(events.city, key.city),
        eq(events.startsAt, startsAt),
        eq(events.workflowStatus, "published"),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Clears the comingSoon flag once a venue is confirmed, and mails everyone
 * on this event's own "notify me" mini list (src/lib/event-notify-signups.ts)
 * that tickets are open. Never automated, an admin decides when the venue
 * is locked in.
 */
export async function openTicketSalesForSundayTable(
  key: SundayTableKey,
  venueName: string,
): Promise<
  | { ok: true; sent: number; failed: number }
  | { ok: false; error: "not_found" | "not_coming_soon" }
> {
  const event = await findSundayTableTicketEvent(key);
  if (!event) return { ok: false, error: "not_found" };
  if (!event.extras?.comingSoon) return { ok: false, error: "not_coming_soon" };

  const db = getDb();
  const nextExtras = { ...event.extras };
  delete nextExtras.comingSoon;
  await db
    .update(events)
    .set({ extras: nextExtras })
    .where(eq(events.id, event.id));
  await applyMembersOnlyDefault(event.id);

  revalidateEventPaths(event);

  // Members book the first 48 hours. The "notify me" list hears when the
  // table opens for them (the hourly membership cron), not now.
  const [fresh] = await db
    .select({ membersOnlyUntil: events.membersOnlyUntil })
    .from(events)
    .where(eq(events.id, event.id))
    .limit(1);
  if (isMembersOnly(fresh?.membersOnlyUntil ?? null)) {
    return { ok: true, sent: 0, failed: 0 };
  }

  const { sent, failed } = await sendEventTicketsOpenEmails({
    eventId: event.id,
    city: event.city,
    venueName,
    startsAt: event.startsAt,
    dateIso: key.tableDate,
  });

  return { ok: true, sent, failed };
}

/** Admin: until when only members can book this Sunday Social (null =
 * open to everyone now). */
export async function setSundayTableMembersOnlyUntil(eventId: string, until: Date | null): Promise<void> {
  const db = getDb();
  const [row] = await db
    .update(events)
    .set({ membersOnlyUntil: until, updatedAt: new Date() })
    .where(and(eq(events.id, eventId), eq(events.experienceType, "sunday-table")))
    .returning();
  if (row) revalidateEventPaths(row);
}
