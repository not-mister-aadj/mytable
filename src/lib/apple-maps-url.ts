import type { RouteMapPoint } from "@/data/experience-route-map";

function coord(point: RouteMapPoint): string {
  return `${point.lat},${point.lng}`;
}

export function buildAppleMapsOpenUrl(points: RouteMapPoint[]): string {
  if (points.length === 0) return "https://maps.apple.com";

  if (points.length === 1) {
    return `https://maps.apple.com/?ll=${coord(points[0])}&q=${encodeURIComponent(points[0].label)}`;
  }

  const saddr = coord(points[0]);
  const daddr = points
    .slice(1)
    .map((p) => coord(p))
    .join("+to:");

  return `https://maps.apple.com/?saddr=${saddr}&daddr=${daddr}&dirflg=w`;
}
