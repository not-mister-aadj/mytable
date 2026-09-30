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

export function persistUtmFromUrl(search?: string): UtmParams {
  if (typeof window === "undefined") return {};

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
