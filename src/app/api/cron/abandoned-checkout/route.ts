import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { isEmailConfigured } from "@/lib/email/resend";
import { sendAbandonedCheckoutMails } from "@/lib/email/send-abandoned-checkout-mails";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbConfigured() || !isEmailConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const results = await sendAbandonedCheckoutMails();
  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  if (results.length > 0) {
    console.info(`[cron] abandoned checkout mails: ${sent} sent, ${failed} failed`);
  }
  return NextResponse.json({ processed: results.length, sent, failed });
}
