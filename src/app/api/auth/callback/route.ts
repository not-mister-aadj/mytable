import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  adminPostLoginUrl,
  adminUrlForHost,
  getAdminUrl,
  getSiteUrl,
  isAdminHost,
  resolveHostname,
} from "@/lib/admin-url";
import { isAdminEmail } from "@/lib/env";
import { clearStaleSupabaseAuthCookies } from "@/lib/supabase/cookies";
import { captureCriticalError } from "@/lib/sentry/critical";

function marketingHome(): string {
  try {
    return new URL("/", getSiteUrl()).toString();
  } catch {
    return "https://www.mytable.club/";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = requestUrl.host;
  const hostname = resolveHostname(host) ?? host.split(":")[0];
  const proto = requestUrl.protocol.replace(":", "");
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");

  // Admin OAuth belongs only on dashboard.mytable.club
  if (!isAdminHost(hostname) && process.env.NODE_ENV === "production") {
    const adminLogin = new URL("/login", getAdminUrl()).toString();
    if (oauthError || !code) {
      return NextResponse.redirect(`${marketingHome()}?signin=1&auth=error`);
    }
    // Staff who hit the wrong host: send them to the real admin login
    return NextResponse.redirect(adminLogin);
  }

  if (oauthError || !code) {
    return NextResponse.redirect(adminUrlForHost("/login?error=auth", host, proto));
  }

  const cookieStore = await cookies();
  const successRedirect = adminPostLoginUrl(host, proto, null);
  let response = NextResponse.redirect(successRedirect);

  clearStaleSupabaseAuthCookies(cookieStore.getAll(), (name) => {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    captureCriticalError(
      error ?? new Error("Admin OAuth exchange returned no user email"),
      {
        flow: "auth",
        step: "admin_oauth_callback",
      },
    );
    return NextResponse.redirect(adminUrlForHost("/login?error=auth", host, proto));
  }

  if (!isAdminEmail(data.user.email)) {
    // Expected for non-staff accounts — do not alert.
    await supabase.auth.signOut();
    let unauthorizedResponse = NextResponse.redirect(
      adminUrlForHost("/login?error=unauthorized", host, proto),
    );
    clearStaleSupabaseAuthCookies(cookieStore.getAll(), (name) => {
      unauthorizedResponse.cookies.set(name, "", { maxAge: 0, path: "/" });
    });
    return unauthorizedResponse;
  }

  return response;
}
