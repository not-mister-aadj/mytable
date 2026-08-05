export type AnalyticsPageType =
  | "home"
  | "agenda"
  | "event_detail"
  | "checkout"
  | "success"
  | "failed"
  | "legal"
  | "join"
  | "clubmember"
  | "sunday_table"
  | "girls_only"
  | "blog"
  | "account"
  | "auth"
  | "waitlist"
  | "other";

export function inferPageType(pathname: string): AnalyticsPageType {
  const path = pathname.replace(/^\/(nl|en)/, "") || "/";
  if (path === "/" || path === "") return "home";
  if (path === "/agenda") return "agenda";
  if (path.startsWith("/agenda/")) return "event_detail";
  if (
    path.startsWith("/boeking/bevestigd") ||
    path.startsWith("/clubmember/bevestigd")
  ) {
    return "success";
  }
  if (
    path.startsWith("/boeking/geannuleerd") ||
    path.startsWith("/clubmember/geannuleerd")
  ) {
    return "failed";
  }
  if (path === "/clubmember" || path.startsWith("/clubmember/")) {
    return "clubmember";
  }
  if (path === "/join" || path.startsWith("/join/")) return "join";
  if (path === "/sunday-table" || path.startsWith("/sunday-table/")) {
    return "sunday_table";
  }
  if (path === "/girls-only" || path.startsWith("/girls-only/")) {
    return "girls_only";
  }
  if (path === "/blog" || path.startsWith("/blog/")) return "blog";
  if (path === "/account" || path.startsWith("/account/")) return "account";
  if (
    path === "/login" ||
    path.startsWith("/login/") ||
    path === "/inloggen" ||
    path.startsWith("/inloggen/")
  ) {
    return "auth";
  }
  if (
    path === "/wachtlijst" ||
    path.startsWith("/wachtlijst/") ||
    path === "/waitlist" ||
    path.startsWith("/waitlist/")
  ) {
    return "waitlist";
  }
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
  return (
    pageType === "home" ||
    pageType === "agenda" ||
    pageType === "join" ||
    pageType === "girls_only" ||
    pageType === "sunday_table" ||
    pageType === "clubmember" ||
    pageType === "waitlist"
  );
}
