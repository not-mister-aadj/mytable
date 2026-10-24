"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { bookingFeedback } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";

/** Marks a quote as used on the site or social media (or not anymore). */
export async function setFeedbackUsedAction(eventId: string, feedbackId: string, used: boolean): Promise<void> {
  await requireAdmin();
  await getDb()
    .update(bookingFeedback)
    .set({ usedAt: used ? new Date() : null, updatedAt: new Date() })
    .where(eq(bookingFeedback.id, feedbackId));
  revalidatePath(`/admin/events/${eventId}/guests`);
}
