import type { Locale } from "@/i18n/config";
import type { BrandLandingLabels } from "@/components/brand/BrandLandingView";

export function getBrandLandingLabels(locale: Locale): BrandLandingLabels {
  if (locale === "en") {
    return {
      brand: "MyTable",
      tagline: "Great taste. Great company.",
      line: "Great food is better with the right company. Already someone to go with? Browse the agenda. Solo, or still looking for people to go with? Take a seat at Sunday Table on the first Sunday of every month. Then book your next culinary experiences together.",
      cta: "Go to Sunday Table",
      ctaSignedIn: "Go to Sunday Table",
      agendaCta: "Browse the agenda",
      howItWorks: {
        title: "Two paths",
        subtitle: "Pick what fits.",
        meet: {
          eyebrow: "Sunday Table",
          title: "New people",
          body: "Every first Sunday of the month. Meet new people. Company for your future culinary experiences.",
          cta: "Go to Sunday Table",
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
    tagline: "Goede smaak. Goed gezelschap.",
    line: "Goede smaak wordt leuker met de juiste mensen. Al iemand om mee te gaan? Open de agenda. Solo of nog niemand? Claim je plek op Sunday Table. Elke eerste zondag van de maand. Daarna boek je samen met je nieuwe groep culinaire ervaringen.",
    cta: "Naar Sunday Table",
    ctaSignedIn: "Naar Sunday Table",
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
