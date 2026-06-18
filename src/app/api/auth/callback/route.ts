import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminPostLoginUrl, adminUrlForHost } from "@/lib/admin-url";
import { isAdminEmail } from "@/lib/env";
import { clearStaleSupabaseAuthCookies } from "@/lib/supabase/cookies";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const host = requestUrl.host;
  const proto = requestUrl.protocol.replace(":", "");
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");

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
    return NextResponse.redirect(adminUrlForHost("/login?error=auth", host, proto));
  }

  if (!isAdminEmail(data.user.email)) {
    let unauthorizedResponse = NextResponse.redirect(
      adminUrlForHost("/login?error=unauthorized", host, proto),
    );
    const signOutClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              unauthorizedResponse.cookies.set(name, value, options);
            });
          },
        },
      },
    );
    await signOutClient.auth.signOut();
    return unauthorizedResponse;
  }

  return response;
}
