import type { Locale } from "@/i18n/config";
import {
  girlsOnlySocialGalleryImages,
  type GirlsOnlySocialImage,
} from "@/data/girls-only-media";

/** Real photos from an actual "Proef bij Platenburg" wine tasting evening —
 * used for the format landing pages' hero gallery and proof section, which
 * are shown to a mixed-gender audience. Kept separate from
 * `girls-only-media.ts`, whose pool is curated for the girls-only city pages
 * specifically and shouldn't show men. */
const recentEventImages: readonly GirlsOnlySocialImage[] = [
  {
    src: "/girls-only/wine-tasting-toast.jpg",
    alt: {
      nl: "Een volle tafel proost tijdens een MyTable wijnproeverij",
      en: "A full table raises a toast during a MyTable wine tasting",
    },
  },
  {
    src: "/girls-only/wine-tasting-conversation.jpg",
    alt: {
      nl: "Gesprek en gelach aan tafel tijdens een MyTable wijnproeverij",
      en: "Conversation and laughter at the table during a MyTable wine tasting",
    },
  },
  {
    src: "/girls-only/wine-tasting-presenter.jpg",
    alt: {
      nl: "De gastvrouw stelt de wijnen voor tijdens een MyTable wijnproeverij",
      en: "The host introduces the wines during a MyTable wine tasting",
    },
  },
] as const;

const formatProofGalleryImages = [
  ...recentEventImages,
  ...girlsOnlySocialGalleryImages,
] as const satisfies readonly GirlsOnlySocialImage[];

export function getFormatProofSlideshowImages(locale: Locale) {
  const lang = locale === "en" ? "en" : "nl";
  return formatProofGalleryImages.map((image) => ({
    src: image.src,
    alt: image.alt[lang],
  }));
}
