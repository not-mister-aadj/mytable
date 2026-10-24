import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { alertOnEmailVolume } from "@/lib/email/volume";

/** Hourly (vercel.json): mails info@ once when a day reaches 80 mails (Resend's free plan stops at 100). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const alerted = await alertOnEmailVolume();
  return NextResponse.json({ alerted });
}
