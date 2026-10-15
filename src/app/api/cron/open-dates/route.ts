import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { openTablesToKeepTwoPerCity } from "@/lib/jouw-tafel/auto-open";

/**
 * Hourly (vercel.json): every city keeps two Sunday Socials that can be
 * booked. When one fills up, closes or takes place, the next series table
 * opens. Idempotent.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const result = await openTablesToKeepTwoPerCity();
  if (result.opened.length > 0) console.info("[cron] open-dates", result);
  return NextResponse.json(result);
}
