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
import {
  findSundayTableTicketEvent,
  openTicketSalesForSundayTable,
  setSundayTableMembersOnlyUntil,
} from "@/lib/sunday-table-ticket-event";
import { parseEventDateTimeLocal } from "@/lib/event-datetime-local";
import { replaceEventVenues } from "@/lib/event-venues";
import { getVenueById } from "@/lib/venues";

export async function saveSundayTableLocationAction(formData: FormData) {
  await requireAdmin();

  const city = String(formData.get("city") ?? "").trim();
  const tableDate = String(formData.get("tableDate") ?? "").trim();
  const tableType = String(formData.get("tableType") ?? "").trim();
  let venueName = String(formData.get("venueName") ?? "").trim();
  let address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  // Only sent when the venue picker is shown; "" means free text ("Locatie
  // volgt"), so the ticket event is not linked to any venue.
  const pickedVenueId = formData.has("venueId")
    ? String(formData.get("venueId") ?? "").trim()
    : null;

  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(tableDate)) {
    throw new Error("Invalid table");
  }
  if (tableType !== "girls_only" && tableType !== "mixed") {
    throw new Error("Invalid table type");
  }

  if (pickedVenueId) {
    const venue = await getVenueById(pickedVenueId);
    if (!venue) throw new Error("Venue not found");
    // The form fills these from the venue but they stay editable, so a
    // longer public name like "Bar Juni Rotterdam" can be kept.
    venueName ||= venue.name;
    address ||= venue.address ?? "";
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

  if (pickedVenueId !== null) {
    const ticketEvent = await findSundayTableTicketEvent({
      city,
      tableDate,
      tableType: tableType as SundayTableType,
    });
    if (ticketEvent) {
      await replaceEventVenues(
        ticketEvent.id,
        pickedVenueId ? [pickedVenueId] : [],
      );
    }
  }

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

export type MembersOnlyActionState = { error: string | null; saved: boolean };

/** "Leden eerst": until when only members can book this table. Empty or
 * "open now" makes it bookable for everyone straight away. */
export async function setMembersOnlyUntilAction(
  _prev: MembersOnlyActionState | null,
  formData: FormData,
): Promise<MembersOnlyActionState> {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "").trim();
  const raw = String(formData.get("membersOnlyUntil") ?? "").trim();
  const openNow = formData.get("openNow") === "1";
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) return { error: "Ongeldige tafel.", saved: false };
  // "Open now" (or empty) stores the current time, not null, so the
  // automatic 48 hours never come back for this table.
  let until: Date = new Date();
  if (!openNow && raw) {
    try {
      until = parseEventDateTimeLocal(raw);
    } catch {
      return { error: "Ongeldige datum.", saved: false };
    }
  }
  try {
    await setSundayTableMembersOnlyUntil(eventId, until);
    revalidatePath("/admin/sunday-tables");
    return { error: null, saved: true };
  } catch (error) {
    console.error("[sunday-tables] members only save failed", error);
    return { error: "Opslaan mislukt.", saved: false };
  }
}
