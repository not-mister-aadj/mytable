import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { addEventNotifySignup, isValidEmail } from "@/lib/event-notify-signups";

const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, max = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || entry.reset < now) {
    rateLimit.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`event-notify:${ip}`)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { eventId } = await params;
  if (!eventId) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  let body: { email?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const locale = body.locale === "en" ? "en" : "nl";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  try {
    await addEventNotifySignup({ eventId, email, locale });
  } catch (error) {
    console.error("[event-notify] addEventNotifySignup failed:", error);
    return NextResponse.json({ error: "Could not sign up." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
