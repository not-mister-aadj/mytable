import { NextResponse } from "next/server";
import { getMemberUser, syncMemberCustomer } from "@/lib/member-auth";
import type { Locale } from "@/i18n/config";

export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let locale: Locale = "nl";
  let recordOnboarding = false;
  let forceLanguage = false;
  try {
    const body = (await request.json()) as {
      locale?: string;
      recordOnboarding?: boolean;
      forceLanguage?: boolean;
    };
    if (body.locale === "en" || body.locale === "nl") {
      locale = body.locale;
    }
    recordOnboarding = body.recordOnboarding === true;
    forceLanguage = body.forceLanguage === true;
  } catch {
    // ignore
  }

  try {
    // Re-fetch user so metadata includes latest onboarding prefs after updateUser
    const fresh = await getMemberUser();
    const { customerId } = await syncMemberCustomer(fresh ?? user, locale, {
      recordOnboarding,
      forceLanguage,
    });
    return NextResponse.json({ ok: true, customerId });
  } catch (error) {
    console.error("[member sync]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
