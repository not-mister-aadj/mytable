import { NextResponse, type NextRequest } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { jouwTafelSignUpPath, jouwTafelStartPath, type Locale } from "@/i18n/config";

/**
 * A Google round Supabase could not place (see oauthStateErrorLocale).
 * Signed in after all: on to the quiz, as the Google button intended.
 * Not signed in: back to sign up, with the usual "Google failed" note.
 */
export async function GET(request: NextRequest) {
  const locale: Locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "nl";
  const user = await getMemberUser();
  const target = request.nextUrl.clone();
  target.search = "";
  if (user?.email) {
    target.pathname = jouwTafelStartPath(locale);
  } else {
    target.pathname = jouwTafelSignUpPath(locale);
    target.searchParams.set("fout", "google");
  }
  return NextResponse.redirect(target);
}
