import type { RouteMapPoint } from "@/data/experience-route-map";

function coord(point: RouteMapPoint): string {
  return `${point.lat},${point.lng}`;
}

/** Google Maps walking directions embed (no API key required). */
export function buildGoogleMapsEmbedUrl(
  points: RouteMapPoint[],
  locale: "nl" | "en" = "nl",
): string {
  if (points.length === 0) return "";

  const hl = locale === "nl" ? "nl" : "en";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

  if (apiKey && points.length >= 2) {
    const origin = coord(points[0]);
    const destination = coord(points[points.length - 1]);
    const middle = points.slice(1, -1).map(coord).join("|");
    const params = new URLSearchParams({
      key: apiKey,
      origin,
      destination,
      mode: "walking",
    });
    if (middle) params.set("waypoints", middle);
    return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
  }

  if (points.length === 1) {
    const p = coord(points[0]);
    return `https://www.google.com/maps?q=${p}&hl=${hl}&z=15&output=embed`;
  }

  const saddr = coord(points[0]);
  const via = points
    .slice(1)
    .map((p) => coord(p))
    .join("+to:");

  return `https://www.google.com/maps?saddr=${saddr}&daddr=${via}&dirflg=w&hl=${hl}&output=embed`;
}

/** Opens the same route in the full Google Maps app/site. */
export function buildGoogleMapsOpenUrl(
  points: RouteMapPoint[],
  locale: "nl" | "en" = "nl",
): string {
  if (points.length === 0) return "https://maps.google.com";

  const hl = locale === "nl" ? "nl" : "en";

  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${coord(points[0])}&hl=${hl}`;
  }

  const path = points.map((p) => coord(p)).join("/");
  return `https://www.google.com/maps/dir/${path}/data=!4m2!4m1!3e2?hl=${hl}`;
}
