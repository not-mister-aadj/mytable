"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteMapPoint } from "@/data/experience-route-map";

const PIN_COLOR = "#D94F8B";
const ROUTE_COLOR = "#5A0F1B";

interface ExperienceRouteMapProps {
  points: RouteMapPoint[];
  caption: string;
}

function initRouteImpressionMap(
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
    interactive: false,
  });

  map.on("load", () => {
    if (points.length >= 2) {
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
          "line-opacity": 0.75,
        },
      });
    }

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
    map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
  });

  return map;
}

export function ExperienceRouteMap({ points, caption }: ExperienceRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || points.length === 0) return;

    container.replaceChildren();
    mapRef.current = initRouteImpressionMap(container, points);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div
        ref={containerRef}
        className="h-[min(52vw,420px)] min-h-[320px] w-full bg-[#f5f3ef] sm:min-h-[400px]"
        role="img"
        aria-label="Kaart met stops langs de route"
      />
      <p className="border-t border-border-subtle/60 bg-cream/90 px-4 py-2.5 text-center text-xs leading-relaxed text-wine/55">
        {caption}
      </p>
    </div>
  );
}
