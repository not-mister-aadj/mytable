import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { planInvites } from "@/lib/invites/engine";

/** Daily at 06:00 Amsterdam: plans each person's next invite for the coming week. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const plan = await planInvites().catch((error: unknown) => {
    console.error("[cron] invites plan failed", error);
    return { planned: 0, expired: 0 };
  });
  return NextResponse.json({ planned: plan.planned, expired: plan.expired });
}
