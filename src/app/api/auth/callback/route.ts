import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  adminPostLoginUrl,
  adminUrlForHost,
  getSiteUrl,
  isAdminHost,
  resolveHostname,
} from "@/lib/admin-url";
import { isAdminEmail } from "@/lib/env";
import { clearStaleSupabaseAuthCookies } from "@/lib/supabase/cookies";

function marketingHome(proto: string, host: string): string {
  try {
    return new URL("/", getSiteUrl()).toString();
  } catch {
    return `${proto}://${host}/`;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = requestUrl.host;
  const hostname = resolveHostname(host) ?? host.split(":")[0];
  const proto = requestUrl.protocol.replace(":", "");
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");

  // Admin OAuth only belongs on the admin host or /dashboard path on www.
  // If a member OAuth somehow hits this route, send them back to the marketing site.
  const onAdminHost = isAdminHost(hostname);

  if (oauthError || !code) {
    if (!onAdminHost) {
      return NextResponse.redirect(
        `${marketingHome(proto, host)}?signin=1&auth=error`,
      );
    }
    return NextResponse.redirect(adminUrlForHost("/login?error=auth", host, proto));
  }

  const cookieStore = await cookies();
  const successRedirect = onAdminHost
    ? adminPostLoginUrl(host, proto, null)
    : new URL("/dashboard", `${proto}://${host}`).toString();
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
    if (!onAdminHost) {
      return NextResponse.redirect(
        `${marketingHome(proto, host)}?signin=1&auth=error`,
      );
    }
    return NextResponse.redirect(adminUrlForHost("/login?error=auth", host, proto));
  }

  if (!isAdminEmail(data.user.email)) {
    // Non-staff account: clear session and return to member login on the marketing site.
    await supabase.auth.signOut();
    const denied = NextResponse.redirect(
      `${marketingHome(proto, host)}?signin=1&auth=error`,
    );
    clearStaleSupabaseAuthCookies(cookieStore.getAll(), (name) => {
      denied.cookies.set(name, "", { maxAge: 0, path: "/" });
    });
    return denied;
  }

  return response;
}
