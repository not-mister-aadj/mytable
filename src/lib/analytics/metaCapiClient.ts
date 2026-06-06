import {
  getMetaCapiAccessToken,
  getMetaCapiTestEventCode,
  getMetaPixelId,
  isMetaCapiConfigured,
} from "@/lib/analytics/metaConfig";
import { hashEmailForMeta, hashNameForMeta } from "@/lib/analytics/metaHash";

const GRAPH_API_VERSION = "v21.0";

export type MetaCapiUserData = {
  email?: string | null;
  firstName?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type MetaCapiServerEvent = {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  userData?: MetaCapiUserData;
  customData?: Record<string, string | number | boolean | string[] | undefined>;
};

function logCapi(message: string, detail?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log(`[Meta CAPI] ${message}`, detail ?? {});
}

function buildUserData(input?: MetaCapiUserData): Record<string, string | string[]> {
  const userData: Record<string, string | string[]> = {};

  if (input?.email) {
    userData.em = [hashEmailForMeta(input.email)];
  }
  if (input?.firstName) {
    userData.fn = [hashNameForMeta(input.firstName)];
  }
  if (input?.clientIpAddress && input.clientIpAddress !== "unknown") {
    userData.client_ip_address = input.clientIpAddress;
  }
  if (input?.clientUserAgent) {
    userData.client_user_agent = input.clientUserAgent;
  }
  if (input?.fbp) {
    userData.fbp = input.fbp;
  }
  if (input?.fbc) {
    userData.fbc = input.fbc;
  }

  return userData;
}

export async function sendMetaCapiEvent(
  event: MetaCapiServerEvent,
): Promise<boolean> {
  if (!isMetaCapiConfigured()) return false;

  const pixelId = getMetaPixelId();
  const accessToken = getMetaCapiAccessToken();
  if (!pixelId || !accessToken) return false;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.eventSourceUrl,
        user_data: buildUserData(event.userData),
        custom_data: event.customData ?? {},
      },
    ],
  };

  const testEventCode = getMetaCapiTestEventCode();
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await res.json()) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string; code?: number };
    };

    if (!res.ok || body.error) {
      console.error(
        `[Meta CAPI] ${event.eventName} failed`,
        body.error ?? res.status,
      );
      return false;
    }

    logCapi(`${event.eventName} sent`, {
      event_id: event.eventId,
      events_received: body.events_received,
      fbtrace_id: body.fbtrace_id,
      test_mode: Boolean(testEventCode),
    });
    return true;
  } catch (err) {
    console.error(`[Meta CAPI] ${event.eventName} request error`, err);
    return false;
  }
}

export function extractClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
}

export function extractClientUserAgent(request: Request): string | null {
  return request.headers.get("user-agent");
}
