import type { Locale } from "./config";
import type { Dictionary } from "./types";
import { en } from "./dictionaries/en";
import { nl } from "./dictionaries/nl";

const dictionaries: Record<Locale, Dictionary> = { nl, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
