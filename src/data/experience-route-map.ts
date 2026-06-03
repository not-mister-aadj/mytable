export interface RouteMapPoint {
  label: string;
  lat: number;
  lng: number;
}

const cityCenters: Record<string, { lat: number; lng: number }> = {
  Rotterdam: { lat: 51.9225, lng: 4.4792 },
  Amsterdam: { lat: 52.3731, lng: 4.8901 },
  "Den Haag": { lat: 52.0786, lng: 4.2887 },
  Utrecht: { lat: 52.0907, lng: 5.1214 },
};

/** Coordinates per experience (labels come from venue names). */
const experienceRouteCoords: Partial<
  Record<string, { lat: number; lng: number }[]>
> = {
  "sunday-wine-walk": [
    { lat: 51.9154, lng: 4.477 },
    { lat: 51.9028, lng: 4.4845 },
    { lat: 51.918, lng: 4.4898 },
    { lat: 51.9235, lng: 4.472 },
  ],
  "wine-walk-amsterdam": [
    { lat: 52.3738, lng: 4.889 },
    { lat: 52.365, lng: 4.902 },
    { lat: 52.378, lng: 4.878 },
  ],
};

function spreadAroundCenter(
  center: { lat: number; lng: number },
  labels: string[],
): RouteMapPoint[] {
  const radius = 0.012;
  return labels.map((label, index) => {
    const angle = (index / labels.length) * Math.PI * 1.6 - Math.PI / 4;
    return {
      label,
      lat: center.lat + Math.sin(angle) * radius,
      lng: center.lng + Math.cos(angle) * radius * 1.3,
    };
  });
}

export function getRouteMapPoints(
  experienceId: string,
  city: string,
  venueNames: string[],
): RouteMapPoint[] {
  const coords = experienceRouteCoords[experienceId];

  if (coords) {
    return coords.map((point, index) => ({
      lat: point.lat,
      lng: point.lng,
      label: venueNames[index] ?? `Stop ${index + 1}`,
    }));
  }

  const center = cityCenters[city] ?? cityCenters.Rotterdam;
  return spreadAroundCenter(center, venueNames);
}
