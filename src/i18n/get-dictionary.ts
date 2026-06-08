import type { Locale } from "./config";
import type { Dictionary } from "./types";
import { en } from "./dictionaries/en";
import { nl } from "./dictionaries/nl";
import {
  getAgendaExperiences,
  getLandingExperiences,
} from "@/lib/experiences";

const dictionaries: Record<Locale, Dictionary> = { nl, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

function withExperienceItems(
  locale: Locale,
  items: Awaited<ReturnType<typeof getLandingExperiences>>,
): Dictionary {
  const dict = getDictionary(locale);
  return {
    ...dict,
    experiences: {
      ...dict.experiences,
      items,
    },
    agenda: {
      ...dict.agenda,
      items,
    },
  };
}

/** Homepage: only events open for booking (not closed). */
export async function getDictionaryWithLanding(
  locale: Locale,
): Promise<Dictionary> {
  const items = await getLandingExperiences(locale);
  return withExperienceItems(locale, items);
}

/** Agenda page: includes closed events up to 7 days after start. */
export async function getDictionaryWithAgenda(
  locale: Locale,
): Promise<Dictionary> {
  const items = await getAgendaExperiences(locale);
  return withExperienceItems(locale, items);
}
