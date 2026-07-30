import type { Locale } from "@/i18n/config";
import type { BrandLandingLabels } from "@/components/brand/BrandLandingView";

export function getBrandLandingLabels(locale: Locale): BrandLandingLabels {
  if (locale === "en") {
    return {
      brand: "MyTable",
      tagline:
        "Meet new people at Sunday Table, or book culinary experiences right away with your group or date.",
      line: "Good taste is better with the right people. Already have a group? Open the agenda. Solo or still looking? Claim your seat at Sunday Table. Every first Sunday of the month. Then book culinary experiences together with your new group.",
      cta: "Sunday Table",
      ctaSignedIn: "Continue",
      agendaCta: "Open the agenda",
      howItWorks: {
        title: "Two paths",
        subtitle: "Pick what fits.",
        meet: {
          eyebrow: "Sunday Table",
          title: "New people",
          body: "Every first Sunday of the month. Meet new people. Company for your future culinary experiences.",
          cta: "Start the quiz",
        },
        culinary: {
          eyebrow: "Agenda",
          title: "Culinary experiences",
          body: "Wine Walks, Food Walks, Chef’s Table. Book with your group.",
          cta: "Go to agenda",
        },
      },
      reviewsEyebrow: "From the table",
    };
  }
  return {
    brand: "MyTable",
    tagline:
      "Nieuwe mensen ontmoeten aan Sunday Table, of meteen culinaire ervaringen boeken met je groep of date.",
    line: "Goede smaak wordt leuker met de juiste mensen. Al een groep? Open de agenda. Solo of nog niemand? Claim je plek op Sunday Table. Elke eerste zondag van de maand. Daarna boek je samen met je nieuwe groep culinaire ervaringen.",
    cta: "Sunday Table",
    ctaSignedIn: "Verder",
    agendaCta: "Open de agenda",
    howItWorks: {
      title: "Twee paden",
      subtitle: "Kies wat past.",
      meet: {
        eyebrow: "Sunday Table",
        title: "Nieuwe mensen",
        body: "Elke eerste zondag van de maand. Nieuwe mensen leren kennen. Gezelschap voor je toekomstige culinaire ervaringen.",
        cta: "Naar Sunday Table",
      },
      culinary: {
        eyebrow: "Agenda",
        title: "Culinaire ervaringen",
        body: "Wine Walks, Food Walks, Chef’s Table. Boek met je groep.",
        cta: "Ga naar agenda",
      },
    },
    reviewsEyebrow: "Aan tafel",
  };
}
