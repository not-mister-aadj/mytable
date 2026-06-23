import type { Locale } from "@/i18n/config";

export type GirlsOnlySocialImage = {
  src: string;
  alt: {
    nl: string;
    en: string;
  };
};

const galleryImages = [
  {
    src: "/girls-only/crowd-evening.jpg",
    alt: {
      nl: "Groep vrouwen ontmoet elkaar in een gezellige setting",
      en: "Group of women meeting in a warm social setting",
    },
  },
  {
    src: "/girls-only/paint-sip-unicorn.jpg",
    alt: {
      nl: "Twee vrouwen genieten van wijn tijdens een paint and sip avond",
      en: "Two women enjoying wine during a paint and sip evening",
    },
  },
  {
    src: "/girls-only/smiling-glasses.jpg",
    alt: {
      nl: "Vrouwen lachen en praten tijdens een girls-only avond uit",
      en: "Women laughing and chatting during a girls-only night out",
    },
  },
  {
    src: "/girls-only/table-group.jpg",
    alt: {
      nl: "Groep vrouwen aan tafel met wijn en cocktails",
      en: "Group of women at a table with wine and cocktails",
    },
  },
  {
    src: "/girls-only/wine-moment.jpg",
    alt: {
      nl: "Vrouw geniet van een glas wijn in gezelschap",
      en: "Woman enjoying a glass of wine with company",
    },
  },
  {
    src: "/girls-only/connecting.jpg",
    alt: {
      nl: "Vrouwen in gesprek tijdens een gezellige avond",
      en: "Women in conversation during a social evening",
    },
  },
  {
    src: "/girls-only/duo-table.jpg",
    alt: {
      nl: "Twee vrouwen glimlachen aan tafel tijdens een avond uit",
      en: "Two women smiling at a table on a night out",
    },
  },
  {
    src: "/girls-only/laughing-bar.jpg",
    alt: {
      nl: "Vrouwen lachen samen aan de bar",
      en: "Women laughing together at the bar",
    },
  },
  {
    src: "/girls-only/phone-moment.jpg",
    alt: {
      nl: "Vrouwen delen een moment en kijken samen op een telefoon",
      en: "Women sharing a moment looking at a phone together",
    },
  },
  {
    src: "/girls-only/group-bar.jpg",
    alt: {
      nl: "Groep vrouwen in gesprek in een bar",
      en: "Group of women chatting in a bar",
    },
  },
] as const satisfies readonly GirlsOnlySocialImage[];

export const girlsOnlySocialGalleryImages = galleryImages;

export function getGirlsOnlyHeroSlideshowImages(locale: Locale) {
  const lang = locale === "en" ? "en" : "nl";
  return girlsOnlySocialGalleryImages.map((image) => ({
    src: image.src,
    alt: image.alt[lang],
  }));
}
