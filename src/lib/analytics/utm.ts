import {
  ATTRIBUTION_FIRST_COOKIE,
  ATTRIBUTION_LAST_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  campaignFromSearch,
  externalReferrerHost,
  type Touch,
} from "@/lib/analytics/attribution";

export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  /** Per-recipient code from a mail link (`?r=`), see
   * `src/lib/email/tracked-link.ts`. Lets a booking be traced to the exact
   * mail, even when the buyer pays with another email address. */
  ref?: string;
};

/** Only short lowercase codes, so a hand-edited or junk `r` is ignored. */
const REF_PATTERN = /^[a-z0-9]{6,32}$/;

const STORAGE_KEY = "mytable_utm";

export function parseUtmFromSearch(search: string): UtmParams {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const utm: UtmParams = {};
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  const content = params.get("utm_content");
  const ref = params.get("r");
  if (source) utm.utm_source = source;
  if (medium) utm.utm_medium = medium;
  if (campaign) utm.utm_campaign = campaign;
  if (content) utm.utm_content = content;
  if (ref && REF_PATTERN.test(ref)) utm.ref = ref;
  return utm;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? match[1]! : null;
}

function writeTouchCookie(name: string, touch: Touch) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(touch))}; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

/** The external referrer only counts once per page load (it does not
 * change on client-side navigation). */
let referrerCaptured = false;

/**
 * Keeps where the visitor came from in the attribution cookies: the first
 * visit ever (always), and the last visit that came from a campaign or
 * another site. See src/lib/analytics/attribution.ts.
 */
export function captureAttribution(search: string) {
  try {
    const campaign = campaignFromSearch(search);
    const hasCampaign = Object.keys(campaign).length > 0;
    const referrer = referrerCaptured ? null : externalReferrerHost(document.referrer, window.location.hostname);
    referrerCaptured = true;
    const touch: Touch = {
      ...campaign,
      ...(referrer ? { referrer } : {}),
      landing: window.location.pathname,
      at: new Date().toISOString(),
    };
    if (!readCookie(ATTRIBUTION_FIRST_COOKIE)) writeTouchCookie(ATTRIBUTION_FIRST_COOKIE, touch);
    if (hasCampaign || referrer) writeTouchCookie(ATTRIBUTION_LAST_COOKIE, touch);
  } catch {
    // Cookies may be blocked; attribution is a nice-to-have.
  }
}

export function persistUtmFromUrl(search?: string): UtmParams {
  if (typeof window === "undefined") return {};

  captureAttribution(search ?? window.location.search);
  const parsed = parseUtmFromSearch(search ?? window.location.search);
  if (Object.keys(parsed).length === 0) {
    return getStoredUtm();
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Storage may be blocked — tracking still works without persistence.
  }

  return parsed;
}

export function getStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};

  for (const store of [sessionStorage, localStorage]) {
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as UtmParams;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // ignore
    }
  }

  return {};
}
