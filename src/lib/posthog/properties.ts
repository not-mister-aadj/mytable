import { createHash } from "crypto";
import type { ExperienceItem } from "@/i18n/types";
import {
  inferPageType as inferAnalyticsPageType,
  type AnalyticsPageType,
} from "@/lib/analytics/inferPageType";
import type { PageType } from "@/lib/posthog/events";

export type { AnalyticsPageType };

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export function hashEmail(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

/** Lightweight client-safe email hash (no raw PII in PostHog). */
export function hashEmailClient(email: string): string {
  const normalized = email.trim().toLowerCase();
  let h = 5381;
  for (let i = 0; i < normalized.length; i++) {
    h = (h * 33) ^ normalized.charCodeAt(i);
  }
  return `e${(h >>> 0).toString(16)}`;
}

export function getPercentSold(experience: ExperienceItem): number | null {
  if (
    experience.capacity !== undefined &&
    experience.spotsSold !== undefined &&
    experience.capacity > 0
  ) {
    return Math.round((experience.spotsSold / experience.capacity) * 100);
  }
  return null;
}

export function buildExperienceProperties(
  experience: ExperienceItem,
  language: string,
): AnalyticsProperties {
  return {
    event_id: experience.eventDbId ?? experience.id,
    event_slug: experience.slug ?? "",
    event_name: experience.experienceName,
    event_type: experience.experienceType ?? experience.category,
    city: experience.city,
    date: experience.dateTime,
    price: experience.price,
    capacity: experience.capacity ?? null,
    booked_count: experience.spotsSold ?? null,
    availability_status: experience.status,
    percent_sold: getPercentSold(experience),
    language,
  };
}

export function inferPageType(pathname: string): PageType {
  return inferAnalyticsPageType(pathname) as PageType;
}

export function getDeviceType(userAgent: string): string {
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function parseUtmParams(
  search: string,
): Pick<
  AnalyticsProperties,
  "utm_source" | "utm_medium" | "utm_campaign"
> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
  };
}
