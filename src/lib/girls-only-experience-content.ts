import type { Locale } from "@/i18n/config";
import type {
  Dictionary,
  ExperienceItem,
  ExperienceMoodContent,
  ExperiencePageLabels,
} from "@/i18n/types";
import {
  girlsOnlyExperienceLabelsEn,
  girlsOnlyTastingsMoodEn,
  girlsOnlyWineTastingCardTextEn,
  girlsOnlyWineTastingTaglineEn,
} from "@/i18n/girls-only-experience-en";
import {
  girlsOnlyExperienceLabelsNl,
  girlsOnlyTastingsMoodNl,
  girlsOnlyWineTastingCardTextNl,
  girlsOnlyWineTastingTaglineNl,
} from "@/i18n/girls-only-experience-nl";
import { getMoodContent } from "@/lib/experience-detail";
import { resolveFemaleOnly } from "@/lib/event-extras";

type GirlsOnlyExperienceRef = Pick<
  ExperienceItem,
  "femaleOnly" | "experienceType" | "mood" | "atmosphereTags"
>;

export function isGirlsOnlyExperience(experience: GirlsOnlyExperienceRef): boolean {
  return resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );
}

export function isGirlsOnlyWineTasting(experience: GirlsOnlyExperienceRef): boolean {
  if (!isGirlsOnlyExperience(experience)) return false;
  const type = experience.experienceType ?? "wine-tasting";
  return type === "wine-tasting" || experience.mood === "tastings";
}

function girlsOnlyTastingsMood(locale: Locale): Partial<ExperienceMoodContent> {
  return locale === "nl" ? girlsOnlyTastingsMoodNl : girlsOnlyTastingsMoodEn;
}

function girlsOnlyPageLabelOverrides(locale: Locale): {
  labels: Partial<ExperiencePageLabels>;
  practicalValues?: Partial<ExperiencePageLabels["practicalValues"]>;
} {
  const raw =
    locale === "nl" ? girlsOnlyExperienceLabelsNl : girlsOnlyExperienceLabelsEn;
  const { practicalValues, ...labels } = raw;
  return { labels, practicalValues };
}

export function getExperiencePageLabelsForEvent(
  dict: Dictionary,
  locale: Locale,
  experience: ExperienceItem,
): ExperiencePageLabels {
  const base = dict.experiencePage;
  if (!isGirlsOnlyWineTasting(experience)) return base;

  const { labels, practicalValues } = girlsOnlyPageLabelOverrides(locale);
  return {
    ...base,
    ...labels,
    practicalValues: {
      ...base.practicalValues,
      ...practicalValues,
    },
  };
}

export function getMoodContentForEvent(
  dict: Dictionary,
  experience: ExperienceItem,
  locale: Locale,
): ExperienceMoodContent {
  const base = getMoodContent(dict, experience.mood);
  if (!isGirlsOnlyWineTasting(experience)) return base;

  return {
    ...base,
    ...girlsOnlyTastingsMood(locale),
  };
}

export function getGirlsOnlyDefaultCardText(locale: Locale): string {
  return locale === "nl"
    ? girlsOnlyWineTastingCardTextNl
    : girlsOnlyWineTastingCardTextEn;
}

export function getGirlsOnlyDefaultTagline(locale: Locale): string {
  return locale === "nl"
    ? girlsOnlyWineTastingTaglineNl
    : girlsOnlyWineTastingTaglineEn;
}

const LEGACY_GIRLS_ONLY_CARD_TEXT = {
  nl: new Set([
    "Inclusief vier wijnen, vier bites en een gezellige tafel.",
    "Vier wijnen, vier bites en een gezellig tafel om samen van te genieten",
    "Schuif aan bij een kleine groep voor wijn, chef's specials en gezelligheid aan één tafel.",
  ]),
  en: new Set([
    "Includes four wines, four bites, and a welcoming table.",
    "Four wines, four bites, and a cozy table to enjoy together.",
    "Join a small group for wine, chef's specials, and good company at one table.",
  ]),
};

const LEGACY_GIRLS_ONLY_TAGLINES = new Set([
  "Wijnproeverij aan één tafel, girls only of gemengde groep",
  "Wine tasting at one table, girls only or mixed group",
]);

export function resolveGirlsOnlyCardText(
  cardText: string | undefined,
  locale: Locale,
): string {
  const trimmed = cardText?.trim();
  if (!trimmed) return getGirlsOnlyDefaultCardText(locale);
  if (LEGACY_GIRLS_ONLY_CARD_TEXT[locale].has(trimmed)) {
    return getGirlsOnlyDefaultCardText(locale);
  }
  return trimmed;
}

export function resolveGirlsOnlyTagline(
  tagline: string | undefined,
  locale: Locale,
): string | undefined {
  const trimmed = tagline?.trim();
  if (!trimmed || LEGACY_GIRLS_ONLY_TAGLINES.has(trimmed)) {
    return getGirlsOnlyDefaultTagline(locale);
  }
  return trimmed;
}
