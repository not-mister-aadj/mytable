import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getDb, isDbConfigured } from "@/db/index";
import { ensureVenueColumns } from "@/lib/ensure-venue-columns";
import { getAllVenues } from "@/lib/venues";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    if (isDbConfigured()) {
      await ensureVenueColumns(getDb());
    }
    const venues = await getAllVenues();
    return NextResponse.json({ venues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Laden mislukt";
    return NextResponse.json({ error: message, venues: [] }, { status: 500 });
  }
}
