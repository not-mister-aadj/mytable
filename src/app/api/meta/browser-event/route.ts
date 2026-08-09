import { sendMetaCapiEvent } from "@/lib/analytics/metaCapiClient";
import {
  extractClientIp,
  extractClientUserAgent,
  splitPersonName,
} from "@/lib/analytics/metaCapiClient";
import { isMetaCapiConfigured } from "@/lib/analytics/metaConfig";
import { readOnboardingFromMetadata } from "@/lib/member-onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "PageView",
  "LandingPageView",
  "ViewContent",
]);

type Body = {
  eventName?: string;
  eventId?: string;
  eventSourceUrl?: string;
  fbp?: string | null;
  fbc?: string | null;
  externalId?: string | null;
  customData?: Record<string, unknown>;
};

function asStringRecord(
  input: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | string[] | undefined> {
  if (!input) return {};
  const out: Record<string, string | number | boolean | string[] | undefined> =
    {};
  for (const [key, value] of Object.entries(input)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      (Array.isArray(value) && value.every((v) => typeof v === "string"))
    ) {
      out[key] = value as string | number | boolean | string[];
    }
  }
  return out;
}

export async function POST(request: Request) {
  if (!isMetaCapiConfigured()) {
    return new Response(null, { status: 204 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const eventName = body.eventName?.trim();
  const eventId = body.eventId?.trim();
  const eventSourceUrl = body.eventSourceUrl?.trim();

  if (
    !eventName ||
    !ALLOWED_EVENTS.has(eventName) ||
    !eventId ||
    eventId.length > 128 ||
    !eventSourceUrl ||
    eventSourceUrl.length > 2048
  ) {
    return Response.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  let email: string | null = null;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let phone: string | null = null;
  let city: string | null = null;
  let externalId: string | null = null;
  let country: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      externalId = user.id;
      email = user.email ?? null;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const { prefs } = readOnboardingFromMetadata(meta);
      const fullName =
        prefs.name.trim() ||
        (typeof meta.full_name === "string" ? meta.full_name : "") ||
        (typeof meta.name === "string" ? meta.name : "");
      const split = splitPersonName(fullName);
      firstName = split.firstName;
      lastName = split.lastName;
      city = prefs.cities[0] ?? null;
      const phoneRaw =
        (typeof meta.phone === "string" && meta.phone) ||
        (typeof meta.phone_number === "string" && meta.phone_number) ||
        "";
      const phoneDigits = phoneRaw.replace(/\D+/g, "");
      if (phoneDigits.length >= 8) phone = phoneDigits;
      if (prefs.cities.length > 0 || prefs.joinIntent || email) {
        country = "nl";
      }
    }
  } catch {
    // Anonymous visitor — still send IP/UA/fbp/fbc.
  }

  const anonExternalId =
    typeof body.externalId === "string" && body.externalId.trim().length >= 8
      ? body.externalId.trim().slice(0, 128)
      : null;

  const ok = await sendMetaCapiEvent({
    eventName,
    eventId,
    eventSourceUrl,
    userData: {
      email,
      firstName,
      lastName,
      phone,
      city,
      country,
      externalId: externalId ?? anonExternalId,
      clientIpAddress: extractClientIp(request),
      clientUserAgent: extractClientUserAgent(request),
      fbp: body.fbp ?? null,
      fbc: body.fbc ?? null,
    },
    customData: asStringRecord(body.customData),
  });

  return Response.json({ ok });
}
