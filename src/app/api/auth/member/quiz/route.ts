import { NextResponse, after } from "next/server";
import type { Locale } from "@/i18n/config";
import { getMemberUser } from "@/lib/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendMetaCapiLead } from "@/lib/analytics/metaCapi";
import { parseMetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { metaUserDataFromRequest } from "@/lib/analytics/metaCapiContext";
import { addEventNotifySignup } from "@/lib/event-notify-signups";
import { getSiteUrl } from "@/lib/env";
import { QUIZ_METADATA_KEY, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";
import { upsertQuizWaitlist } from "@/lib/jouw-tafel/quiz-server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rateLimit = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, max = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || entry.reset < now) {
    rateLimit.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

/**
 * Saves the "Jouw tafel" quiz for the signed-in person (POST
 * /api/auth/member/quiz). Lives under /api/auth so the middleware refreshes
 * the Supabase session first.
 *
 * Body: { state, locale, waitlist?, notifyEventId?, meta? }
 * - Always: the quiz state goes into the user's metadata (jouw_tafel_quiz),
 *   so the quiz resumes on any device.
 * - waitlist: true (quiz done, or the table list is shown): the answers go
 *   onto a waitlist row for each chosen city. Meta's Lead (CAPI) fires once,
 *   for the first newly created row, same as a waitlist modal sign-up;
 *   existing rows never fire it again.
 * - notifyEventId: "Houd me op de hoogte" for that table (event_notify_signups).
 */
export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkRateLimit(`quiz:${user.id}`)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: {
    state?: unknown;
    locale?: string;
    waitlist?: boolean;
    notifyEventId?: string;
    meta?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale: Locale = body.locale === "en" ? "en" : "nl";
  const state = sanitizeQuizState(body.state);
  const notifyEventId =
    typeof body.notifyEventId === "string" && UUID_RE.test(body.notifyEventId) ? body.notifyEventId : null;
  if (notifyEventId && !state.notify?.includes(notifyEventId)) {
    state.notify = [...(state.notify ?? []), notifyEventId].slice(-20);
  }

  const supabase = await createSupabaseServerClient();
  const { error: metaError } = await supabase.auth.updateUser({ data: { [QUIZ_METADATA_KEY]: state } });
  if (metaError) {
    console.error("[jouw-tafel quiz] saving metadata failed:", metaError.message);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  let waitlist: { created: boolean } | null = null;
  if (body.waitlist === true || notifyEventId) {
    const result = await upsertQuizWaitlist({ email: user.email, locale, state });
    if (result.ok) {
      const lead = result.lead;
      waitlist = { created: lead !== null };
      if (lead) {
        const metaContext = parseMetaTrackingContext(body.meta);
        const email = user.email;
        // Kept alive past the response (Vercel freezes the function once it
        // has answered), like /api/waitlist.
        after(() =>
          sendMetaCapiLead({
            email,
            city: lead.city,
            source: "waitlist",
            waitlistId: lead.id,
            eventSourceUrl: metaContext.eventSourceUrl ?? getSiteUrl(),
            userData: metaUserDataFromRequest(request, metaContext, email),
          }).catch((error: unknown) => {
            console.error("[jouw-tafel quiz] sendMetaCapiLead failed:", error);
          }),
        );
      }
    } else if (result.error !== "no_city") {
      console.error("[jouw-tafel quiz] waitlist upsert failed:", result.error);
    }
  }

  if (notifyEventId) {
    try {
      await addEventNotifySignup({ eventId: notifyEventId, email: user.email, locale });
    } catch (error) {
      console.error("[jouw-tafel quiz] notify signup failed:", error);
      return NextResponse.json({ error: "Could not sign up" }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, waitlist });
}
