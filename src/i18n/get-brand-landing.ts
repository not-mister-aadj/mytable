import type { Locale } from "@/i18n/config";
import type { BrandLandingLabels } from "@/components/brand/BrandLandingView";

export function getBrandLandingLabels(locale: Locale): BrandLandingLabels {
  if (locale === "en") {
    return {
      brand: "MyTable",
      eyebrow: "What we believe",
      belief:
        "You shouldn't need a dating app, a fixed friend group, or an occasion to have a good night out.",
      line: "Good food and good wine, shared with the right strangers, get you there faster than anything else. That's what we believe, and everything here is built around it.",
      scrollCta: "See how",
      formatsEyebrow: "How we live that out",
      formatsTitle: "Four formats, one belief",
      formatsSubtitle: "Pick what fits. Every one of them starts with the waitlist.",
      formats: [
        {
          key: "sunday_table",
          eyebrow: "Sunday Table",
          title: "New people, every month",
          body: "A table full of new people, every first Sunday. No dating agenda.",
          cta: "See Sunday Table",
        },
        {
          key: "wine_tasting",
          eyebrow: "Wine Tasting",
          title: "Four wines, one table",
          body: "Four wines with bite pairings, chosen by the wine bar.",
          cta: "See Wine Tasting",
        },
        {
          key: "wine_walk",
          eyebrow: "Wine Walk",
          title: "The city, glass by glass",
          body: "Several venues in one evening, each with wine and food.",
          cta: "See Wine Walk",
        },
        {
          key: "chefs_special",
          eyebrow: "Chef's Table",
          title: "The whole menu, together",
          body: "Sunday evening family style at a chosen restaurant.",
          cta: "See Chef's Table",
        },
      ],
      reviewsEyebrow: "From the table",
    };
  }
  return {
    brand: "MyTable",
    eyebrow: "Waar we in geloven",
    belief:
      "Je hebt geen datingapp, vaste vriendengroep of aanleiding nodig voor een goede avond.",
    line: "Goed eten en goede wijn, gedeeld met de juiste vreemden, brengt je daar sneller dan wat dan ook. Dat geloven wij, en daarom bouwen we hier alles omheen.",
    scrollCta: "Bekijk hoe",
    formatsEyebrow: "Hoe we dat doen",
    formatsTitle: "Vier formats, één geloof",
    formatsSubtitle: "Kies wat bij je past. Overal begin je met de wachtlijst.",
    formats: [
      {
        key: "sunday_table",
        eyebrow: "Sunday Table",
        title: "Nieuwe mensen, elke maand",
        body: "Een tafel vol nieuwe mensen, elke eerste zondag. Geen datingagenda.",
        cta: "Bekijk Sunday Table",
      },
      {
        key: "wine_tasting",
        eyebrow: "Wijnproeverij",
        title: "Vier wijnen, één tafel",
        body: "Vier wijnen met bite-pairings, gekozen door de wijnbar.",
        cta: "Bekijk wijnproeverij",
      },
      {
        key: "wine_walk",
        eyebrow: "Wijnwalk",
        title: "De stad, glas voor glas",
        body: "Meerdere locaties op één avond, elk met wijn en spijs.",
        cta: "Bekijk wijnwalk",
      },
      {
        key: "chefs_special",
        eyebrow: "Chef's Table",
        title: "Het hele menu, samen",
        body: "Zondagavond family style bij een uitgekozen restaurant.",
        cta: "Bekijk Chef's Table",
      },
    ],
    reviewsEyebrow: "Aan tafel",
  };
}
