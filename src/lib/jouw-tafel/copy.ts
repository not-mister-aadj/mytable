// All "Jouw tafel" copy, Dutch and English: the landing page and the two
// placeholder pages behind its buttons. House rules: short, calm and warm,
// no em dashes, no exclamation marks, no emojis. Never name a venue (the
// wine bar is booked once the tables are known) and never suggest a drink
// is included: the price is the seat.

import type { Locale } from "@/i18n/config";

export type FaqItem = { q: string; a: string };

export type LandingCopy = {
  meta: { title: string; description: string };
  signUp: string;
  logIn: string;
  hero: { title: string; body: string; note: string; imageAlt: string; locationAria: string };
  herkenning: { title: string; lines: string[]; closing: string };
  howItWorks: {
    eyebrow: string;
    title: string;
    steps: Array<{ title: string; body: string }>;
    reassurance: string;
    imageAlt: string;
  };
  tables: {
    eyebrow: string;
    title: (city: string | null) => string;
    cityTabsAria: string;
    comingSoon: string;
    /** Shown instead of a spot count while the count would say little. */
    open: string;
    englishOpen: string;
    dutchOnly: string | null;
    where: (city: string) => string;
    empty: (city: string) => string;
  };
  testimonials: { eyebrow: string; title: string; imageAlt: string };
  moneyBack: { title: string; body: (price: string | null) => string };
  faq: { eyebrow: string; title: string; items: (price: string | null) => FaqItem[] };
  closing: { title: string; note: string };
  footer: { terms: string; privacy: string };
  /** /jouw-tafel/aanmelden and /jouw-tafel/inloggen, until accounts exist. */
  placeholder: {
    signUpTitle: string;
    logInTitle: string;
    title: string;
    signUpBody: string;
    logInBody: string;
    back: string;
  };
};

// ---------------------------------------------------------------------------
// Dutch
// ---------------------------------------------------------------------------

const landingNl: LandingCopy = {
  meta: {
    title: "Jouw zondag | MyTable",
    description:
      "Elke maand schuif je in jouw stad aan bij een tafel van 4 tot 6 mensen in een goede wijnbar.",
  },
  signUp: "Aanmelden",
  logIn: "Inloggen",
  hero: {
    title: "Een goede wijnbar. Een gezellige tafel. Jouw zondag.",
    body: "Elke maand schuif je in jouw stad aan bij een tafel van 4 tot 6 mensen die net zo van een goed glas houden als jij. Wij regelen de tafel en de plek, jij komt.",
    note: "Gratis aanmelden. Daarna kies je je zondag.",
    imageAlt: "Een volle tafel heft het glas tijdens een MyTable wijnmiddag",
    locationAria: "Jouw stad",
  },
  herkenning: {
    title: "Herken je jezelf?",
    lines: [
      "Jij kiest het restaurant op basis van de wijnkaart.",
      "Je zondagmiddag mag best wat gezelliger.",
      "Je hebt zin in een goed gesprek, zonder dat je eerst iets hoeft te plannen.",
    ],
    closing: "Dan hoor je aan onze tafel.",
  },
  howItWorks: {
    eyebrow: "Zo werkt het",
    title: "Drie stappen naar jouw zondag",
    steps: [
      {
        title: "Kies je zondag.",
        body: "Elke maand een vaste datum in jouw stad, met een tafel voor jouw leeftijd.",
      },
      {
        title: "Wij kiezen de wijnbar.",
        body: "Zodra we weten met hoeveel jullie zijn, boeken we een plek die bij jullie tafel past. Een week van tevoren hoor je waar.",
      },
      {
        title: "Schuif aan.",
        body: "Om 14:00 neem je plaats. Kies een glas van de kaart, of een van onze aanraders. Je drankjes bestel je zelf.",
      },
    ],
    reassurance: "Iedereen aan tafel koos er zelf voor om er te zijn.",
    imageAlt: "Gesprek en gelach aan tafel, met wijnglazen op tafel",
  },
  tables: {
    eyebrow: "Sunday Table",
    title: (city) => (city ? `Eerstvolgende tafels in ${city}` : "Eerstvolgende tafels"),
    cityTabsAria: "Kies een stad",
    comingSoon: "Binnenkort",
    open: "Plekken vrij",
    englishOpen: "Ook Engels",
    dutchOnly: null,
    where: (city) => `In een wijnbar in ${city}. Een week van tevoren hoor je waar.`,
    empty: (city) =>
      `Nog geen tafel in ${city}. Meld je aan, dan hoor je het als eerste zodra er een is.`,
  },
  testimonials: {
    eyebrow: "Aan tafel",
    title: "Wat gasten zeggen",
    imageAlt: "Twee gasten lachen aan een tafel vol wijnglazen",
  },
  moneyBack: {
    title: "Gaat je tafel niet door? Dan krijg je je geld terug.",
    body: (price) =>
      `Een tafel gaat door vanaf 4 gasten. Is dat een week van tevoren niet gehaald, dan krijg je automatisch je volledige ${
        price ? `€${price}` : "bedrag"
      } terug, en een andere datum aangeboden.`,
  },
  faq: {
    eyebrow: "Goed om te weten",
    title: "Veelgestelde vragen",
    items: (price) => [
      {
        q: "Ik ken er niemand. Is dat raar?",
        a: "Nee. De meeste mensen komen alleen, en iedereen aan tafel koos er zelf voor om er te zijn.",
      },
      {
        q: "Mag ik iemand meenemen?",
        a: "Ja. Kies twee plekken, dan zitten jullie samen aan tafel.",
      },
      {
        q: "Wat kost het?",
        a: `${price ? `€${price}` : "Een vast bedrag"} voor je plek. Wat je drinkt, bestel en betaal je zelf aan tafel.`,
      },
      {
        q: "Waar is het?",
        a: "In een wijnbar in jouw stad. We boeken de plek zodra we weten met hoeveel jullie zijn. Een week van tevoren hoor je waar.",
      },
      {
        q: "Gaat het altijd door?",
        a: "Vanaf 4 gasten. Wordt dat niet gehaald, dan krijg je je geld automatisch terug.",
      },
      {
        q: "Is het een datingevent?",
        a: "Nee. Gewoon een gezellige tafel met goede wijn.",
      },
      {
        q: "In welke taal?",
        a: "Nederlands. Sommige tafels zijn ook open voor Engels; dat zie je bij de datum.",
      },
    ],
  },
  closing: {
    title: "Zin in een gezellige zondag?",
    note: "Gratis aanmelden. Daarna kies je je zondag.",
  },
  footer: { terms: "Algemene voorwaarden", privacy: "Privacy" },
  placeholder: {
    signUpTitle: "Aanmelden | MyTable",
    logInTitle: "Inloggen | MyTable",
    title: "Hier wordt nog aan gewerkt",
    signUpBody: "Binnenkort maak je hier je account aan en kies je je zondag.",
    logInBody: "Binnenkort log je hier in.",
    back: "Terug",
  },
};

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const landingEn: LandingCopy = {
  meta: {
    title: "Your Sunday | MyTable",
    description:
      "Every month, join a table of 4 to 6 people in a good wine bar in your city.",
  },
  signUp: "Sign up",
  logIn: "Log in",
  hero: {
    title: "A good wine bar. A convivial table. Your Sunday.",
    body: "Every month you join a table of 4 to 6 people in your city who enjoy a good glass as much as you do. We arrange the table and the place, you just come.",
    note: "Signing up is free. Then you choose your Sunday.",
    imageAlt: "A full table raises a glass during a MyTable wine afternoon",
    locationAria: "Your city",
  },
  herkenning: {
    title: "Sound familiar?",
    lines: [
      "You choose a restaurant by its wine list.",
      "Your Sunday afternoon could be a little cosier.",
      "You'd like a good conversation, without having to plan anything first.",
    ],
    closing: "Then you belong at our table.",
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "Three steps to your Sunday",
    steps: [
      {
        title: "Choose your Sunday.",
        body: "A fixed date in your city every month, with a table for your age.",
      },
      {
        title: "We choose the wine bar.",
        body: "Once we know how many of you there are, we book a place that suits your table. You'll hear where a week ahead.",
      },
      {
        title: "Take your seat.",
        body: "At 2:00 PM you sit down. Choose a glass from the list, or one of our recommendations. You order your own drinks.",
      },
    ],
    reassurance: "Everyone at the table chose to be there.",
    imageAlt: "Conversation and laughter at a table with wine glasses",
  },
  tables: {
    eyebrow: "Sunday Table",
    title: (city) => (city ? `Upcoming tables in ${city}` : "Upcoming tables"),
    cityTabsAria: "Choose a city",
    comingSoon: "Coming soon",
    open: "Seats available",
    englishOpen: "English welcome",
    dutchOnly: "In Dutch",
    where: (city) => `In a wine bar in ${city}. You'll hear where a week ahead.`,
    empty: (city) =>
      `No table in ${city} yet. Sign up and you'll be the first to hear when there is one.`,
  },
  testimonials: {
    eyebrow: "At the table",
    title: "What guests say",
    imageAlt: "Two guests laughing at a table full of wine glasses",
  },
  moneyBack: {
    title: "Table not going ahead? You get your money back.",
    body: (price) =>
      `A table goes ahead from 4 guests. If that isn't reached a week before, you automatically get your full ${
        price ? `€${price}` : "amount"
      } back, and we offer you another date.`,
  },
  faq: {
    eyebrow: "Good to know",
    title: "Questions",
    items: (price) => [
      {
        q: "I won't know anyone. Is that strange?",
        a: "No. Most people come alone, and everyone at the table chose to be there.",
      },
      {
        q: "Can I bring someone?",
        a: "Yes. Choose two seats and you'll sit at the table together.",
      },
      {
        q: "What does it cost?",
        a: `${price ? `€${price}` : "A fixed amount"} for your seat. Whatever you drink, you order and pay for yourself at the table.`,
      },
      {
        q: "Where is it?",
        a: "In a wine bar in your city. We book the place once we know how many of you there are. You'll hear where a week ahead.",
      },
      {
        q: "Does it always go ahead?",
        a: "From 4 guests. If that isn't reached, you automatically get your money back.",
      },
      {
        q: "Is it a dating event?",
        a: "No. Simply a convivial table with good wine.",
      },
      {
        q: "In which language?",
        a: "Dutch. Some tables are open to English too; you'll see that by the date.",
      },
    ],
  },
  closing: {
    title: "Fancy a convivial Sunday?",
    note: "Signing up is free. Then you choose your Sunday.",
  },
  footer: { terms: "Terms", privacy: "Privacy" },
  placeholder: {
    signUpTitle: "Sign up | MyTable",
    logInTitle: "Log in | MyTable",
    title: "We're still working on this",
    signUpBody: "Soon you'll create your account here and choose your Sunday.",
    logInBody: "Soon you'll log in here.",
    back: "Back",
  },
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return locale === "en" ? landingEn : landingNl;
}

/** 1000 -> "10", 1250 -> "12,50" (Dutch decimal comma on both pages, as
 * the rest of the site shows euro amounts). */
export function formatEuros(cents: number): string {
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
}
