export type AnalyticsPageType =
  | "home"
  | "agenda"
  | "event_detail"
  | "success"
  | "failed"
  | "legal"
  | "other";

export function inferPageType(pathname: string): AnalyticsPageType {
  const path = pathname.replace(/^\/(nl|en)/, "") || "/";
  if (path === "/" || path === "") return "home";
  if (path === "/agenda") return "agenda";
  if (path.startsWith("/agenda/")) return "event_detail";
  if (path.startsWith("/boeking/bevestigd")) return "success";
  if (path.startsWith("/boeking/geannuleerd")) return "failed";
  if (
    path.includes("privacy") ||
    path.includes("terms") ||
    path.includes("algemene-voorwaarden")
  ) {
    return "legal";
  }
  return "other";
}

export function isLandingPageType(pageType: AnalyticsPageType): boolean {
  return pageType === "home" || pageType === "agenda";
}
