import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { requireAdminApi } from "@/lib/admin-auth";
import { ensureVenueColumns } from "@/lib/ensure-venue-columns";
import { getAllVenues } from "@/lib/venues";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    if (isDbConfigured()) {
      await ensureVenueColumns();
    }
    const venues = await getAllVenues();
    return NextResponse.json({ venues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Laden mislukt";
    return NextResponse.json({ error: message, venues: [] }, { status: 500 });
  }
}
