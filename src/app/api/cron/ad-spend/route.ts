import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { importAdSpend, isAdSpendImportConfigured } from "@/lib/admin/ad-spend-import";

/** Daily (vercel.json): what each Meta campaign spent per day, for the Board. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  if (!isAdSpendImportConfigured()) return NextResponse.json({ skipped: "no Meta ads token" });

  try {
    const result = await importAdSpend();
    console.info("[cron] ad-spend", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] ad-spend failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 502 });
  }
}
