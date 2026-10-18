"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateEventPaths } from "@/lib/revalidate-agenda";

/** Number of seats for this Sunday; never below what is already sold. */
export async function setCapacityAction(eventId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const capacity = Math.round(Number(formData.get("capacity")));
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 200) return;
  const db = getDb();
  const [event] = await db.select({ spotsSold: events.spotsSold }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return;
  const [row] = await db
    .update(events)
    .set({ capacity: Math.max(capacity, event.spotsSold), updatedAt: new Date() })
    .where(eq(events.id, eventId))
    .returning();
  if (row) revalidateEventPaths(row);
  revalidatePath(`/admin/events/${eventId}/guests`);
  revalidatePath("/admin");
}
