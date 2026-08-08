export type MetaBrowserContext = {
  fbp?: string | null;
  fbc?: string | null;
  eventSourceUrl?: string | null;
};

const FBC_COOKIE_MAX_AGE_SEC = 90 * 24 * 60 * 60;

function readCookieMap(): Record<string, string> {
  if (typeof document === "undefined") return {};
  return document.cookie.split(";").reduce<Record<string, string>>(
    (acc, part) => {
      const [key, ...rest] = part.trim().split("=");
      if (key) acc[key] = decodeURIComponent(rest.join("="));
      return acc;
    },
    {},
  );
}

function writeCookie(name: string, value: string, maxAgeSec: number): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax${secure}`;
}

/** Persist `_fbc` from `fbclid` so CAPI + pixel share click attribution. */
export function ensureMetaFbcCookie(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const cookies = readCookieMap();
  if (cookies._fbc) return cookies._fbc;

  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return undefined;

  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  writeCookie("_fbc", fbc, FBC_COOKIE_MAX_AGE_SEC);
  return fbc;
}

export function getMetaBrowserCookies(): Pick<MetaBrowserContext, "fbp" | "fbc"> {
  if (typeof document === "undefined") return {};

  const cookies = readCookieMap();
  const fbc = cookies._fbc || ensureMetaFbcCookie();

  return {
    fbp: cookies._fbp || undefined,
    fbc: fbc || undefined,
  };
}

export function getMetaEventSourceUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href.split("#")[0];
}
