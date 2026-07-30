import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { syncMemberCustomer } from "@/lib/member-auth";
import { sanitizeMemberNextPath } from "@/lib/member-url";
import type { Locale } from "@/i18n/config";

function resolveLocale(next: string): Locale {
  if (next.startsWith("/en/") || next === "/en") return "en";
  return "nl";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/";
  const locale = resolveLocale(nextRaw);
  const next = sanitizeMemberNextPath(nextRaw, locale);

  if (!code) {
    return NextResponse.redirect(`${origin}${next}?signin=1&auth=error`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}${next}?signin=1&auth=error`);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}${next}?signin=1&auth=error`);
  }

  try {
    await syncMemberCustomer(data.user, locale);
  } catch (err) {
    console.error("[auth/callback] customer sync failed", err);
  }

  return response;
}
