/** Canonical marketing origin for sitemap, robots, OG, JSON-LD. */
export function getSeoSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return fromEnv;
  }
  return "https://www.mytable.club";
}

export function absoluteUrl(path: string): string {
  const base = getSeoSiteUrl();
  if (!path || path === "/") return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteImageUrl(src: string | undefined | null): string | undefined {
  if (!src?.trim()) return undefined;
  return absoluteUrl(src.trim());
}
