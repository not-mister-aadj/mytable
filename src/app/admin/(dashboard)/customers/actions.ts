"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customers } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { onNoteAdded } from "@/lib/customers/hooks";
import { setCustomerFrozen } from "@/lib/customers/freeze";
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

/** Puts an account on hold ("op slot"), or releases it. On hold, the
 * customer books nothing (tickets, member seats, a membership, moving a
 * booking) until it is released here. */
export async function setCustomerFrozenAction(
  customerId: string,
  on: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await requireAdmin();
  if (!isDbConfigured()) {
    return { ok: false, error: "Database niet geconfigureerd" };
  }
  try {
    await setCustomerFrozen({
      customerId,
      on,
      reason: on ? `Op slot gezet door ${user.email ?? "admin"}` : `Vrijgegeven door ${user.email ?? "admin"}`,
    });
  } catch (error) {
    console.error("[customers] freeze failed", error);
    return { ok: false, error: "Dat lukte niet. Probeer het opnieuw." };
  }
  revalidatePath(adminPath(`/customers/${customerId}`));
  revalidatePath(adminPath("/customers"));
  return { ok: true };
}
