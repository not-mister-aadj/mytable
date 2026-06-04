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
    taglineNl: "Wijnproeverij aan één tafel, girls only of gemengde groep",
    taglineEn: "Wine tasting at one table, girls only or mixed group",
    cardTitleNl: "",
    cardTitleEn: "",
    cardCategoryNl: "PROEVERIJ",
    cardCategoryEn: "TASTING",
    cardTextNl:
      "Schuif aan bij een kleine groep voor wijn, chef's specials en gezelligheid aan één tafel.",
    cardTextEn:
      "Join a small group for wine, chef's specials, and good company at one table.",
  },
  "wine-walk": {
    categoryNl: "WIJNWALK",
    categoryEn: "WINE WALK",
    taglineNl: "Een ontspannen wandeling vol wijn, mooie plekken en goed gezelschap.",
    taglineEn: "A relaxed walk full of wine, great spots, and good company.",
    cardTitleNl: "",
    cardTitleEn: "",
    cardCategoryNl: "WIJNWALK",
    cardCategoryEn: "WINE WALK",
    cardTextNl:
      "Wandel langs geselecteerde restaurants en wijnbars, proef onderweg wijn en bites, en ontmoet nieuwe mensen in de stad.",
    cardTextEn:
      "Walk past selected restaurants and wine bars, taste wine and bites along the way, and meet new people in the city.",
  },
  "chefs-special": {
    categoryNl: "CHEF'S SPECIAL",
    categoryEn: "CHEF'S SPECIAL",
    taglineNl: "Een bijzondere avond aan tafel, samengesteld door de chef.",
    taglineEn: "A special evening at the table, curated by the chef.",
    cardTitleNl: "",
    cardTitleEn: "",
    cardCategoryNl: "CHEF'S SPECIAL",
    cardCategoryEn: "CHEF'S SPECIAL",
    cardTextNl:
      "Schuif aan bij een restaurant dat speciaal voor MyTable een menu of meerdere gangen samenstelt.",
    cardTextEn:
      "Join a restaurant that puts together a menu or multiple courses especially for MyTable.",
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
          title: "Een wandeling langs deze restaurants",
          subtitle:
            "Tijdens deze Wijnwalk ontdek je meerdere zorgvuldig gekozen plekken in de stad. Je wandelt op rustig tempo van locatie naar locatie en schuift onderweg aan voor wijn, bites en goede gesprekken.",
        }
      : {
          title: "A walk past these restaurants",
          subtitle:
            "On this wine walk you discover several carefully chosen spots in the city. You walk at a relaxed pace from venue to venue and stop for wine, bites, and good conversation.",
        };
  }
  return locale === "nl"
    ? {
        title: "Waar je aan tafel schuift",
        subtitle:
          typeSlug === "chefs-special"
            ? "Voor Chef's Special werken we samen met restaurants die iets bijzonders willen serveren. Je schuift aan bij een geselecteerde plek waar de chef of het team een menu samenstelt voor de avond."
            : "Bezoek een van onze partnerrestaurants. Superleuk aan tafel: de chef bereidt specials die je verassen, met wijn en spijs op één plek.",
      }
    : {
        title: "Where you take your seat",
        subtitle:
          typeSlug === "chefs-special"
            ? "For Chef's Special we work with restaurants that want to serve something special. You join a selected venue where the chef or team puts together a menu for the evening."
            : "Visit one of our partner restaurants. Great fun at the table: the chef prepares specials to surprise you, with wine and food in one place.",
      };
}
