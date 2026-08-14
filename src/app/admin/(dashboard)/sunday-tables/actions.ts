"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { upsertSundayTableLocation } from "@/lib/sunday-table-locations";
import {
  encodeSundayTableSlug,
  type SundayTableType,
} from "@/lib/sunday-table-shared";
import { sendSundayTableWaitlistInvites } from "@/lib/email/sendSundayTableWaitlistInviteEmails";

export async function saveSundayTableLocationAction(formData: FormData) {
  await requireAdmin();

  const city = String(formData.get("city") ?? "").trim();
  const tableDate = String(formData.get("tableDate") ?? "").trim();
  const tableType = String(formData.get("tableType") ?? "").trim();
  const venueName = String(formData.get("venueName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(tableDate)) {
    throw new Error("Invalid table");
  }
  if (tableType !== "girls_only" && tableType !== "mixed") {
    throw new Error("Invalid table type");
  }
  if (!venueName || !address) {
    throw new Error("Venue and address required");
  }

  await upsertSundayTableLocation({
    city,
    tableDate,
    tableType: tableType as SundayTableType,
    venueName,
    address,
    notes: notes || null,
  });

  const slug = encodeSundayTableSlug({
    city,
    tableDate,
    tableType: tableType as SundayTableType,
  });
  revalidatePath(`/admin/sunday-tables/${slug}`);
  revalidatePath("/admin/sunday-tables");
}

export type InviteWaitlistActionState = {
  error: string | null;
  sent: number;
  skipped: number;
  failed: number;
};

/** Sign-ups are paused site-wide — /join was deleted and /login is now a
 * coming-soon page. Flip this back once sign-ups reopen; until then, invite
 * emails would link people to a page that no longer exists. Exported so the
 * admin UI can show a paused notice instead of a live-looking form. */
export const SIGNUPS_PAUSED = true;

export async function inviteWaitlistForSundayTableAction(
  _prev: InviteWaitlistActionState | null,
  formData: FormData,
): Promise<InviteWaitlistActionState> {
  await requireAdmin();

  if (SIGNUPS_PAUSED) {
    return {
      error:
        "Sign-ups zijn tijdelijk gepauzeerd — /join bestaat niet meer, dus uitnodigingen versturen kan nu niet.",
      sent: 0,
      skipped: 0,
      failed: 0,
    };
  }

  const city = String(formData.get("city") ?? "").trim();
  const tableDate = String(formData.get("tableDate") ?? "").trim();
  const tableType = String(formData.get("tableType") ?? "").trim();
  const limitRaw = String(formData.get("limit") ?? "").trim();
  const limit = limitRaw ? Number(limitRaw) : undefined;

  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(tableDate)) {
    return { error: "Ongeldige tafel.", sent: 0, skipped: 0, failed: 0 };
  }
  if (tableType !== "girls_only" && tableType !== "mixed") {
    return { error: "Ongeldig tafeltype.", sent: 0, skipped: 0, failed: 0 };
  }
  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    return { error: "Ongeldig aantal.", sent: 0, skipped: 0, failed: 0 };
  }

  try {
    const result = await sendSundayTableWaitlistInvites({
      key: { city, tableDate, tableType },
      limit,
    });

    const slug = encodeSundayTableSlug({
      city,
      tableDate,
      tableType: tableType as SundayTableType,
    });
    revalidatePath(`/admin/sunday-tables/${slug}`);

    return { error: null, ...result };
  } catch (error) {
    console.error("[sunday-tables] invite waitlist failed", error);
    return {
      error: "Uitnodigen mislukt. Probeer het opnieuw.",
      sent: 0,
      skipped: 0,
      failed: 0,
    };
  }
}
