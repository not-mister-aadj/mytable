/**
 * Where a visitor came from, kept in two first-party cookies so the server
 * can store it with a waitlist signup, a new customer and a booking:
 * the first visit ever (also without a campaign: landing page and the site
 * that sent them) and the last campaign click (utm tags, fbclid or gclid).
 * Shared by the client (writing) and the server (reading).
 */

export const ATTRIBUTION_FIRST_COOKIE = "mt_attr_first";
export const ATTRIBUTION_LAST_COOKIE = "mt_attr_last";
/** 90 days, like the Meta click id. */
export const ATTRIBUTION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export type Touch = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  fbclid?: string;
  gclid?: string;
  /** Path the visitor landed on, without the query. */
  landing?: string;
  /** Host of the site that sent them (google.com, instagram.com), never ours. */
  referrer?: string;
  /** ISO time of the visit. */
  at?: string;
};

export type Attribution = { first: Touch | null; last: Touch | null };

const FIELDS: { key: keyof Touch; max: number }[] = [
  { key: "source", max: 100 },
  { key: "medium", max: 100 },
  { key: "campaign", max: 200 },
  { key: "content", max: 200 },
  { key: "term", max: 200 },
  { key: "fbclid", max: 500 },
  { key: "gclid", max: 500 },
  { key: "landing", max: 300 },
  { key: "referrer", max: 200 },
  { key: "at", max: 40 },
];

/** Only known keys, only short strings: a cookie is client data. */
export function sanitizeTouch(raw: unknown): Touch | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Touch = {};
  for (const { key, max } of FIELDS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, max);
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function parseTouchCookie(value: string | undefined | null): Touch | null {
  if (!value) return null;
  try {
    return sanitizeTouch(JSON.parse(decodeURIComponent(value)));
  } catch {
    return null;
  }
}

/** The campaign part of a query string (utm tags and click ids). */
export function campaignFromSearch(search: string): Touch {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const touch: Touch = {};
  const map: [string, keyof Touch][] = [
    ["utm_source", "source"],
    ["utm_medium", "medium"],
    ["utm_campaign", "campaign"],
    ["utm_content", "content"],
    ["utm_term", "term"],
    ["fbclid", "fbclid"],
    ["gclid", "gclid"],
  ];
  for (const [param, key] of map) {
    const value = params.get(param);
    if (value) touch[key] = value;
  }
  return touch;
}

/** The host of an external referrer, or null for none or our own site. */
export function externalReferrerHost(referrer: string, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    const own = ownHost.replace(/^www\./, "");
    return host && host !== own && !host.endsWith(`.${own}`) ? host : null;
  } catch {
    return null;
  }
}

/** True when there is anything to store. */
export function hasAttribution(a: Attribution | null | undefined): a is Attribution {
  return Boolean(a && (a.first || a.last));
}

/** One line for the dashboard: "Meta advertentie · campagne X · advertentie Y",
 * "instagram.com (geen campagne)", "Direct". */
export function describeTouch(touch: Touch | null | undefined): string {
  if (!touch) return "Onbekend";
  const source = touch.source?.toLowerCase() ?? "";
  const meta = Boolean(touch.fbclid) || ["fb", "facebook", "ig", "instagram", "meta"].includes(source);
  const parts: string[] = [];
  if (meta && (touch.medium === "paid" || touch.fbclid || touch.campaign)) {
    parts.push(source === "ig" || source === "instagram" ? "Meta advertentie (Instagram)" : "Meta advertentie");
  } else if (touch.gclid) {
    parts.push("Google advertentie");
  } else if (touch.source) {
    parts.push(touch.medium ? `${touch.source} / ${touch.medium}` : touch.source);
  } else if (touch.referrer) {
    parts.push(`${touch.referrer} (geen campagne)`);
  } else {
    parts.push("Direct");
  }
  if (touch.campaign) parts.push(`campagne ${touch.campaign}`);
  if (touch.content) parts.push(`advertentie ${touch.content}`);
  if (touch.term) parts.push(`ad set ${touch.term}`);
  if (touch.landing) parts.push(`via ${touch.landing}`);
  return parts.join(" · ");
}
