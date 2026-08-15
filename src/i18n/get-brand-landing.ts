import type { Locale } from "@/i18n/config";
import type { BrandLandingLabels } from "@/components/brand/BrandLandingView";

export function getBrandLandingLabels(locale: Locale): BrandLandingLabels {
  if (locale === "en") {
    return {
      brand: "MyTable",
      earlyAccessBadge: "Be one of the first at the table",
      belief: "Taste is better shared.",
      line: "Monthly tables in Rotterdam and The Hague. Wine tastings, wine walks, Chef's Tables.",
      scrollCta: "See the formats",
      whyHeadline: "We started this because we missed it ourselves.",
      whyParagraphs: [
        "Discovering new restaurants and wine bars around the city. Good idea, but figuring out which place is actually worth it takes time. And then finding someone who's up for it.",
        "So we wanted a table where that's already sorted. A good spot, good wine, and people just as up for it as you.",
        "So we're making that table ourselves. Every month, a new place.",
      ],
      formatsEyebrow: "Explore the formats",
      formats: [
        {
          key: "sunday_table",
          name: "Sunday Table",
          line: "Meet new people and discover the city's best tables.",
          cta: "join Sunday Table",
          imageAlt: "A lively, crowded evening full of new faces meeting each other",
        },
        {
          key: "wine_tasting",
          name: "Wine Tasting",
          line: "Taste the city's finest wines, curated by the wine bar.",
          cta: "join Wine Tasting",
          imageAlt: "Rows of wine glasses lined up for a tasting, two women laughing together",
        },
        {
          key: "wine_walk",
          name: "Wine Walk",
          line: "Wander the city's best spots, glass in hand.",
          cta: "join Wine Walk",
          imageAlt: "A group with wine in hand, moving between bars for the evening",
        },
        {
          key: "chefs_special",
          name: "Chef's Table",
          line: "Enjoy a full menu, family style, at one table.",
          cta: "join Chef's Table",
          imageAlt: "A group raising a toast around a beautifully set dinner table",
        },
      ],
      reviewsEyebrow: "From the table",
      finalCapture: {
        eyebrow: "Next step",
        headline: "Be there when your table forms.",
        body: "You'll only hear from us when a table is actually ready for you. No weekly emails, no spam. Just an invite, the moment it's time.",
        nameLabel: "First name",
        namePlaceholder: "Your name",
        emailLabel: "Email address",
        emailPlaceholder: "you@email.com",
        submit: "Join the waitlist",
        submitting: "Joining…",
        privacyNote: "Free. No spam.",
        successTitle: "You're on the list.",
        successBody: "Check your inbox for a confirmation. We'll email you as soon as a table forms near you.",
        error: "Something went wrong. Try again in a moment.",
      },
    };
  }
  return {
    brand: "MyTable",
    earlyAccessBadge: "Wees een van de eersten aan tafel",
    belief: "Smaak is leuker gedeeld.",
    line: "Maandelijkse tafels in Rotterdam en Den Haag. Wijnproeverijen, wijnwalks, Chef's Tables.",
    scrollCta: "Bekijk de formats",
    whyHeadline: "We begonnen dit omdat we het zelf misten.",
    whyParagraphs: [
      "Nieuwe restaurants en wijnbars ontdekken in de stad. Leuk idee, maar zelf uitzoeken welke plek het echt waard is kost tijd. En dan nog iemand vinden die zin heeft om mee te gaan.",
      "Dus wilden we een tafel waar dat al voor je geregeld is. Een goede plek, goede wijn, en mensen die er net zoveel zin in hebben als jij.",
      "Dus die tafel maken we nu zelf. Elke maand, een nieuwe plek.",
    ],
    formatsEyebrow: "Ontdek de formats",
    formats: [
      {
        key: "sunday_table",
        name: "Sunday Table",
        line: "Ontmoet nieuwe mensen en ontdek de leukste tafels van de stad.",
        cta: "doe mee met Sunday Table",
        imageAlt: "Een drukke, levendige avond vol nieuwe gezichten die elkaar ontmoeten",
      },
      {
        key: "wine_tasting",
        name: "Wijnproeverij",
        line: "Proef de lekkerste wijnen van de stad, samengesteld door de wijnbar.",
        cta: "doe mee met wijnproeverij",
        imageAlt: "Rijen wijnglazen klaargezet voor een proeverij, twee vrouwen lachen samen",
      },
      {
        key: "wine_walk",
        name: "Wijnwalk",
        line: "Ontdek de leukste restaurants van de stad en geniet van heerlijke wijnen en gerechten.",
        cta: "doe mee met wijnwalk",
        imageAlt: "Een groep met een glas wijn in de hand, van locatie naar locatie",
      },
      {
        key: "chefs_special",
        name: "Chef's Table",
        line: "Proef het beste van de kaart in één avond, family style gedeeld aan tafel.",
        cta: "doe mee met Chef's Table",
        imageAlt: "Een groep proost rond een prachtig gedekte dinertafel",
      },
    ],
    reviewsEyebrow: "Aan tafel",
    finalCapture: {
      eyebrow: "Volgende stap",
      headline: "Wees erbij zodra jouw tafel vormt.",
      body: "Je hoort pas van ons zodra er echt een tafel voor je klaarstaat. Geen wekelijkse mail, geen spam. Gewoon een uitnodiging, op het moment dat het zover is.",
      nameLabel: "Voornaam",
      namePlaceholder: "Jouw naam",
      emailLabel: "E-mailadres",
      emailPlaceholder: "jij@email.com",
      submit: "Zet me op de wachtlijst",
      submitting: "Bezig…",
      privacyNote: "Gratis. Geen spam.",
      successTitle: "Je staat op de lijst.",
      successBody: "Check je inbox voor een bevestiging. We mailen je zodra er een tafel vormt bij jou in de buurt.",
      error: "Er ging iets mis. Probeer het zo nog eens.",
    },
  };
}
