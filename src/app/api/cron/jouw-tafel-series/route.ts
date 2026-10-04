import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { generateSeriesTables } from "@/lib/jouw-tafel/series-server";

/**
 * Daily (vercel.json): creates the "Jouw tafel" Sunday Tables of every
 * active series up to 8 weeks ahead, as "Binnenkort". Idempotent: a run
 * twice in a row creates nothing twice.
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

  const result = await generateSeriesTables();
  if (result.created > 0) console.info("[cron] jouw-tafel series", result);
  return NextResponse.json(result);
}
