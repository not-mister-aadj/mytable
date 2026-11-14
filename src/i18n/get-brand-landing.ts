import type { Locale } from "@/i18n/config";
import type { BrandLandingLabels } from "@/components/brand/BrandLandingView";

export function getBrandLandingLabels(locale: Locale): BrandLandingLabels {
  if (locale === "en") {
    return {
      brand: "MyTable",
      earlyAccessBadge: "Be one of the first at the table",
      belief: "Taste is better shared.",
      line: "Monthly tables in Rotterdam, The Hague, Utrecht, Amsterdam and Eindhoven. A lovely wine spot, a good glass and four to six friendly people at your table.",
      whyHeadline: "We started this because we missed it ourselves.",
      whyParagraphs: [
        "Discovering new restaurants and wine bars around the city. Good idea, but figuring out which place is actually worth it takes time. And then finding someone who's up for it.",
        "So we wanted a table where that's already sorted. A good spot, good wine, and people just as up for it as you.",
        "So we're making that table ourselves. Every month, a new place.",
      ],
      soldOutEyebrow: "Coming Sundays",
      soldOutWord: "Full",
      soldOutNext: "Next tables: by invitation",
      fullHeadline: "Our tables fill up fast.",
      stepsEyebrow: "How you get in",
      steps: [
        "Join the waitlist.",
        "You get an invitation to your table.",
        "Take your seat.",
      ],
      reviewsEyebrow: "From the table",
      finalCapture: {
        eyebrow: "Next step",
        headline: "Be there when your table forms.",
        body: "You'll only hear from us when a table is actually ready for you. No weekly emails, no spam. Just an invite, the moment it's time.",
        submit: "Join the waitlist",
        privacyNote: "Free. No spam.",
      },
    };
  }
  return {
    brand: "MyTable",
    earlyAccessBadge: "Wees een van de eersten aan tafel",
    belief: "Smaak is leuker gedeeld.",
    line: "Maandelijkse tafels in Rotterdam, Den Haag, Utrecht, Amsterdam en Eindhoven. Een leuke wijnlocatie, een goed glas en vier tot zes gezellige mensen aan tafel.",
    whyHeadline: "We begonnen dit omdat we het zelf misten.",
    whyParagraphs: [
      "Nieuwe restaurants en wijnbars ontdekken in de stad. Leuk idee, maar zelf uitzoeken welke plek het echt waard is kost tijd. En dan nog iemand vinden die zin heeft om mee te gaan.",
      "Dus wilden we een tafel waar dat al voor je geregeld is. Een goede plek, goede wijn, en mensen die er net zoveel zin in hebben als jij.",
      "Dus die tafel maken we nu zelf. Elke maand, een nieuwe plek.",
    ],
    soldOutEyebrow: "Komende zondagen",
    soldOutWord: "Vol",
    soldOutNext: "Volgende tafels: op uitnodiging",
    fullHeadline: "Onze tafels zitten snel vol.",
    stepsEyebrow: "Zo kom je aan tafel",
    steps: [
      "Zet je op de wachtlijst.",
      "Je krijgt een uitnodiging voor je tafel.",
      "Schuif aan.",
    ],
    reviewsEyebrow: "Aan tafel",
    finalCapture: {
      eyebrow: "Volgende stap",
      headline: "Wees erbij zodra jouw tafel vormt.",
      body: "Je hoort pas van ons zodra er echt een tafel voor je klaarstaat. Geen wekelijkse mail, geen spam. Gewoon een uitnodiging, op het moment dat het zover is.",
      submit: "Zet me op de wachtlijst",
      privacyNote: "Gratis. Geen spam.",
    },
  };
}
