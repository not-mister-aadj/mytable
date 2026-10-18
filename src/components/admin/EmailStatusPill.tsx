import type { EmailDeliveryState } from "@/lib/email/email-log";

const STATES: Record<string, { label: string; className: string }> = {
  delivered: { label: "Afgeleverd", className: "bg-cream text-wine/70 ring-border-subtle" },
  opened: { label: "Geopend", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  clicked: { label: "Geklikt", className: "bg-emerald-100 text-emerald-900 ring-emerald-300" },
  suppressed: { label: "Tegengehouden", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  bounced: { label: "Bounce", className: "bg-red-50 text-red-800 ring-red-200" },
  complained: { label: "Spam", className: "bg-red-100 text-red-900 ring-red-300" },
};

/** Label for what happened to a mail after sending ("Geopend 3×"). */
export function emailStatusLabel(state: EmailDeliveryState): string {
  const base = STATES[state.lastEvent ?? ""]?.label ?? "Verstuurd";
  if (state.lastEvent === "opened" && state.openCount > 1) return `${base} ${state.openCount}×`;
  if (state.lastEvent === "clicked" && state.clickCount > 1) return `${base} ${state.clickCount}×`;
  return base;
}

export function EmailStatusPill({ state }: { state: EmailDeliveryState }) {
  const style = STATES[state.lastEvent ?? ""]?.className ?? "bg-cream text-wine/50 ring-border-subtle";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {emailStatusLabel(state)}
    </span>
  );
}
