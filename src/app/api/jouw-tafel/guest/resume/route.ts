import { NextResponse, type NextRequest } from "next/server";
import { jouwTafelKiesPath, jouwTafelSignUpPath, type Locale } from "@/i18n/config";
import { GUEST_COOKIE, getGuestById, guestCookieOptions } from "@/lib/jouw-tafel/guest-server";

/**
 * The welcome mail's link for someone without an account yet
 * (GET /api/jouw-tafel/guest/resume?g={id}): puts the guest cookie in this
 * browser and opens "Kies je zondag". An unknown or used-up id goes to the
 * email screen.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("g");
  const guest = id ? await getGuestById(id).catch(() => null) : null;
  const locale: Locale = guest?.locale ?? (request.nextUrl.searchParams.get("locale") === "en" ? "en" : "nl");
  const target = request.nextUrl.clone();
  target.search = "";
  if (!guest) {
    target.pathname = jouwTafelSignUpPath(locale);
    return NextResponse.redirect(target);
  }
  const [path, query] = jouwTafelKiesPath(locale).split("?");
  target.pathname = path;
  target.search = query ? `?${query}` : "";
  const response = NextResponse.redirect(target);
  response.cookies.set(GUEST_COOKIE, guest.id, guestCookieOptions);
  return response;
}
