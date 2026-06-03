"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteMapPoint } from "@/data/experience-route-map";
import { buildAppleMapsOpenUrl } from "@/lib/apple-maps-url";
import type { Locale } from "@/i18n/config";

const MAPKIT_SCRIPT = "https://cdn.apple-mapkit.com/mk/5.78.73/mapkit.js";
const PIN_COLOR = "#D94F8B";
const ROUTE_COLOR = "#5A0F1B";

interface ExperienceRouteMapProps {
  points: RouteMapPoint[];
  locale?: Locale;
  openMapsLabel: string;
  mapSetupHint: string;
}

function loadMapKitScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();

  if (window.mapkit?.loadedLibraries?.()?.includes("map")) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${MAPKIT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }

    window.initMapKit = () => resolve();

    const script = document.createElement("script");
    script.src = MAPKIT_SCRIPT;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.callback = "initMapKit";
    script.dataset.libraries = "map,annotations";
    script.onerror = () => reject(new Error("MapKit script failed"));
    document.head.appendChild(script);
  });
}

function initMapKitMap(
  container: HTMLDivElement,
  points: RouteMapPoint[],
  locale: Locale,
): mapkit.Map | null {
  if (!window.mapkit) return null;

  const coordinates = points.map(
    (p) => new mapkit.Coordinate(p.lat, p.lng),
  );

  const map = new mapkit.Map(container, {
    mapType: mapkit.Map.MapTypes.standard,
    showsCompass: "visible",
    showsZoomControl: true,
    showsMapTypeControl: true,
    isRotationEnabled: false,
  });

  const annotations = points.map((point, index) => {
    return new mapkit.MarkerAnnotation(
      new mapkit.Coordinate(point.lat, point.lng),
      {
        color: PIN_COLOR,
        glyphText: String(index + 1),
        title: point.label,
        displayPriority: 1000 - index,
      },
    );
  });

  map.addAnnotations(annotations);

  if (coordinates.length >= 2) {
    const style = new mapkit.Style({
      strokeColor: ROUTE_COLOR,
      lineWidth: 3,
      lineDash: [8, 6],
    });
    const route = new mapkit.PolylineOverlay(coordinates, { style });
    map.addOverlay(route);
    map.showItems([...annotations, route], {
      animate: false,
      padding: { top: 48, right: 48, bottom: 48, left: 48 },
    });
  } else if (annotations[0]) {
    map.showItems(annotations, {
      animate: false,
      padding: { top: 48, right: 48, bottom: 48, left: 48 },
    });
  }

  void locale;
  return map;
}

function initMapLibreFallback(
  container: HTMLDivElement,
  points: RouteMapPoint[],
): maplibregl.Map {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);

  const map = new maplibregl.Map({
    container,
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    center: [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ],
    zoom: 13,
    attributionControl: { compact: true },
    scrollZoom: false,
  });

  map.on("load", () => {
    map.addSource("stops", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: points.map((point, index) => ({
          type: "Feature" as const,
          properties: { label: point.label, index: index + 1 },
          geometry: {
            type: "Point" as const,
            coordinates: [point.lng, point.lat] as [number, number],
          },
        })),
      },
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: points.map((p) => [p.lng, p.lat]),
          },
        },
      },
      paint: {
        "line-color": ROUTE_COLOR,
        "line-width": 3,
        "line-dasharray": [2, 2],
      },
    });

    map.addLayer({
      id: "stop-circles",
      type: "circle",
      source: "stops",
      paint: {
        "circle-radius": 18,
        "circle-color": PIN_COLOR,
        "circle-stroke-width": 3,
        "circle-stroke-color": "#ffffff",
      },
    });

    map.addLayer({
      id: "stop-labels",
      type: "symbol",
      source: "stops",
      layout: {
        "text-field": ["to-string", ["get", "index"]],
        "text-size": 13,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    const bounds = new maplibregl.LngLatBounds();
    points.forEach((p) => bounds.extend([p.lng, p.lat]));
    map.fitBounds(bounds, { padding: 56, maxZoom: 15 });
  });

  return map;
}

export function ExperienceRouteMap({
  points,
  locale = "nl",
  openMapsLabel,
  mapSetupHint,
}: ExperienceRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapkit.Map | maplibregl.Map | null>(null);
  const [provider, setProvider] = useState<"mapkit" | "fallback" | "loading">(
    "loading",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length === 0) return;

    let cancelled = false;

    async function setup() {
      if (!container) return;

      const tokenRes = await fetch("/api/mapkit-token");

      if (tokenRes.ok && !cancelled) {
        try {
          await loadMapKitScript();
          if (cancelled || !window.mapkit) throw new Error("no mapkit");

          await new Promise<void>((resolve, reject) => {
            window.mapkit!.init({
              language: locale,
              authorizationCallback: (done) => {
                fetch("/api/mapkit-token")
                  .then((res) => {
                    if (!res.ok) throw new Error("token unavailable");
                    return res.text();
                  })
                  .then((token) => {
                    done(token);
                    resolve();
                  })
                  .catch(reject);
              },
            });
          });

          if (cancelled) return;

          cleanupMap();
          const map = initMapKitMap(container, points, locale);
          if (map) {
            mapRef.current = map;
            setProvider("mapkit");
            return;
          }
        } catch {
          /* fall through */
        }
      }

      if (cancelled) return;

      cleanupMap();
      container.replaceChildren();
      mapRef.current = initMapLibreFallback(container, points);
      setProvider("fallback");
    }

    function cleanupMap() {
      const current = mapRef.current;
      if (!current) return;
      if ("destroy" in current && typeof current.destroy === "function") {
        current.destroy();
      } else if ("remove" in current && typeof current.remove === "function") {
        current.remove();
      }
      mapRef.current = null;
    }

    void setup();

    return () => {
      cancelled = true;
      cleanupMap();
    };
  }, [points, locale]);

  if (points.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div
        ref={containerRef}
        className="h-[min(52vw,420px)] min-h-[320px] w-full bg-[#f5f3ef] sm:min-h-[400px]"
        role="img"
        aria-label="Kaart met routestops"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle/60 bg-cream/90 px-4 py-2.5 text-xs text-wine/55">
        <span>
          {provider === "mapkit" ? (
            <span className="inline-flex items-center gap-1.5">
              <AppleMapsMark />
              Apple Kaarten
            </span>
          ) : provider === "fallback" ? (
            <span title={mapSetupHint}>{mapSetupHint}</span>
          ) : (
            "Kaart laden…"
          )}
        </span>
        <a
          href={buildAppleMapsOpenUrl(points)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-burgundy underline-offset-2 hover:underline"
        >
          {openMapsLabel}
        </a>
      </div>
    </div>
  );
}

function AppleMapsMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2C8.5 2 6 4.8 6 8.2c0 4.5 6 13.8 6 13.8s6-9.3 6-13.8C18 4.8 15.5 2 12 2zm0 10.5a3.3 3.3 0 110-6.6 3.3 3.3 0 010 6.6z" />
    </svg>
  );
}
