import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getAllVenues } from "@/lib/venues";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const venues = await getAllVenues();
    return NextResponse.json({ venues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Laden mislukt";
    return NextResponse.json({ error: message, venues: [] }, { status: 500 });
  }
}
