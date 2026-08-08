import { and, eq } from "drizzle-orm";
import { bookingEvents } from "@/db/schema";
import { getDb } from "@/db/index";
import type { MetaCapiUserData } from "@/lib/analytics/metaCapiClient";
import type { MetaTrackingContext } from "@/lib/analytics/metaApiContext";
import {
  extractClientIp,
  extractClientUserAgent,
} from "@/lib/analytics/metaCapiClient";

export function metaUserDataFromRequest(
  request: Request,
  context?: MetaTrackingContext,
  email?: string | null,
  firstName?: string | null,
  extras?: {
    lastName?: string | null;
    phone?: string | null;
    city?: string | null;
    country?: string | null;
    externalId?: string | null;
  },
): MetaCapiUserData {
  return {
    email,
    firstName,
    lastName: extras?.lastName ?? null,
    phone: extras?.phone ?? null,
    city: extras?.city ?? null,
    country: extras?.country ?? null,
    externalId: extras?.externalId ?? null,
    clientIpAddress: extractClientIp(request),
    clientUserAgent: extractClientUserAgent(request),
    fbp: context?.fbp ?? null,
    fbc: context?.fbc ?? null,
  };
}

export async function loadCheckoutMetaContext(
  bookingId: string,
): Promise<MetaTrackingContext | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(bookingEvents)
    .where(
      and(
        eq(bookingEvents.bookingId, bookingId),
        eq(bookingEvents.type, "checkout_meta_context"),
      ),
    )
    .limit(1);

  if (!row?.payload || typeof row.payload !== "object") return null;
  const payload = row.payload as Record<string, unknown>;
  return {
    fbp: typeof payload.fbp === "string" ? payload.fbp : undefined,
    fbc: typeof payload.fbc === "string" ? payload.fbc : undefined,
    eventSourceUrl:
      typeof payload.eventSourceUrl === "string"
        ? payload.eventSourceUrl
        : undefined,
  };
}

export function metaUserDataFromStoredContext(
  stored: MetaTrackingContext | null,
  email: string,
  firstName?: string | null,
  extras?: {
    lastName?: string | null;
    phone?: string | null;
    city?: string | null;
    country?: string | null;
    externalId?: string | null;
  },
): MetaCapiUserData {
  return {
    email,
    firstName,
    lastName: extras?.lastName ?? null,
    phone: extras?.phone ?? null,
    city: extras?.city ?? null,
    country: extras?.country ?? "nl",
    externalId: extras?.externalId ?? null,
    fbp: stored?.fbp ?? null,
    fbc: stored?.fbc ?? null,
  };
}
