import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { isEmailConfigured } from "@/lib/email/resend";
import { repairMissingSchedules, sendEarlyAccessOpenMails, sendRenewalReminders } from "@/lib/membership/cron";
import { isStripeConfigured } from "@/lib/stripe";

/**
 * Hourly (vercel.json): the reminder 7 days before a membership's first
 * period ends, mails for tables that open for everyone after the members'
 * 48 hours, and a safety net that attaches a missing subscription schedule.
 * Everything is idempotent, so a run twice in a row sends nothing twice.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured() || !isEmailConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const reminders = await sendRenewalReminders();
  const earlyAccess = await sendEarlyAccessOpenMails();
  const schedules = isStripeConfigured() ? await repairMissingSchedules() : 0;

  if (reminders.sent + reminders.failed + earlyAccess.sent + earlyAccess.failed + schedules > 0) {
    console.info("[cron] memberships", { reminders, earlyAccess, schedules });
  }
  return NextResponse.json({ reminders, earlyAccess, schedules });
}
