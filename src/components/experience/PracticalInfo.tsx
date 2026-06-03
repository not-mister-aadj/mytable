"use client";

import { motion } from "framer-motion";
import { splitDateTime } from "@/lib/experience-detail";
import type { ExperienceMoodContent } from "@/i18n/types";
import type { Dictionary, ExperienceItem } from "@/i18n/types";

interface PracticalInfoProps {
  title: string;
  experience: ExperienceItem;
  mood: ExperienceMoodContent;
  labels: Dictionary["experiencePage"];
}

type IconKey =
  | "clock"
  | "duration"
  | "city"
  | "included"
  | "diet"
  | "solo"
  | "cancel"
  | "walk"
  | "weather"
  | "arrival"
  | "route"
  | "group";

function PracticalIcon({ type }: { type: IconKey }) {
  const className = "h-5 w-5 shrink-0 text-gold";
  switch (type) {
    case "clock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "walk":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M13 5l2 2-3 8 4 2-2 4M9 20l-2-6 4-3-2-5" />
        </svg>
      );
    case "weather":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M7 14a4 4 0 108-1.5M16 18a3 3 0 10-.5-6" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      );
  }
}

export function PracticalInfo({
  title,
  experience,
  mood,
  labels,
}: PracticalInfoProps) {
  const { time } = splitDateTime(experience.dateTime);

  const rows: { icon: IconKey; label: string; value: string }[] = [
    { icon: "clock", label: labels.practicalLabels.startTime, value: time || "n.v.t." },
    { icon: "duration", label: labels.practicalLabels.duration, value: mood.duration },
    { icon: "city", label: labels.practicalLabels.city, value: experience.city },
    { icon: "included", label: labels.practicalLabels.included, value: mood.included },
    { icon: "arrival", label: labels.practicalLabels.arrival, value: labels.practicalValues.arrival },
    { icon: "group", label: labels.practicalLabels.groupSize, value: labels.practicalValues.groupSize },
    { icon: "diet", label: labels.practicalLabels.dietary, value: labels.practicalValues.dietary },
    { icon: "solo", label: labels.practicalLabels.solo, value: labels.practicalValues.solo },
    { icon: "cancel", label: labels.practicalLabels.cancellation, value: labels.practicalValues.cancellation },
    { icon: "weather", label: labels.practicalLabels.weather, value: labels.practicalValues.weather },
    { icon: "route", label: labels.practicalLabels.routeReveal, value: labels.practicalValues.routeReveal },
    ...(mood.walkingDistance
      ? [
          {
            icon: "walk" as const,
            label: labels.practicalLabels.walking,
            value: mood.walkingDistance,
          },
        ]
      : []),
  ];

  return (
    <section className="border-t border-border-subtle py-14 sm:py-20">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl"
      >
        {title}
      </motion.h2>
      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        {rows.map((row, index) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ delay: index * 0.04 }}
            className="flex gap-4 rounded-2xl border border-border-subtle bg-beige/60 px-5 py-4"
          >
            <PracticalIcon type={row.icon} />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-gold">
                {row.label}
              </dt>
              <dd className="mt-2 text-base leading-relaxed text-wine/80">
                {row.value}
              </dd>
            </div>
          </motion.div>
        ))}
      </dl>
    </section>
  );
}
