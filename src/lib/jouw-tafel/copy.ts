// All quiz copy, Dutch and English. House rules: short and calm, no em
// dashes, no exclamation marks, no emojis. The result is "Jouw tafel", never
// a "match". Never suggest drinks or food are included: the price is the seat.

import type { Locale } from "@/i18n/config";
import type { QuizAgeRange, QuizCompany, QuizLanguage, QuizWhy } from "@/lib/jouw-tafel/logic";

export type QuizCopy = {
  back: string;
  continue: string;
  progressAria: string;
  intro: { title: string; body: string; cta: string };
  stad: { title: string; other: string; otherPlaceholder: string; otherRequired: string };
  leeftijd: { title: string; options: Record<QuizAgeRange, string> };
  stopStad: { withCount: (city: string, n: number) => string; withoutCount: (city: string) => string };
  zoekt: { title: string; hint: string; options: Record<QuizWhy, string>; required: string };
  stopZoekt: {
    withShare: (answer: string, tens: number, nearly: boolean) => string;
    withoutShare: (answer: string) => string;
  };
  gezelschap: { title: string; options: Record<QuizCompany, string> };
  stopAlleen: {
    numericTitle: (tens: number) => string;
    almostEveryoneTitle: string;
    mostTitle: string;
    body: string;
  };
  taal: { title: string; options: Record<QuizLanguage, string> };
  gegevens: {
    title: string;
    emailLabel: string;
    emailPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    note: string;
    submit: string;
    submitting: string;
    errorEmailEmpty: string;
    errorEmailInvalid: string;
    errorServer: string;
  };
  zoeken: { line: (city: string, bracket: string, language: QuizLanguage) => string };
  result: {
    eyebrow: string;
    titleA: string;
    titleB: string;
    titleCPlus: (city: string) => string;
    titleC: (city: string) => string;
    dateTime: (date: string, start: string, end: string | null) => string;
    venueLine: (venue: string | null, city: string) => string;
    reserveOne: (price: string) => string;
    reserveTwo: (price: string) => string;
    reserveNearby: (city: string, price: string) => string;
    reserving: string;
    drinksNote: string;
    detailsLink: string;
    nameLabel: string;
    namePlaceholder: string;
    nameRequired: string;
    checkoutError: string;
    dutchTableNote: string;
    dutchFine: string;
    waitForEnglish: string;
    waitForEnglishBody: (city: string) => string;
    previewNoCheckout: string;
    bBody: string;
    bCalendar: (date: string) => string;
    bGoogle: string;
    bNearby: (city: string, date: string) => string;
    cPlusWait: (city: string) => string;
    cBodyWithCount: (city: string, n: number) => string;
    cBodyWithoutCount: string;
    cShare: string;
    shareCopied: string;
    shareTitle: string;
    shareText: string;
  };
};

const nl: QuizCopy = {
  back: "Terug",
  continue: "Verder",
  progressAria: "Voortgang",
  intro: {
    title: "Welke Sunday Table past bij jou?",
    body: "Vijf korte vragen, daarna zie je meteen jouw tafel.",
    cta: "Begin",
  },
  stad: {
    title: "In welke stad wil je aanschuiven?",
    other: "Andere stad",
    otherPlaceholder: "Welke stad?",
    otherRequired: "Vul je stad in.",
  },
  leeftijd: {
    title: "Wat is je leeftijd?",
    options: { "18_24": "18-24", "25_34": "25-34", "35_44": "35-44", "45_plus": "45+" },
  },
  stopStad: {
    withCount: (city, n) => `In ${city} staan al ${n}+ mensen op de lijst voor Sunday Table.`,
    withoutCount: (city) => `Je bent niet de enige in ${city} die hierop zit te wachten.`,
  },
  zoekt: {
    title: "Wat zoek je in een zondag?",
    hint: "Kies wat bij je past.",
    options: {
      discover_places: "Nieuwe plekken ontdekken",
      just_fun: "Gewoon een leuke zondag",
      discover_wines: "Nieuwe wijnen proeven",
      treat: "Mezelf trakteren",
      new_city: "Nieuw in de stad",
    },
    required: "Kies er minstens een.",
  },
  stopZoekt: {
    withShare: (answer, tens, nearly) =>
      `${answer}. Dat zoekt ${nearly ? "bijna " : ""}${tens} van de 10 mensen op onze lijst ook.`,
    withoutShare: (answer) => `${answer}. Daar ben je bij ons aan het goede adres.`,
  },
  gezelschap: {
    title: "Kom je alleen of met iemand?",
    options: { solo: "Alleen", together: "Met iemand" },
  },
  stopAlleen: {
    numericTitle: (tens) => `${tens} van de 10 mensen aan tafel kwamen alleen.`,
    almostEveryoneTitle: "Bijna iedereen komt alleen.",
    mostTitle: "De meeste mensen komen alleen.",
    body: "Aan tafel kennen de meeste mensen elkaar vooraf niet. Je schuift aan en het gesprek begint vanzelf.",
  },
  taal: {
    title: "In welke taal praat je het liefst aan tafel?",
    options: { dutch: "Nederlands", english: "Engels", both: "Allebei prima" },
  },
  gegevens: {
    title: "Waar mogen we je tafel naartoe sturen?",
    emailLabel: "E-mailadres",
    emailPlaceholder: "jij@voorbeeld.nl",
    nameLabel: "Voornaam (mag leeg blijven)",
    namePlaceholder: "Je voornaam",
    note: "Hiermee sta je ook op de wachtlijst. Geen spam.",
    submit: "Laat mijn tafel zien",
    submitting: "Even geduld",
    errorEmailEmpty: "Vul je e-mailadres in.",
    errorEmailInvalid: "Dit e-mailadres klopt nog niet helemaal.",
    errorServer: "Er ging iets mis. Probeer het opnieuw.",
  },
  zoeken: {
    line: (city, bracket, language) =>
      `${city}, ${bracket}, ${
        language === "dutch" ? "Nederlands" : language === "english" ? "Engels" : "beide talen"
      } aan tafel. We zoeken jouw tafel...`,
  },
  result: {
    eyebrow: "Sunday Table",
    titleA: "Jouw tafel",
    titleB: "Jouw tafel komt eraan",
    titleCPlus: (city) => `In ${city} is er wel een tafel`,
    titleC: (city) => `Nog geen tafel in ${city}, maar je bent niet de enige`,
    dateTime: (date, start, end) => (end ? `${date} · ${start} tot ${end}` : `${date} · ${start}`),
    venueLine: (venue, city) =>
      `${venue ? `${venue}, ${city}` : city} · aan tafels van 4 tot 6`,
    reserveOne: (price) => `Reserveer je plek · €${price}`,
    reserveTwo: (price) => `Reserveer 2 plekken · €${price}`,
    reserveNearby: (city, price) => `Reserveer in ${city} · €${price}`,
    reserving: "Even geduld",
    drinksNote: "Je drankjes bestel je zelf aan tafel.",
    detailsLink: "Of bekijk alle details",
    nameLabel: "Op welke naam reserveren we?",
    namePlaceholder: "Je voornaam",
    nameRequired: "Vul je naam in, dan zetten we die op de reservering.",
    checkoutError: "Er ging iets mis. Probeer het opnieuw.",
    dutchTableNote: "Deze tafel is Nederlandstalig.",
    dutchFine: "Nederlands is ook prima",
    waitForEnglish: "Ik wacht liever op een Engelstalige tafel",
    waitForEnglishBody: (city) =>
      `Je staat op de lijst. Zodra er een Engelstalige tafel in ${city} is, hoor je het als eerste.`,
    previewNoCheckout: "Voorbeeld: reserveren staat hier uit.",
    bBody:
      "Je staat op de lijst en hoort het als eerste zodra de tafel opent, voordat we hem ergens anders aankondigen.",
    bCalendar: (date) => `Zet ${date} in mijn agenda`,
    bGoogle: "Of zet hem in Google Agenda",
    bNearby: (city, date) => `Liever niet wachten? In ${city} is er al een tafel op ${date}.`,
    cPlusWait: (city) => `Ik wacht op een tafel in ${city}`,
    cBodyWithCount: (city, n) =>
      `Er staan al ${n}+ mensen uit ${city} op de lijst. Zodra er genoeg zijn, plannen we daar een tafel, en jij hoort het als eerste.`,
    cBodyWithoutCount:
      "Zodra er genoeg mensen zijn, plannen we daar een tafel, en jij hoort het als eerste.",
    cShare: "Deel met iemand die mee zou willen",
    shareCopied: "Link gekopieerd",
    shareTitle: "Sunday Table",
    shareText: "Zin om samen aan te schuiven bij Sunday Table?",
  },
};

const en: QuizCopy = {
  back: "Back",
  continue: "Continue",
  progressAria: "Progress",
  intro: {
    title: "Which Sunday Table suits you?",
    body: "Five short questions, then you'll see your table right away.",
    cta: "Start",
  },
  stad: {
    title: "Which city would you like to join in?",
    other: "Another city",
    otherPlaceholder: "Which city?",
    otherRequired: "Fill in your city.",
  },
  leeftijd: {
    title: "How old are you?",
    options: { "18_24": "18-24", "25_34": "25-34", "35_44": "35-44", "45_plus": "45+" },
  },
  stopStad: {
    withCount: (city, n) => `In ${city}, ${n}+ people are already on the list for Sunday Table.`,
    withoutCount: (city) => `You're not the only one in ${city} waiting for this.`,
  },
  zoekt: {
    title: "What are you looking for in a Sunday?",
    hint: "Choose what fits you.",
    options: {
      discover_places: "Discovering new places",
      just_fun: "Simply a nice Sunday",
      discover_wines: "Tasting new wines",
      treat: "Treating myself",
      new_city: "New in town",
    },
    required: "Choose at least one.",
  },
  stopZoekt: {
    withShare: (answer, tens, nearly) =>
      `${answer}. ${nearly ? "Nearly " : ""}${tens} in 10 people on our list are looking for that too.`,
    withoutShare: (answer) => `${answer}. You've come to the right place.`,
  },
  gezelschap: {
    title: "Coming alone or with someone?",
    options: { solo: "Alone", together: "With someone" },
  },
  stopAlleen: {
    numericTitle: (tens) => `${tens} in 10 people at our tables came alone.`,
    almostEveryoneTitle: "Almost everyone comes alone.",
    mostTitle: "Most people come alone.",
    body: "At the table, most people don't know each other beforehand. You sit down and the conversation starts by itself.",
  },
  taal: {
    title: "Which language do you prefer at the table?",
    options: { dutch: "Dutch", english: "English", both: "Either is fine" },
  },
  gegevens: {
    title: "Where should we send your table?",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    nameLabel: "First name (optional)",
    namePlaceholder: "Your first name",
    note: "This also puts you on the waitlist. No spam.",
    submit: "Show my table",
    submitting: "One moment",
    errorEmailEmpty: "Fill in your email address.",
    errorEmailInvalid: "This email address isn't quite right yet.",
    errorServer: "Something went wrong. Please try again.",
  },
  zoeken: {
    line: (city, bracket, language) =>
      `${city}, ${bracket}, ${
        language === "dutch" ? "Dutch" : language === "english" ? "English" : "both languages"
      } at the table. Finding your table...`,
  },
  result: {
    eyebrow: "Sunday Table",
    titleA: "Your table",
    titleB: "Your table is coming",
    titleCPlus: (city) => `There is a table in ${city}`,
    titleC: (city) => `No table in ${city} yet, but you're not the only one`,
    dateTime: (date, start, end) => (end ? `${date} · ${start} to ${end}` : `${date} · ${start}`),
    venueLine: (venue, city) =>
      `${venue ? `${venue}, ${city}` : city} · at tables of 4 to 6`,
    reserveOne: (price) => `Reserve your seat · €${price}`,
    reserveTwo: (price) => `Reserve 2 seats · €${price}`,
    reserveNearby: (city, price) => `Reserve in ${city} · €${price}`,
    reserving: "One moment",
    drinksNote: "You order your own drinks at the table.",
    detailsLink: "Or see all the details",
    nameLabel: "Which name should we put the booking under?",
    namePlaceholder: "Your first name",
    nameRequired: "Fill in your name so we can put it on the booking.",
    checkoutError: "Something went wrong. Please try again.",
    dutchTableNote: "This table is held in Dutch.",
    dutchFine: "Dutch is fine too",
    waitForEnglish: "I'd rather wait for an English-speaking table",
    waitForEnglishBody: (city) =>
      `You're on the list. As soon as there is an English-speaking table in ${city}, you'll be the first to hear.`,
    previewNoCheckout: "Preview: booking is switched off here.",
    bBody:
      "You're on the list and will be the first to hear when the table opens, before we announce it anywhere else.",
    bCalendar: (date) => `Add ${date} to my calendar`,
    bGoogle: "Or add it to Google Calendar",
    bNearby: (city, date) => `Rather not wait? There's already a table in ${city} on ${date}.`,
    cPlusWait: (city) => `I'll wait for a table in ${city}`,
    cBodyWithCount: (city, n) =>
      `${n}+ people from ${city} are already on the list. Once there are enough, we'll plan a table there, and you'll be the first to hear.`,
    cBodyWithoutCount:
      "Once there are enough people, we'll plan a table there, and you'll be the first to hear.",
    cShare: "Share with someone who'd like to come",
    shareCopied: "Link copied",
    shareTitle: "Sunday Table",
    shareText: "Fancy joining a Sunday Table together?",
  },
};

export function getQuizCopy(locale: Locale): QuizCopy {
  return locale === "en" ? en : nl;
}
