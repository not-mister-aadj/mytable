import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { sendWomenWelcomeEmailForUser } from "@/lib/email/sendWomenWelcomeEmail";
import type { Locale } from "@/i18n/config";

export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let locale: Locale = "nl";
  try {
    const body = (await request.json()) as { locale?: string };
    if (body.locale === "en" || body.locale === "nl") {
      locale = body.locale;
    }
  } catch {
    /* empty body ok */
  }

  const result = await sendWomenWelcomeEmailForUser(user, locale);
  return NextResponse.json({ ok: true, ...result });
}
