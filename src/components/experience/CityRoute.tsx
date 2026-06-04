"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { RouteMapPoint } from "@/data/experience-route-map";

const ExperienceRouteMap = dynamic(
  () =>
    import("./ExperienceRouteMap").then((mod) => mod.ExperienceRouteMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[min(52vw,420px)] min-h-[280px] items-center justify-center bg-wine/5 text-sm text-wine/45"
        aria-hidden
      >
        Kaart laden…
      </div>
    ),
  },
);

interface CityRouteProps {
  mapEyebrow: string;
  mapTitle: string;
  subtitle: string;
  openMapsLabel: string;
  mapSetupHint: string;
  city: string;
  points: RouteMapPoint[];
  locale: Locale;
}

export function CityRoute({
  mapEyebrow,
  mapTitle,
  subtitle,
  openMapsLabel,
  mapSetupHint,
  city,
  points,
  locale,
}: CityRouteProps) {
  const heading = mapTitle.replace("{city}", city);

  return (
    <section className="py-14 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
            {mapEyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl lg:text-[2.75rem]">
            {heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-wine/70 sm:text-lg">
            {subtitle}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[1.75rem] border border-border-subtle/80 shadow-[0_24px_60px_rgba(43,13,18,0.08)]">
          <ExperienceRouteMap
            points={points}
            locale={locale}
            openMapsLabel={openMapsLabel}
            mapSetupHint={mapSetupHint}
          />
        </div>

        <ol className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-3">
          {points.map((point, index) => (
            <li
              key={`${point.label}-${index}`}
              className="flex items-center gap-2.5 text-sm text-wine/75"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-cream shadow-sm"
                style={{ backgroundColor: "#D94F8B" }}
              >
                {index + 1}
              </span>
              {point.label}
            </li>
          ))}
        </ol>
      </motion.div>
    </section>
  );
}
