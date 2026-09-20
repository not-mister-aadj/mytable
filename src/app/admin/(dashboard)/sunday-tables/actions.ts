"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { upsertSundayTableLocation } from "@/lib/sunday-table-locations";
import {
  encodeSundayTableSlug,
  type SundayTableType,
} from "@/lib/sunday-table-shared";
import { sendSundayTableWaitlistInvites } from "@/lib/email/sendSundayTableWaitlistInviteEmails";
import { SIGNUPS_PAUSED } from "@/app/admin/(dashboard)/sunday-tables/signups-paused";
import { openTicketSalesForSundayTable } from "@/lib/sunday-table-ticket-event";

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

export type OpenTicketSalesActionState = {
  error: string | null;
  opened: boolean;
  sent: number;
  failed: number;
};

/** Clears the comingSoon flag on this cohort's ticketed event (once the
 * venue above is saved) and mails everyone on that event's own "notify me"
 * mini list that tickets are open. */
export async function openTicketSalesAction(
  _prev: OpenTicketSalesActionState | null,
  formData: FormData,
): Promise<OpenTicketSalesActionState> {
  await requireAdmin();

  const city = String(formData.get("city") ?? "").trim();
  const tableDate = String(formData.get("tableDate") ?? "").trim();
  const tableType = String(formData.get("tableType") ?? "").trim();
  const venueName = String(formData.get("venueName") ?? "").trim();

  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(tableDate)) {
    return { error: "Ongeldige tafel.", opened: false, sent: 0, failed: 0 };
  }
  if (tableType !== "girls_only" && tableType !== "mixed") {
    return { error: "Ongeldig tafeltype.", opened: false, sent: 0, failed: 0 };
  }
  if (!venueName) {
    return {
      error: "Sla eerst de echte locatie hierboven op.",
      opened: false,
      sent: 0,
      failed: 0,
    };
  }

  try {
    const result = await openTicketSalesForSundayTable(
      { city, tableDate, tableType },
      venueName,
    );
    if (!result.ok) {
      return {
        error:
          result.error === "not_found"
            ? "Geen ticketevent gevonden voor deze tafel."
            : "Deze tafel staat niet meer op binnenkort.",
        opened: false,
        sent: 0,
        failed: 0,
      };
    }

    const slug = encodeSundayTableSlug({
      city,
      tableDate,
      tableType: tableType as SundayTableType,
    });
    revalidatePath(`/admin/sunday-tables/${slug}`);

    return { error: null, opened: true, sent: result.sent, failed: result.failed };
  } catch (error) {
    console.error("[sunday-tables] open ticket sales failed", error);
    return {
      error: "Openen mislukt. Probeer het opnieuw.",
      opened: false,
      sent: 0,
      failed: 0,
    };
  }
}
