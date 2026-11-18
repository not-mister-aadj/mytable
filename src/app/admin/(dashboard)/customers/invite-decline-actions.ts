"use server";

import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-url";
import { declineEvent, undeclineEvent } from "@/lib/invites/declines";

/** "Kan niet" for one Sunday, set or taken back by us. */
export async function setInviteDeclineAction(
  customerId: string,
  email: string,
  eventId: string,
  on: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isDbConfigured()) return { ok: false, error: "Database niet geconfigureerd" };
  if (on) await declineEvent({ email, eventId, source: "admin" });
  else await undeclineEvent(email, eventId);
  revalidatePath(adminPath(`/customers/${customerId}`));
  return { ok: true };
}
