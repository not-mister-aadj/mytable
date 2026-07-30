import type { ExperienceTypeSlug } from "@/lib/experience-type-definitions";

export type EventFormDefaults = {
  categoryNl: string;
  categoryEn: string;
  taglineNl: string;
  taglineEn: string;
  cardTitleNl: string;
  cardTitleEn: string;
  cardCategoryNl: string;
  cardCategoryEn: string;
  cardTextNl: string;
  cardTextEn: string;
};

const DEFAULTS: Record<ExperienceTypeSlug, EventFormDefaults> = {
  "wine-tasting": {
    categoryNl: "PROEVERIJ",
    categoryEn: "TASTING",
    taglineNl: "Wijnproeverij aan één tafel, vooraf geregeld",
    taglineEn: "Wine tasting at one table, arranged ahead",
    cardTitleNl: "",
    cardTitleEn: "",
    cardCategoryNl: "PROEVERIJ",
    cardCategoryEn: "TASTING",
    cardTextNl:
      "Inclusief vier wijnen, vier bites. Boek voor jezelf of je gezelschap.",
    cardTextEn:
      "Includes four wines and four bites. Book for yourself or your party.",
  },
  "wine-walk": {
    categoryNl: "WIJNWALK",
    categoryEn: "WINE WALK",
    taglineNl: "Een culinaire wandeling: meerdere restaurants, wijn en spijs.",
    taglineEn: "A culinary walk: several restaurants, wine and food.",
    cardTitleNl: "",
    cardTitleEn: "",
    cardCategoryNl: "WIJNWALK",
    cardCategoryEn: "WINE WALK",
    cardTextNl:
      "Wandel langs geselecteerde restaurants, proef onderweg wijn en bites met je eigen gezelschap.",
    cardTextEn:
      "Walk past selected restaurants and taste wine and bites along the way with your own party.",
  },
  "chefs-special": {
    categoryNl: "CHEF'S SPECIAL",
    categoryEn: "CHEF'S SPECIAL",
    taglineNl: "Het beste van het restaurant, family style.",
    taglineEn: "The best of the restaurant, family style.",
    cardTitleNl: "",
    cardTitleEn: "",
    cardCategoryNl: "CHEF'S SPECIAL",
    cardCategoryEn: "CHEF'S SPECIAL",
    cardTextNl:
      "Meerdere gangen samengesteld door de chef, gedeeld met je gezelschap.",
    cardTextEn:
      "Multiple courses curated by the chef, shared with your party.",
  },
};

export function getEventFormDefaults(
  typeSlug: ExperienceTypeSlug,
): EventFormDefaults {
  return DEFAULTS[typeSlug];
}

export function getVenueSectionLabels(typeSlug: ExperienceTypeSlug, locale: "nl" | "en") {
  if (typeSlug === "wine-walk") {
    return locale === "nl"
      ? {
          title: "De restaurants in deze route",
          subtitle:
            "Je bezoekt meerdere zorgvuldig gekozen plekken. Op rustig tempo van restaurant naar restaurant, met wijn en spijs bij elke stop.",
        }
      : {
          title: "The restaurants on this route",
          subtitle:
            "You visit several carefully chosen spots. At a relaxed pace from restaurant to restaurant, with wine and food at every stop.",
        };
  }
  return locale === "nl"
    ? {
        title: "De restaurants",
        subtitle:
          typeSlug === "chefs-special"
            ? "Voor Chef's Table werken we samen met restaurants waar je family style het beste van de keuken proeft: meerdere voor-, hoofd- en nagerechten, gedeeld met je gezelschap."
            : "Bij een partnerrestaurant aan tafel: specials van de chef, met wijn en spijs op één plek.",
      }
    : {
        title: "The restaurants",
        subtitle:
          typeSlug === "chefs-special"
            ? "For Chef's Table we partner with restaurants where you taste the best of the kitchen family style: multiple starters, mains and desserts, shared with your party."
            : "At a partner restaurant: chef specials with wine and food in one place.",
      };
}
