import type { Event } from "@/db/schema";
import type { ExperienceStatusKey } from "@/i18n/types";
import {
  deriveDisplayStatus,
  formatAlmostFullImageHint,
} from "@/lib/event-display";
import {
  displayAtmosphereTags,
  parseEventExtras,
  resolveFemaleOnly,
} from "@/lib/event-extras";

export type PublicLabelVariant = "girlsOnly" | "tag" | "status";

export type EventPublicLabel = {
  id: string;
  text: string;
  variant: PublicLabelVariant;
  status?: ExperienceStatusKey;
};

const STATUS_LABELS_NL: Record<ExperienceStatusKey, string> = {
  available: "Beschikbaar",
  almostFull: "Bijna vol",
  soldOut: "Uitverkocht",
  closed: "Gesloten",
  new: "Nieuw",
};

export function getEventPublicLabels(event: Event): EventPublicLabel[] {
  const extras = parseEventExtras(event.extras);
  const labels: EventPublicLabel[] = [];
  const isFemaleOnly = resolveFemaleOnly(
    event.femaleOnly,
    extras.atmosphereTags,
  );

  if (isFemaleOnly) {
    labels.push({ id: "girls-only", text: "Girls only", variant: "girlsOnly" });
  }

  for (const tag of displayAtmosphereTags(
    extras.atmosphereTags,
    event.femaleOnly,
  )) {
    labels.push({ id: `tag-${tag}`, text: tag, variant: "tag" });
  }

  const publishedAt =
    event.workflowStatus === "published" ? event.publishedAt : null;
  const displayStatus = deriveDisplayStatus(
    event.capacity,
    event.spotsSold,
    publishedAt,
    event.startsAt,
  );

  const showDisplayStatus =
    event.workflowStatus === "published" ||
    displayStatus === "soldOut" ||
    displayStatus === "almostFull" ||
    displayStatus === "closed";

  if (showDisplayStatus) {
    labels.push({
      id: `status-${displayStatus}`,
      text: STATUS_LABELS_NL[displayStatus],
      variant: "status",
      status: displayStatus,
    });
  }

  return labels;
}

export function getEventAlmostFullHint(event: Event): string | null {
  const publishedAt =
    event.workflowStatus === "published" ? event.publishedAt : null;
  const displayStatus = deriveDisplayStatus(
    event.capacity,
    event.spotsSold,
    publishedAt,
    event.startsAt,
  );
  if (displayStatus !== "almostFull") return null;
  const spotsLeft = event.capacity - event.spotsSold;
  if (spotsLeft <= 0) return null;
  return formatAlmostFullImageHint(spotsLeft, "nl");
}
