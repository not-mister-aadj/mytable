import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { generateSeriesTables } from "@/lib/jouw-tafel/series-server";

// It takes seconds; since 2 Nov 2026 it hung until the 300 s limit every night. Fail fast and log each step.
export const maxDuration = 60;

/**
 * Daily (vercel.json): creates the "Jouw tafel" Sunday Tables of every
 * active series up to 10 weeks ahead. Idempotent: a run
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

  const started = Date.now();
  const log = (step: string) => console.info(`[cron] jouw-tafel series ${((Date.now() - started) / 1000).toFixed(1)}s ${step}`);
  log("start");
  const result = await generateSeriesTables(new Date(), log);
  console.info("[cron] jouw-tafel series", result);
  return NextResponse.json(result);
}
