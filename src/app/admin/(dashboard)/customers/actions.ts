"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customers } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { onNoteAdded } from "@/lib/customers/hooks";
import { adminPath } from "@/lib/admin-url";
import { captureServerEvent } from "@/lib/posthog/server";
import { PostHogEvents } from "@/lib/posthog/events";

export async function updateCustomerNotesAction(
  customerId: string,
  notes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isDbConfigured()) {
    return { ok: false, error: "Database niet geconfigureerd" };
  }

  const trimmed = notes.trim();
  const db = getDb();

  await db
    .update(customers)
    .set({ notes: trimmed || null, updatedAt: new Date() })
    .where(eq(customers.id, customerId));

  await onNoteAdded({
    customerId,
    notePreview: trimmed || "(leeg)",
  });

  void captureServerEvent(customerId, PostHogEvents.customerNoteAdded, {
    note_length: trimmed.length,
  });

  revalidatePath(adminPath(`/customers/${customerId}`));
  revalidatePath(adminPath("/customers"));

  return { ok: true };
}
