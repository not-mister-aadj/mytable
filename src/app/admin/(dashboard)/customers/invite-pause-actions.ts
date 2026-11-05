"use server";

import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-url";
import { setInvitePause } from "@/lib/invites/pause";

/** Pauses invites about Sundays before `until` (YYYY-MM-DD); null lifts the pause. */
export async function setInvitePauseAction(
  customerId: string,
  email: string,
  until: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Database niet geconfigureerd" };
  if (until !== null && !/^\d{4}-\d{2}-\d{2}$/.test(until)) return { ok: false, error: "Geen geldige datum" };
  await setInvitePause(email, until);
  revalidatePath(adminPath(`/customers/${customerId}`));
  return { ok: true };
}
