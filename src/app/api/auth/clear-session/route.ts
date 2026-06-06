import { NextResponse } from "next/server";
import { adminUrlForHost } from "@/lib/admin-url";

function supabaseCookieNames(cookieHeader: string | null): string[] {
  if (!cookieHeader) return [];
  const names: string[] = [];
  for (const part of cookieHeader.split(";")) {
    const name = part.trim().split("=")[0]?.trim();
    if (name?.startsWith("sb-")) names.push(name);
  }
  return names;
}

/** Clears Supabase auth cookies — use when localhost hits HTTP 431 (headers too large). */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = requestUrl.host;
  const proto = requestUrl.protocol.replace(":", "");

  const response = NextResponse.redirect(
    adminUrlForHost("/login?cleared=1", host, proto),
  );

  for (const name of supabaseCookieNames(request.headers.get("cookie"))) {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }

  return response;
}
