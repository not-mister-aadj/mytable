import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { syncMemberCustomer } from "@/lib/member-auth";
import { sanitizeMemberNextPath } from "@/lib/member-url";
import { getSiteUrl, isAdminHost, resolveHostname } from "@/lib/admin-url";
import {
  captureCriticalError,
  captureCriticalMessage,
} from "@/lib/sentry/critical";
import type { Locale } from "@/i18n/config";
import {
  readOnboardingFromMetadata,
  resolvePostAuthPath,
} from "@/lib/member-onboarding";

function resolveLocale(next: string): Locale {
  if (next.startsWith("/en/") || next === "/en") return "en";
  return "nl";
}

function marketingOrigin(requestOrigin: string, hostname: string): string {
  if (isAdminHost(hostname)) {
    try {
      return new URL(getSiteUrl()).origin;
    } catch {
      return requestOrigin;
    }
  }
  return requestOrigin;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const hostname =
    resolveHostname(request.headers.get("host") ?? "") ??
    new URL(origin).hostname;
  const siteOrigin = marketingOrigin(origin, hostname);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/clubmember";
  const locale = resolveLocale(nextRaw);
  const next = sanitizeMemberNextPath(nextRaw, locale);

  if (!code) {
    return NextResponse.redirect(`${siteOrigin}${next}?signin=1&auth=error`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    captureCriticalMessage("Member auth callback missing Supabase env", {
      flow: "auth",
      step: "member_oauth_callback",
    });
    return NextResponse.redirect(`${siteOrigin}${next}?signin=1&auth=error`);
  }

  const pendingCookies: Array<{
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }> = [];

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    captureCriticalError(
      error ?? new Error("Member OAuth exchange returned no user"),
      {
        flow: "auth",
        step: "member_oauth_callback",
      },
    );
    return NextResponse.redirect(`${siteOrigin}${next}?signin=1&auth=error`);
  }

  try {
    await syncMemberCustomer(data.user, locale);
  } catch (err) {
    console.error("[auth/callback] customer sync failed", err);
    captureCriticalError(err, {
      flow: "auth",
      step: "member_customer_sync",
    });
  }

  const { completed, prefs } = readOnboardingFromMetadata(
    data.user.user_metadata as Record<string, unknown>,
  );
  const destination = resolvePostAuthPath(locale, {
    completed,
    prefs,
    intendedNext: next,
  });

  const response = NextResponse.redirect(`${siteOrigin}${destination}`);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
