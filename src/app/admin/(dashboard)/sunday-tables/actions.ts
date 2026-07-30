"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { upsertSundayTableLocation } from "@/lib/sunday-table-locations";
import {
  encodeSundayTableSlug,
  type SundayTableType,
} from "@/lib/sunday-table-shared";

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
