export type MetaBrowserContext = {
  fbp?: string | null;
  fbc?: string | null;
  eventSourceUrl?: string | null;
};

export function getMetaBrowserCookies(): Pick<MetaBrowserContext, "fbp" | "fbc"> {
  if (typeof document === "undefined") return {};

  const cookies = document.cookie.split(";").reduce<Record<string, string>>(
    (acc, part) => {
      const [key, ...rest] = part.trim().split("=");
      if (key) acc[key] = decodeURIComponent(rest.join("="));
      return acc;
    },
    {},
  );

  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  const fbcFromUrl =
    fbclid != null
      ? `fb.1.${Date.now()}.${fbclid}`
      : undefined;

  return {
    fbp: cookies._fbp || undefined,
    fbc: cookies._fbc || fbcFromUrl,
  };
}

export function getMetaEventSourceUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href.split("#")[0];
}
