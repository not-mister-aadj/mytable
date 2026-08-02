import { NextResponse } from "next/server";
import { sendMembershipRenewalReminders } from "@/lib/email/sendMembershipRenewalReminders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await sendMembershipRenewalReminders();
  return NextResponse.json({ ok: true, sent });
}
