import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { ensureAccountsForEveryone } from "@/lib/auth/accounts-for-everyone";
import { planInvites } from "@/lib/invites/engine";

// The first run makes a few hundred accounts, one at a time.
export const maxDuration = 300;

/** Daily at 06:00 Amsterdam: makes the missing background accounts, then
 * plans each person's next invite for the coming week.
 * ?dryRun=1 shows what it would do without writing anything. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const accounts = await ensureAccountsForEveryone({ dryRun }).catch((error: unknown) => {
    console.error("[cron] background accounts failed", error);
    return { missing: 0, created: 0 };
  });
  const plan = await planInvites(new Date(), { dryRun }).catch((error: unknown) => {
    console.error("[cron] invites plan failed", error);
    return { planned: 0, expired: 0, preview: undefined };
  });
  return NextResponse.json({
    dryRun,
    accounts,
    planned: plan.planned,
    expired: plan.expired,
    ...(dryRun ? { preview: (plan.preview ?? []).map((p) => ({ kind: p.kind, at: p.scheduledFor, subject: p.subject })) } : {}),
  });
}
