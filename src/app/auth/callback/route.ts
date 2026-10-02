import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { syncMemberCustomer } from "@/lib/member-auth";
import { sanitizeMemberNextPath } from "@/lib/member-url";
import { getSiteUrl, isAdminHost, resolveHostname } from "@/lib/admin-url";
import {
  captureCriticalError,
  captureCriticalMessage,
} from "@/lib/sentry/critical";
import {
  jouwTafelSignUpPath,
  jouwTafelWelcomePath,
  type Locale,
} from "@/i18n/config";
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

/** Google sign-in from the "Jouw tafel" account screens: they ask to come
 * back to the welcome page, which must not be swapped for the old
 * onboarding funnel (resolvePostAuthPath sends unfinished profiles to the
 * removed /join). */
function jouwTafelWelcomeLocale(next: string): Locale | null {
  const path = next.split("?")[0];
  if (path === jouwTafelWelcomePath("nl")) return "nl";
  if (path === jouwTafelWelcomePath("en")) return "en";
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const hostname =
    resolveHostname(request.headers.get("host") ?? "") ??
    new URL(origin).hostname;
  const siteOrigin = marketingOrigin(origin, hostname);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/sunday-table";
  const locale = resolveLocale(nextRaw);
  const next = sanitizeMemberNextPath(nextRaw, locale);
  const jouwTafelLocale = jouwTafelWelcomeLocale(next);
  const errorRedirect = jouwTafelLocale
    ? `${siteOrigin}${jouwTafelSignUpPath(jouwTafelLocale)}?fout=google`
    : `${siteOrigin}${next}?signin=1&auth=error`;

  if (!code) {
    return NextResponse.redirect(errorRedirect);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    captureCriticalMessage("Member auth callback missing Supabase env", {
      flow: "auth",
      step: "member_oauth_callback",
    });
    return NextResponse.redirect(errorRedirect);
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
    return NextResponse.redirect(errorRedirect);
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
  const destination = jouwTafelLocale
    ? next
    : resolvePostAuthPath(locale, {
        completed,
        prefs,
        intendedNext: next,
      });

  // Funnel signal for Meta (Purchase optimization learns registration → buy).
  try {
    const createdMs = new Date(data.user.created_at).getTime();
    const isNew =
      !Number.isNaN(createdMs) && Date.now() - createdMs < 15 * 60 * 1000;
    if (isNew) {
      const {
        extractClientIp,
        extractClientUserAgent,
        sendMetaCapiEvent,
        splitPersonName,
      } = await import("@/lib/analytics/metaCapiClient");
      const { metaCompleteRegistrationEventId } = await import(
        "@/lib/analytics/metaIds"
      );
      const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        "";
      const nameParts = splitPersonName(fullName);
      void sendMetaCapiEvent({
        eventName: "CompleteRegistration",
        eventId: metaCompleteRegistrationEventId(data.user.id),
        eventSourceUrl: `${siteOrigin}${destination}`,
        userData: {
          email: data.user.email,
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          externalId: data.user.id,
          country: "nl",
          clientIpAddress: extractClientIp(request),
          clientUserAgent: extractClientUserAgent(request),
          fbp: request.cookies.get("_fbp")?.value ?? null,
          fbc: request.cookies.get("_fbc")?.value ?? null,
        },
        customData: {
          content_name: "account_registration",
          status: true,
          method: "google",
        },
      });
    }
  } catch (err) {
    console.error("[auth/callback] meta complete registration", err);
  }

  const response = NextResponse.redirect(`${siteOrigin}${destination}`);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
