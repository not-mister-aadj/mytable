"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import type { PreviewEventData } from "./event-preview";
import { buildPreviewExperience } from "./event-preview";
import { OccupancyBar } from "./OccupancyBar";
import { StatusPill, getEventListStatus } from "./StatusPill";
import type { Event } from "@/db/schema";

export function LivePreviewPanel({ data }: { data: PreviewEventData }) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const experience = buildPreviewExperience(data);
  const mockEvent = {
    workflowStatus: data.workflowStatus ?? "draft",
    spotsSold: data.spotsSold ?? 0,
    capacity: data.capacity ?? 14,
  } as Event;
  const status = getEventListStatus(mockEvent);

  return (
    <div className="sticky top-24 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-burgundy">Live preview</h3>
        <div className="flex rounded-full border border-border-subtle bg-cream p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={`rounded-full px-3 py-1 ${viewport === "desktop" ? "bg-burgundy text-cream" : "text-wine/70"}`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={`rounded-full px-3 py-1 ${viewport === "mobile" ? "bg-burgundy text-cream" : "text-wine/70"}`}
          >
            Mobile
          </button>
        </div>
      </div>

      <motion.div
        layout
        className={`mx-auto overflow-hidden rounded-2xl border border-border-subtle bg-cream shadow-lg ${
          viewport === "mobile" ? "w-[320px]" : "w-full"
        }`}
      >
        <div className="relative aspect-[4/3] w-full">
          {experience.image ? (
            <Image
              src={experience.image}
              alt={experience.experienceName}
              fill
              className="object-cover"
              sizes="400px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-wine/10 text-sm text-wine/40">
              Hero image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-wine/90 via-wine/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gold">
              {experience.category}
            </p>
            <h4 className="font-serif text-xl text-cream leading-tight">
              {experience.experienceName || "Naam tafel"}
            </h4>
            <p className="text-sm text-cream/80">{experience.city || "Stad"}</p>
            {experience.tagline ? (
              <p className="mt-1 text-xs text-cream/70 line-clamp-2">
                {experience.tagline}
              </p>
            ) : null}
            {experience.atmosphereTags && experience.atmosphereTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {experience.atmosphereTags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-gold/25 px-2 py-0.5 text-[10px] text-cream"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-xs text-wine/60">{experience.dateTime}</p>
          <div className="flex items-center justify-between gap-2">
            <StatusPill status={status} />
            <span className="font-serif text-lg text-burgundy">
              €{experience.price}
            </span>
          </div>
          <OccupancyBar
            sold={data.spotsSold ?? 0}
            capacity={data.capacity ?? 14}
            compact
          />
          {experience.customDescription ? (
            <p className="text-xs leading-relaxed text-wine/70 line-clamp-4">
              {experience.customDescription}
            </p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
