"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { bookings, events, jouwTafelPauses, jouwTafelSeries } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { replaceEventVenues } from "@/lib/event-venues";
import { applyMembersOnlyDefault } from "@/lib/membership/early-access";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";
import { isIsoDate, isStartTime, weekday } from "@/lib/jouw-tafel/series-logic";
import {
  generateSeriesTables,
  recordSeriesSkip,
  removeUnbookedTablesInPause,
} from "@/lib/jouw-tafel/series-server";

const ADMIN_PATH = "/admin/jouw-tafel";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function int(formData: FormData, key: string): number {
  return Number.parseInt(text(formData, key), 10);
}

/** Saves a series (new or existing) and fills in its tables right away. */
export async function saveSeriesAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const city = text(formData, "city");
  const firstDate = text(formData, "firstDate");
  const intervalWeeks = int(formData, "intervalWeeks");
  const startTime = text(formData, "startTime") || "14:00";
  const defaultCapacity = int(formData, "defaultCapacity");
  const active = formData.get("active") === "on";

  if (!city) throw new Error("Kies een stad.");
  if (!isIsoDate(firstDate) || weekday(firstDate) !== 0) throw new Error("De eerste datum moet een zondag zijn.");
  if (!(intervalWeeks >= 1 && intervalWeeks <= 12)) throw new Error("Om de 1 tot 12 weken.");
  if (!isStartTime(startTime)) throw new Error("Starttijd als 14:00.");
  if (!(defaultCapacity >= 1 && defaultCapacity <= 100)) throw new Error("Capaciteit tussen 1 en 100.");

  const values = { city, firstDate, intervalWeeks, startTime, defaultCapacity, active, updatedAt: new Date() };
  const db = getDb();
  if (id) await db.update(jouwTafelSeries).set(values).where(eq(jouwTafelSeries.id, id));
  else await db.insert(jouwTafelSeries).values(values).onConflictDoNothing();

  await generateSeriesTables();
  revalidatePath(ADMIN_PATH);
}

/** Adds a pause; tables already made in it without bookings are removed. */
export async function addPauseAction(formData: FormData) {
  await requireAdmin();
  const startsOn = text(formData, "startsOn");
  const endsOn = text(formData, "endsOn");
  const label = text(formData, "label") || null;
  if (!isIsoDate(startsOn) || !isIsoDate(endsOn) || endsOn < startsOn) {
    throw new Error("Vul een geldige begin- en einddatum in.");
  }
  await getDb().insert(jouwTafelPauses).values({ startsOn, endsOn, label });
  await removeUnbookedTablesInPause({ startsOn, endsOn });
  revalidatePath(ADMIN_PATH);
}

/** Removes a pause; its dates are filled in again where the series has them. */
export async function deletePauseAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  if (!id) return;
  await getDb().delete(jouwTafelPauses).where(eq(jouwTafelPauses.id, id));
  await generateSeriesTables();
  revalidatePath(ADMIN_PATH);
}

/** Runs the daily fill now. */
export async function generateNowAction() {
  await requireAdmin();
  await generateSeriesTables();
  revalidatePath(ADMIN_PATH);
}

/**
 * One table: its maximum capacity and its venue. Linking a venue to a table
 * that is still "Binnenkort" opens it for booking, members first (48 hours).
 */
export async function saveTableAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const capacity = int(formData, "capacity");
  const venueId = text(formData, "venueId");
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.experienceType, JOUW_TAFEL_TYPE)))
    .limit(1);
  if (!event) throw new Error("Tafel niet gevonden.");
  if (!(capacity >= 1 && capacity <= 100)) throw new Error("Capaciteit tussen 1 en 100.");
  if (capacity < event.spotsSold) throw new Error(`Er zijn al ${event.spotsSold} plekken verkocht.`);

  await replaceEventVenues(event.id, venueId ? [venueId] : []);
  const opening = Boolean(venueId) && Boolean(event.extras?.comingSoon);
  const extras = opening ? { ...(event.extras ?? {}), comingSoon: false } : event.extras;
  const [row] = await db
    .update(events)
    .set({ capacity, extras, updatedAt: new Date() })
    .where(eq(events.id, event.id))
    .returning();
  if (opening) await applyMembersOnlyDefault(event.id);
  revalidateEventPaths(row);
  revalidatePath(ADMIN_PATH);
}

/** Removes a table without bookings; a series date stays gone. */
export async function removeTableAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.experienceType, JOUW_TAFEL_TYPE)))
    .limit(1);
  if (!event) return;
  const [booked] = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.eventId, id)).limit(1);
  if (booked || event.spotsSold > 0) throw new Error("Deze tafel heeft al boekingen.");
  if (event.seriesId && event.seriesDate) await recordSeriesSkip(event.seriesId, event.seriesDate);
  await db.delete(events).where(eq(events.id, id));
  revalidateEventPaths(event);
  revalidatePath(ADMIN_PATH);
}
