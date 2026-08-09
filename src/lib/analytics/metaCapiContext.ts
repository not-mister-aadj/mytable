import { and, eq } from "drizzle-orm";
import { bookingEvents, customers } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import type { MetaCapiUserData } from "@/lib/analytics/metaCapiClient";
import {
  extractClientIp,
  extractClientUserAgent,
  mergeMetaCapiUserData,
} from "@/lib/analytics/metaCapiClient";
import type { MetaTrackingContext } from "@/lib/analytics/metaApiContext";
import { normalizeEmail } from "@/lib/customers/normalize";

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
    clientIpAddress:
      context?.clientIpAddress ?? extractClientIp(request),
    clientUserAgent:
      context?.clientUserAgent ?? extractClientUserAgent(request),
    fbp: context?.fbp ?? null,
    fbc: context?.fbc ?? null,
  };
}

/** Enrich checkout payload with server-observed IP/UA before persisting. */
export function withRequestClientHints(
  context: MetaTrackingContext,
  request: Request,
): MetaTrackingContext {
  return {
    ...context,
    clientIpAddress: context.clientIpAddress ?? extractClientIp(request) ?? undefined,
    clientUserAgent:
      context.clientUserAgent ?? extractClientUserAgent(request) ?? undefined,
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
    clientIpAddress:
      typeof payload.clientIpAddress === "string"
        ? payload.clientIpAddress
        : undefined,
    clientUserAgent:
      typeof payload.clientUserAgent === "string"
        ? payload.clientUserAgent
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
    clientIpAddress?: string | null;
    clientUserAgent?: string | null;
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
    clientIpAddress:
      extras?.clientIpAddress ?? stored?.clientIpAddress ?? null,
    clientUserAgent:
      extras?.clientUserAgent ?? stored?.clientUserAgent ?? null,
    fbp: stored?.fbp ?? null,
    fbc: stored?.fbc ?? null,
  };
}

export type CustomerMetaEnrichment = {
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  city: string | null;
};

/** Optional CRM fields that boost Event Match Quality when present. */
export async function loadCustomerMetaEnrichment(
  email: string | null | undefined,
): Promise<CustomerMetaEnrichment | null> {
  if (!email || !isDbConfigured()) return null;
  try {
    const db = getDb();
    const [row] = await db
      .select({
        phone: customers.phone,
        firstName: customers.firstName,
        lastName: customers.lastName,
        city: customers.preferredCity,
      })
      .from(customers)
      .where(eq(customers.emailNormalized, normalizeEmail(email)))
      .limit(1);
    if (!row) return null;
    return {
      phone: row.phone?.trim() || null,
      firstName: row.firstName?.trim() || null,
      lastName: row.lastName?.trim() || null,
      city: row.city?.trim() || null,
    };
  } catch {
    return null;
  }
}

export function enrichmentToUserData(
  enrichment: CustomerMetaEnrichment | null,
): MetaCapiUserData {
  if (!enrichment) return {};
  return {
    phone: enrichment.phone,
    firstName: enrichment.firstName,
    lastName: enrichment.lastName,
    city: enrichment.city,
  };
}

export { mergeMetaCapiUserData };
