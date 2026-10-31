import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { sendDueFeedbackMails } from "@/lib/admin/auto-feedback";

export const maxDuration = 300;

/** Hourly (vercel.json): the feedback mail from 20:00 on the day of each Sunday. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const results = await sendDueFeedbackMails();
  return NextResponse.json({ results });
}
