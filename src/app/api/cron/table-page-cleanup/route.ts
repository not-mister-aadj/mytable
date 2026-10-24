import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { clearPlusOneAnswersAfterSunday } from "@/lib/table-page";

/**
 * Daily (vercel.json): what bookers told about their +1 was only for the
 * table page, so it is wiped once that page has closed.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const cleared = await clearPlusOneAnswersAfterSunday();
  if (cleared > 0) console.info("[cron] table-page-cleanup", { cleared });
  return NextResponse.json({ cleared });
}
