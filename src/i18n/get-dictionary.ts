import type { Locale } from "./config";
import type { Dictionary } from "./types";
import { en } from "./dictionaries/en";
import { nl } from "./dictionaries/nl";
import { getAgendaItems } from "@/lib/experiences";

const dictionaries: Record<Locale, Dictionary> = { nl, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Dictionary with live agenda/experience items from DB or catalog */
export async function getDictionaryWithAgenda(
  locale: Locale,
): Promise<Dictionary> {
  const dict = getDictionary(locale);
  const items = await getAgendaItems(locale);
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
