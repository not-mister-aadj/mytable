import type {
  Dictionary,
  ExperienceItem,
  ExperienceMoodKey,
  ExperienceMoodContent,
} from "@/i18n/types";
import { getExperienceSlug } from "@/data/experience-slugs";

export interface EnrichedExperience extends ExperienceItem {
  slug: string;
}

export function enrichExperience(item: ExperienceItem): EnrichedExperience {
  return {
    ...item,
    slug: item.slug ?? getExperienceSlug(item.id),
  };
}

export function splitDateTime(dateTime: string): { date: string; time: string } {
  const parts = dateTime.split(" · ");
  if (parts.length >= 2) {
    return { date: parts[0], time: parts.slice(1).join(" · ") };
  }
  return { date: dateTime, time: "" };
}

export function getMoodContent(
  dict: Dictionary,
  mood: ExperienceItem["mood"],
): ExperienceMoodContent {
  const key = mood as ExperienceMoodKey;
  return dict.experiencePage.moods[key];
}

export function getExperienceTagline(
  item: ExperienceItem,
  mood: ExperienceMoodContent,
): string {
  return item.tagline ?? mood.tagline;
}
