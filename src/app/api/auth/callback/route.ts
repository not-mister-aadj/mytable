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

  const { searchParams } = requestUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(adminUrlForHost("/login?error=auth", host, proto));
  }

  const cookieStore = await cookies();
  clearStaleSupabaseAuthCookies(cookieStore.getAll(), (name) =>
    cookieStore.delete(name),
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(adminUrlForHost("/login?error=auth", host, proto));
  }

  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    const devEmail =
      process.env.NODE_ENV === "development"
        ? `&email=${encodeURIComponent(data.user.email)}`
        : "";
    return NextResponse.redirect(
      adminUrlForHost(`/login?error=unauthorized${devEmail}`, host, proto),
    );
  }

  return NextResponse.redirect(adminPostLoginUrl(host, proto, null));
}
