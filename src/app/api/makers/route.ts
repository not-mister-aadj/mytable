import { NextResponse, after } from "next/server";
import { getDb, isDbConfigured } from "@/db/index";
import { makers } from "@/db/schema";
import { adminUrl } from "@/lib/admin-url";
import { getEmailReplyTo, getResendClient } from "@/lib/email/resend";
import { makerNoticeMail } from "@/lib/makers/mails";
import { parseMakerForm, type MakerInput } from "@/lib/makers/validate";

const rateLimit = new Map<string, { count: number; reset: number }>();

function allowed(key: string, max = 5, windowMs = 60_000): boolean {
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

/** An application from /makers: stored, and a notice to info@ to approve it. */
export async function POST(request: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "generic" }, { status: 503 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowed(`maker:${ip}`)) return NextResponse.json({ error: "tooMany" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  // Honeypot: people never see this field, bots fill it in.
  if (typeof body.website === "string" && body.website.trim() !== "") return NextResponse.json({ ok: true });

  const parsed = parseMakerForm(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await getDb().insert(makers).values(parsed.input);
  after(() => sendNotice(parsed.input));
  return NextResponse.json({ ok: true });
}

const TEAM_INBOX = "info@mytable.club";
const NOTICE_FROM = "MyTable <hallo@tafels.mytable.club>";

async function sendNotice(input: MakerInput): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;
  let link = "https://dashboard.mytable.club/creators";
  try {
    link = adminUrl("/creators");
  } catch {
    // keep the fallback
  }
  try {
    const { error } = await resend.emails.send({ from: NOTICE_FROM, replyTo: getEmailReplyTo(), to: TEAM_INBOX, ...makerNoticeMail(input, link) });
    if (error) console.error("[makers] notice mail failed", error);
  } catch (error) {
    console.error("[makers] notice mail failed", error);
  }
}
