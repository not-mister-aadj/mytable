import { cookies } from "next/headers";
import {
  ATTRIBUTION_FIRST_COOKIE,
  ATTRIBUTION_LAST_COOKIE,
  parseTouchCookie,
  type Attribution,
} from "@/lib/analytics/attribution";

/**
 * The visitor's attribution cookies, or null outside a request (a webhook,
 * a cron) or when there are none.
 */
export async function readAttribution(): Promise<Attribution | null> {
  try {
    const store = await cookies();
    const first = parseTouchCookie(store.get(ATTRIBUTION_FIRST_COOKIE)?.value);
    const last = parseTouchCookie(store.get(ATTRIBUTION_LAST_COOKIE)?.value);
    return first || last ? { first, last } : null;
  } catch {
    return null;
  }
}
