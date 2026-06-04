import type { Event } from "@/db/schema";
import type { ExperienceTypeSlug } from "@/lib/experience-type-definitions";
import type { EventExtras } from "@/lib/event-extras";
import { getEventFormDefaults } from "@/lib/experience-template-defaults";

export type EventEditorUiFlags = {
  customCardTitle: boolean;
  customHeroTitle: boolean;
  separateHeroImage: boolean;
  customTagline: boolean;
  customCardText: boolean;
};

export function detectEditorUiFlags(
  extras: EventExtras,
  event: Event | undefined,
  type: ExperienceTypeSlug,
  taglineNl: string,
  taglineEn: string,
): EventEditorUiFlags {
  const d = getEventFormDefaults(type);
  const cardUrl = extras.cardImage?.url ?? extras.cardImageUrl ?? "";
  const heroUrl = extras.heroImage?.url ?? event?.imageUrl ?? "";

  return {
    customCardTitle: Boolean(
      extras.cardTitleNl?.trim() || extras.cardTitleEn?.trim(),
    ),
    customHeroTitle: Boolean(
      extras.heroTitleNl?.trim() || extras.heroTitleEn?.trim(),
    ),
    separateHeroImage: Boolean(
      extras.heroImage?.url && heroUrl && cardUrl && heroUrl !== cardUrl,
    ),
    customTagline: Boolean(
      (taglineNl.trim() && taglineNl !== d.taglineNl) ||
        (taglineEn.trim() && taglineEn !== d.taglineEn),
    ),
    customCardText: Boolean(
      (extras.cardTextNl?.trim() && extras.cardTextNl !== d.cardTextNl) ||
        (extras.cardTextEn?.trim() && extras.cardTextEn !== d.cardTextEn),
    ),
  };
}

export function normalizeEventExtras(
  extras: EventExtras,
  flags: EventEditorUiFlags,
): EventExtras {
  const next: EventExtras = { ...extras };

  if (!flags.customCardTitle) {
    delete next.cardTitleNl;
    delete next.cardTitleEn;
  }
  if (!flags.customHeroTitle) {
    delete next.heroTitleNl;
    delete next.heroTitleEn;
  }
  if (!flags.separateHeroImage) {
    delete next.heroImage;
  }

  return next;
}

export function effectiveTaglines(
  type: ExperienceTypeSlug,
  taglineNl: string,
  taglineEn: string,
  customTagline: boolean,
) {
  const d = getEventFormDefaults(type);
  return {
    taglineNl: customTagline ? taglineNl : d.taglineNl,
    taglineEn: customTagline ? taglineEn : d.taglineEn,
  };
}

export function effectiveImageUrl(
  extras: EventExtras,
  flags: Pick<EventEditorUiFlags, "separateHeroImage">,
  fallbackUrl: string,
): string {
  if (flags.separateHeroImage && extras.heroImage?.url) {
    return extras.heroImage.url;
  }
  return extras.cardImage?.url ?? extras.cardImageUrl ?? fallbackUrl;
}
