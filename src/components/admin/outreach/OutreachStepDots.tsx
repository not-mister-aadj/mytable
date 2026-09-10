"use client";

import type { OutreachStepState } from "@/lib/outreach/prospects-data";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function describe(state: OutreachStepState | undefined, step: number): string {
  if (!state) return `Mail ${step} — nog niet verstuurd`;
  if (state.failed) return `Mail ${step} — verzenden mislukt`;
  if (state.bouncedAt) return `Mail ${step} — bounce op ${formatDate(state.bouncedAt)}`;
  const parts = [`verstuurd ${formatDate(state.sentAt)}`];
  if (state.deliveredAt) parts.push("afgeleverd");
  if (state.openedAt) {
    parts.push(`${state.openCount}× geopend`);
  } else if (state.deliveredAt) {
    parts.push("nog niet geopend");
  }
  if (state.clickCount > 0) parts.push(`${state.clickCount}× geklikt`);
  return `Mail ${step} — ${parts.join(" · ")}`;
}

function dotClass(state: OutreachStepState | undefined): string {
  if (!state) return "border-wine/20 bg-transparent";
  if (state.failed || state.bouncedAt) return "border-red-500/50 bg-red-500/40";
  if (state.openedAt) return "border-burgundy bg-burgundy";
  if (state.deliveredAt) return "border-burgundy/50 bg-burgundy/40";
  return "border-wine/35 bg-wine/20";
}

/**
 * One dot per sequence mail: empty = not sent, faint = sent, half = delivered,
 * solid = opened, red = bounced. The whole progress of a venue in 40 pixels.
 */
export function OutreachStepDots({
  steps,
  sequenceLength,
}: {
  steps: OutreachStepState[];
  sequenceLength: number;
}) {
  const total = Math.max(sequenceLength, steps.length, 1);
  const byStep = new Map(steps.map((state) => [state.step, state]));

  return (
    <span className="inline-flex shrink-0 items-center gap-1" aria-hidden={false}>
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const state = byStep.get(step);
        return (
          <span
            key={step}
            title={describe(state, step)}
            aria-label={describe(state, step)}
            className={`h-2.5 w-2.5 rounded-full border ${dotClass(state)}`}
          />
        );
      })}
    </span>
  );
}
