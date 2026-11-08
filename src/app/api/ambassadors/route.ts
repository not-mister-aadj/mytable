import { NextResponse, after } from "next/server";
import { getDb, isDbConfigured } from "@/db/index";
import { ambassadorApplications } from "@/db/schema";
import { adminUrl } from "@/lib/admin-url";
import { AMBASSADOR_BUCKET, MOTIVATION_TYPES, motivationExtension, parseAmbassadorForm } from "@/lib/ambassadors/validate";
import { getAdminEmails } from "@/lib/env";
import { getEmailFrom, getEmailReplyTo, getResendClient } from "@/lib/email/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";



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

/** An application from /ambassadors: stored, the document in a private bucket, and a mail to us. */
export async function POST(request: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "generic" }, { status: 503 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowed(`ambassador:${ip}`)) return NextResponse.json({ error: "tooMany" }, { status: 429 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  // Honeypot: people never see this field, bots fill it in.
  if (typeof form.get("website") === "string" && (form.get("website") as string).trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const raw = form.get("motivationFile");
  const file = raw instanceof File && raw.size > 0 ? raw : null;
  const parsed = parseAmbassadorForm(
    (k) => form.get(k),
    (k) => form.getAll(k),
    file ? { name: file.name, size: file.size } : null,
  );
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.input;

  let motivationPath: string | null = null;
  if (file) {
    const ext = motivationExtension(file.name)!;
    motivationPath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    try {
      const { error } = await createSupabaseAdminClient()
        .storage.from(AMBASSADOR_BUCKET)
        .upload(motivationPath, Buffer.from(await file.arrayBuffer()), { contentType: MOTIVATION_TYPES[ext], upsert: false });
      if (error) throw error;
    } catch (error) {
      console.error("[ambassadors] upload failed", error);
      return NextResponse.json({ error: "generic" }, { status: 500 });
    }
  }

  const [row] = await getDb()
    .insert(ambassadorApplications)
    .values({
      ...input,
      motivationPath,
      motivationName: file ? file.name.slice(0, 200) : null,
    })
    .returning({ id: ambassadorApplications.id });

  after(() => mailUs(input.name, input.city, input.email));
  return NextResponse.json({ ok: true, id: row?.id });
}

/** One short mail to the admins per application. Never throws. */
async function mailUs(name: string, city: string, email: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;
  const to = getAdminEmails();
  const text = [
    `Nieuwe ambassador-aanmelding: ${name} (${city}), ${email}.`,
    "",
    `Bekijk de aanmelding: ${adminUrl("/ambassadors")}`,
  ].join("\n");
  try {
    await resend.emails.send({
      from: getEmailFrom(),
      replyTo: getEmailReplyTo(),
      to: to.length > 0 ? to : ["info@mytable.club"],
      subject: `Ambassador-aanmelding: ${name}, ${city}`,
      text,
    });
  } catch (error) {
    console.error("[ambassadors] admin mail failed", error);
  }
}
