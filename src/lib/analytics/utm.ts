export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

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
  if (source) utm.utm_source = source;
  if (medium) utm.utm_medium = medium;
  if (campaign) utm.utm_campaign = campaign;
  if (content) utm.utm_content = content;
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
