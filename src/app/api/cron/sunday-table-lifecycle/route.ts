import { NextResponse } from "next/server";
import { runSundayTableLifecycleJobs } from "@/lib/email/sendSundayTableLifecycleEmails";
import { ensureAffiliateCode } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure a few ambassador codes exist for pilots (idempotent).
  await ensureAffiliateCode({ code: "AMS01", name: "Amsterdam ambassador" });
  await ensureAffiliateCode({ code: "RTM01", name: "Rotterdam ambassador" });
  await ensureAffiliateCode({ code: "UTR01", name: "Utrecht ambassador" });

  const result = await runSundayTableLifecycleJobs();
  return NextResponse.json({ ok: true, ...result });
}
