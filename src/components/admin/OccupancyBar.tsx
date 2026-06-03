"use client";

import { motion } from "framer-motion";

type OccupancyTone = "healthy" | "warning" | "full";

function getTone(sold: number, capacity: number): OccupancyTone {
  if (capacity <= 0 || sold >= capacity) return "full";
  const ratio = sold / capacity;
  if (ratio >= 0.75) return "warning";
  return "healthy";
}

const barColors: Record<OccupancyTone, string> = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  full: "bg-red-500",
};

export function OccupancyBar({
  sold,
  capacity,
  showLabel = true,
  compact = false,
}: {
  sold: number;
  capacity: number;
  showLabel?: boolean;
  compact?: boolean;
}) {
  const pct = capacity > 0 ? Math.min(100, (sold / capacity) * 100) : 0;
  const tone = getTone(sold, capacity);

  return (
    <div className={compact ? "w-full min-w-[100px]" : "w-full"}>
      <div
        className={`overflow-hidden rounded-full bg-wine/10 ${compact ? "h-1.5" : "h-2"}`}
      >
        <motion.div
          className={`h-full rounded-full ${barColors[tone]}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      {showLabel ? (
        <p className={`mt-1 text-wine/60 ${compact ? "text-xs" : "text-sm"}`}>
          {sold}/{capacity} booked
        </p>
      ) : null}
    </div>
  );
}
