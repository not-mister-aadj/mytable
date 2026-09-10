import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import {
  applyResendOutreachEvent,
  verifyResendSignature,
  type ResendWebhookEvent,
} from "@/lib/outreach/resend-events";

/**
 * Resend delivery events (delivered / opened / clicked / bounced / complained).
 * Add the endpoint in the Resend dashboard and put its signing secret in
 * RESEND_WEBHOOK_SECRET. Open and click tracking must also be switched on for
 * the sending domain, otherwise those two events never fire.
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[resend webhook] RESEND_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  const payload = await request.text();
  const valid = verifyResendSignature({
    payload,
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
    secret,
  });

  if (!valid) {
    // Often probe traffic — log only, never page on a bad signature.
    console.error("[resend webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(payload) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const matched = await applyResendOutreachEvent(event);
    // Unmatched events are fine: the same endpoint also receives booking mail.
    return NextResponse.json({ received: true, matched });
  } catch (error) {
    console.error("[resend webhook] apply failed", error);
    // 500 makes Resend retry, which the dedupe index makes safe.
    return NextResponse.json({ error: "Apply failed" }, { status: 500 });
  }
}
