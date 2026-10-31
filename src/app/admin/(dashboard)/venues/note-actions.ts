"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { venueNotes } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";

const UUID_RE = /^[0-9a-f-]{36}$/i;

function refresh(venueId: string | null, eventId: string | null) {
  if (venueId) revalidatePath(`/admin/venues/${venueId}`);
  if (eventId) revalidatePath(`/admin/events/${eventId}/guests`);
  revalidatePath("/admin");
}

/** A note on what was agreed with a bar; `venueId` comes from the form when a Sunday has more than one. */
export async function addVenueNoteAction(eventId: string | null, venueId: string | null, formData: FormData): Promise<void> {
  await requireAdmin();
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const picked = String(formData.get("venueId") ?? "");
  const venue = UUID_RE.test(picked) ? picked : venueId;
  if (!body || (!venue && !eventId)) return;
  await getDb().insert(venueNotes).values({ body, venueId: venue, eventId });
  refresh(venue, eventId);
}

export async function deleteVenueNoteAction(id: string): Promise<void> {
  await requireAdmin();
  const [row] = await getDb().delete(venueNotes).where(eq(venueNotes.id, id)).returning();
  if (row) refresh(row.venueId, row.eventId);
}
