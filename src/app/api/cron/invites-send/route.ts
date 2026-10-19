import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { isEmailConfigured } from "@/lib/email/resend";
import { sendDueInvites } from "@/lib/invites/engine";

/** Every minute: sends the invites that are due, one mail at a time.
 * ?dryRun=1 shows what would go out now without sending or claiming. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured() || !isEmailConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const send = await sendDueInvites(new Date(), { dryRun }).catch((error: unknown) => {
    console.error("[cron] invites send failed", error);
    return { sent: 0, skipped: 0, failed: 0, details: [] };
  });
  return NextResponse.json({ dryRun, ...send });
}
