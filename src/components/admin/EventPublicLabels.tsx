import type { Event } from "@/db/schema";
import type { ExperienceStatusKey } from "@/i18n/types";
import {
  getEventAlmostFullHint,
  getEventPublicLabels,
  type EventPublicLabel,
} from "@/lib/event-public-labels";

const statusBadgeStyles: Record<ExperienceStatusKey, string> = {
  available:
    "bg-cream text-burgundy ring-1 ring-burgundy/15",
  almostFull: "bg-gold text-wine",
  soldOut: "bg-burgundy text-cream",
  new: "bg-cream text-burgundy ring-2 ring-gold",
};

function labelClassName(label: EventPublicLabel): string {
  const base =
    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide";
  if (label.variant === "girlsOnly") {
    return `${base} bg-rose text-cream`;
  }
  if (label.variant === "tag") {
    return `${base} bg-wine/8 font-medium normal-case tracking-normal text-wine/75`;
  }
  if (label.variant === "status" && label.status) {
    return `${base} ${statusBadgeStyles[label.status]}`;
  }
  return base;
}

export function EventPublicLabels({ event }: { event: Event }) {
  const labels = getEventPublicLabels(event);
  const almostFullHint = getEventAlmostFullHint(event);

  if (labels.length === 0 && !almostFullHint) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {labels.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {labels.map((label) => (
            <span key={label.id} className={labelClassName(label)}>
              {label.text}
            </span>
          ))}
        </div>
      ) : null}
      {almostFullHint ? (
        <p className="text-xs text-wine/60">{almostFullHint}</p>
      ) : null}
    </div>
  );
}
