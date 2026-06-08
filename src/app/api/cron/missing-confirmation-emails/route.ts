import { NextResponse } from "next/server";
import { sendMissingBookingConfirmationEmails } from "@/lib/email/send-missing-confirmation-emails";
import { isDbConfigured } from "@/db/index";
import { isEmailConfigured } from "@/lib/email/resend";

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

  const results = await sendMissingBookingConfirmationEmails();
  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  if (results.length > 0) {
    console.info(
      `[cron] missing confirmation emails: ${sent} sent, ${failed} failed`,
    );
  }

  return NextResponse.json({
    processed: results.length,
    sent,
    failed,
    results,
  });
}
