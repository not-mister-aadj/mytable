import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { sendAbandonedWaitlistWelcomeEmails } from "@/lib/email/send-abandoned-waitlist-welcome-emails";
import { sendAccountWelcomeEmails } from "@/lib/email/send-account-welcome-emails";
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

  const results = await sendAbandonedWaitlistWelcomeEmails();
  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;

  if (results.length > 0) {
    console.info(
      `[cron] abandoned waitlist welcome emails: ${sent} sent, ${failed} failed`,
    );
  }

  // "Jouw tafel" accounts get their own welcome (not the waitlist one).
  const accounts = await sendAccountWelcomeEmails().catch((error: unknown) => {
    console.error("[cron] account welcome emails failed", error);
    return [];
  });
  if (accounts.length > 0) {
    console.info(`[cron] account welcome emails: ${accounts.filter((r) => r.ok).length} ok of ${accounts.length}`);
  }

  return NextResponse.json({
    processed: results.length,
    sent,
    failed,
    accountWelcome: {
      sent: accounts.filter((r) => r.ok && r.variant !== "skipped").length,
      skipped: accounts.filter((r) => r.variant === "skipped").length,
      failed: accounts.filter((r) => !r.ok).length,
    },
  });
}
