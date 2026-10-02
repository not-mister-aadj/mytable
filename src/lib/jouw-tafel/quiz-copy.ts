// Quiz copy (/jouw-tafel/start), Dutch and English. House rules: short,
// warm and calm, no em dashes, no exclamation marks, no emojis. Tables are
// mixed, drinks are never included, a venue is never named, and numbers are
// only ever live ones (rounded down).

import type { Locale } from "@/i18n/config";
import type {
  AgeMattersAnswer,
  CompanionAnswer,
  CompanionWhoAnswer,
  ConversationAnswer,
  DietaryAnswer,
  FormatAnswer,
  HeardFromAnswer,
  LanguageAnswer,
  QuizChapter,
  ReadyAnswer,
  WhyAnswer,
  WineAnswer,
} from "@/lib/jouw-tafel/quiz-logic";

export type QuizCopy = {
  metaTitle: string;
  chapters: Record<QuizChapter, string>;
  duration: string;
  back: string;
  menu: string;
  logOut: string;
  loggingOut: string;
  next: string;
  skip: string;
  chooseMax: (n: number) => string;
  welkom: { title: (name: string | null) => string; sub: string; begin: string; rows: [string, string, string] };
  naam: { title: string; label: string; placeholder: string; hint: string; error: string };
  geboortedatum: {
    title: string;
    day: string;
    month: string;
    year: string;
    dayPlaceholder: string;
    monthPlaceholder: string;
    yearPlaceholder: string;
    hint: string;
    incomplete: string;
    invalid: string;
    under18: string;
  };
  leeftijd: { title: string; options: Record<AgeMattersAnswer, string> };
  stad: {
    title: string;
    geoHint: string;
    other: string;
    otherLabel: string;
    otherPlaceholder: string;
    otherError: string;
  };
  stopStad: {
    count: (n: number, city: string) => string;
    few: (city: string) => string;
    /** Under the "{n}+" in the stat card. */
    statLabel: (city: string) => string;
  };
  zoekt: { title: string; options: Record<WhyAnswer, string> };
  stopZoekt: Record<WhyAnswer, string>;
  gesprek: { title: string; options: Record<ConversationAnswer, string> };
  stopGesprek: { known: string; both: string };
  wijn: { title: string; options: Record<WineAnswer, string> };
  stopWijn: { wine: string; none: string };
  gezelschap: { title: string; options: Record<CompanionAnswer, string> };
  stopAlleen: string;
  wie: { title: string; options: Record<CompanionWhoAnswer, string> };
  stopWie: Record<CompanionWhoAnswer, string>;
  taal: { title: string; options: Record<LanguageAnswer, string> };
  dieet: {
    title: string;
    options: Record<DietaryAnswer, string>;
    note: string;
    otherLabel: string;
    otherPlaceholder: string;
  };
  formats: {
    title: string;
    options: Record<FormatAnswer, { title: string; body: string | null }>;
    note: string;
  };
  bron: { title: string; options: Record<HeardFromAnswer, string> };
  stopReviews: { eyebrow: string; title: string };
  klaar: { title: string; options: Record<ReadyAnswer, string> };
  zoeken: { title: string; items: [string, string, string] };
  kies: {
    title: string;
    sub: (city: string) => string;
    inCity: (city: string) => string;
    nearby: string;
    comingSoon: string;
    spotsOpen: string;
    soonBadge: string;
    perSeat: (price: string) => string;
    seats: string;
    seatOption: (n: 1 | 2) => string;
    onlyOneLeft: string;
    total: (price: string) => string;
    reserve: string;
    reserving: string;
    guarantee: string;
    notify: string;
    notified: string;
    unsure: string;
    noMatch: (city: string) => string;
    share: string;
    shareTitle: string;
    shareText: string;
    shareCopied: string;
    dutchTableNote: string;
    dutchFine: string;
    checkoutError: string;
    where: string;
    selectAria: string;
  };
};

const nl: QuizCopy = {
  metaTitle: "Jouw tafel | MyTable",
  chapters: { over_jou: "Over jou", aan_tafel: "Aan tafel", jouw_zondag: "Jouw zondag" },
  duration: "± 2 minuten",
  back: "Terug",
  menu: "Menu",
  logOut: "Uitloggen",
  loggingOut: "Uitloggen...",
  next: "Verder",
  skip: "Overslaan",
  chooseMax: (n) => `Kies er maximaal ${n}`,
  welkom: {
    title: (name) => (name ? `Welkom, ${name}.` : "Welkom."),
    sub: "Nog 2 minuten, dan kies je je zondag.",
    begin: "Begin",
    rows: ["Een paar vragen over jou", "Wij zoeken jouw tafel", "Gratis verzetten tot 7 dagen vooraf"],
  },
  naam: {
    title: "Hoe mogen we je noemen?",
    label: "Voornaam",
    placeholder: "Je voornaam",
    hint: "Zo staat het op je naamkaartje aan tafel.",
    error: "Vul je voornaam in.",
  },
  geboortedatum: {
    title: "Wat is je geboortedatum?",
    day: "Dag",
    month: "Maand",
    year: "Jaar",
    dayPlaceholder: "DD",
    monthPlaceholder: "MM",
    yearPlaceholder: "JJJJ",
    hint: "Zo zetten we je aan een tafel met mensen in jouw leeftijdsgroep.",
    incomplete: "Vul je hele geboortedatum in.",
    invalid: "Deze datum klopt niet.",
    under18: "Sunday Table is voor 18 jaar en ouder.",
  },
  leeftijd: {
    title: "Zit je graag aan tafel met mensen van ongeveer jouw leeftijd?",
    options: { yes: "Ja, graag", no: "Maakt me niet uit" },
  },
  stad: {
    title: "In welke stad wil je aanschuiven?",
    geoHint: "Klopt dit?",
    other: "Andere stad",
    otherLabel: "Welke stad?",
    otherPlaceholder: "Bijvoorbeeld Leiden",
    otherError: "Vul je stad in.",
  },
  stopStad: {
    count: (n, city) => `In ${city} staan al ${n}+ mensen op de lijst.`,
    few: (city) => `Je bent niet de enige in ${city}.`,
    statLabel: (city) => `op de lijst in ${city}`,
  },
  zoekt: {
    title: "Waar heb je zin in?",
    options: {
      places: "Nieuwe plekken ontdekken",
      cosy: "Gewoon een gezellige zondag",
      wines: "Nieuwe wijnen proeven",
      treat: "Mezelf trakteren",
      new_city: "Nieuw in de stad",
    },
  },
  stopZoekt: {
    places: "Dan zit je goed. We kiezen plekken die de moeite waard zijn.",
    cosy: "Een goed glas, geen planning. Daar is Sunday Table voor.",
    wines: "Aan tafel krijg je onze wijnaanraders van de kaart.",
    treat: "Een middag die alleen van jou is.",
    new_city: "De leukste manier om een stad te leren kennen.",
  },
  gesprek: {
    title: "Aan tafel ben jij meer...",
    options: { talker: "De prater", listener: "De luisteraar", both: "Allebei" },
  },
  stopGesprek: {
    known: "Goed om te weten. Daar houden we rekening mee.",
    both: "Precies wat een tafel laat lopen.",
  },
  wijn: {
    title: "Rood, wit of bubbels?",
    options: { red: "Rood", white: "Wit", bubbles: "Bubbels", none: "Liever geen alcohol" },
  },
  stopWijn: {
    wine: "Goede keuze.",
    none: "Helemaal goed. Je bestelt gewoon wat je lekker vindt.",
  },
  gezelschap: {
    title: "Kom je alleen of met iemand?",
    options: { alone: "Alleen", with: "Met iemand" },
  },
  stopAlleen: "Bijna iedereen komt alleen. Je schuift aan en het gesprek begint vanzelf.",
  wie: {
    title: "Wie neem je mee?",
    options: { friend: "Vriend of vriendin", partner: "Partner", family: "Familie", colleague: "Collega" },
  },
  stopWie: {
    friend: "Leuk. Jullie zitten samen, met een paar nieuwe gezichten erbij.",
    partner: "Jullie zitten samen aan tafel, tussen nieuwe mensen.",
    family: "Samen aanschuiven. Vaak de leukste verhalen van de middag.",
    colleague: "Eens buiten het werk, met een goed glas.",
  },
  taal: {
    title: "In welke taal praat je het liefst aan tafel?",
    options: { dutch: "Nederlands", english: "Engels", both: "Allebei prima" },
  },
  dieet: {
    title: "Heb je dieetwensen?",
    options: {
      vegetarian: "Vegetarisch",
      vegan: "Veganistisch",
      gluten_free: "Glutenvrij",
      lactose_free: "Lactosevrij",
      nut_allergy: "Noten-allergie",
      other: "Anders",
      none: "Geen",
    },
    note: "Dan geven we het door aan de zaak.",
    otherLabel: "Wat moeten we weten?",
    otherPlaceholder: "Bijvoorbeeld geen vis",
  },
  formats: {
    title: "Binnenkort bij MyTable. Welke zou je willen meemaken?",
    options: {
      wine_tasting: { title: "Wijnproeverij", body: "Proef bijzondere wijnen met bijpassende hapjes." },
      wine_walk: { title: "Wijnwalk", body: "Wandel met een kleine groep langs de leukste wijnbars." },
      chefs_special: { title: "Chef's Table", body: "De chef kookt zijn beste gerechten in kleine gangen." },
      sunday_only: { title: "Alleen Sunday Table", body: null },
    },
    note: "Deze formats komen later. Je hoort het als eerste zodra er een datum is.",
  },
  bron: {
    title: "Hoe ken je ons?",
    options: {
      instagram: "Instagram",
      facebook: "Facebook",
      friends: "Via vrienden",
      google: "Google",
      other: "Anders",
    },
  },
  stopReviews: { eyebrow: "Aan tafel", title: "Wat gasten zeggen" },
  klaar: {
    title: "Klaar om aan te schuiven bij 4 tot 6 nieuwe mensen?",
    options: { yes: "Ja, graag", unsure: "Nog niet zeker" },
  },
  zoeken: {
    title: "We zoeken jouw tafel",
    items: ["Jouw stad", "Jouw leeftijdsgroep", "Jouw tafel"],
  },
  kies: {
    title: "Kies je zondag",
    sub: (city) => `Tafels in ${city} en vlakbij, voor jouw leeftijdsgroep.`,
    inCity: (city) => `In ${city}`,
    nearby: "Vlakbij",
    comingSoon: "Binnenkort",
    spotsOpen: "Plekken vrij",
    soonBadge: "Binnenkort",
    perSeat: (price) => `€${price} per plek`,
    seats: "Plekken",
    seatOption: (n) => (n === 1 ? "1 plek" : "2 plekken"),
    onlyOneLeft: "Nog 1 plek aan deze tafel.",
    total: (price) => `Totaal €${price}`,
    reserve: "Reserveer",
    reserving: "Even geduld...",
    guarantee:
      "Gratis verzetten tot 7 dagen vooraf. Gaat de tafel niet door, dan krijg je je geld automatisch terug.",
    notify: "Houd me op de hoogte",
    notified: "Genoteerd. Je hoort het als eerste.",
    unsure: "Geen haast. Je kunt altijd terugkomen via Inloggen.",
    noMatch: (city) =>
      `Je staat op de lijst. Zodra er in ${city} een tafel opent, hoor je het als eerste.`,
    share: "Deel met een vriend",
    shareTitle: "Sunday Table",
    shareText: "Een zondagmiddag aan tafel met nieuwe mensen. Zin om mee te doen?",
    shareCopied: "Link gekopieerd.",
    dutchTableNote: "Deze tafel is Nederlandstalig.",
    dutchFine: "Nederlands is ook prima",
    checkoutError: "Dat lukte niet. Probeer het nog een keer.",
    where: "In een wijnbar in de stad. Een week van tevoren hoor je waar.",
    selectAria: "Kies deze tafel",
  },
};

const en: QuizCopy = {
  metaTitle: "Your table | MyTable",
  chapters: { over_jou: "About you", aan_tafel: "At the table", jouw_zondag: "Your Sunday" },
  duration: "About 2 minutes",
  back: "Back",
  menu: "Menu",
  logOut: "Log out",
  loggingOut: "Logging out...",
  next: "Continue",
  skip: "Skip",
  chooseMax: (n) => `Choose up to ${n}`,
  welkom: {
    title: (name) => (name ? `Welcome, ${name}.` : "Welcome."),
    sub: "Two more minutes, then you choose your Sunday.",
    begin: "Start",
    rows: ["A few questions about you", "We find your table", "Free to move up to 7 days before"],
  },
  naam: {
    title: "What should we call you?",
    label: "First name",
    placeholder: "Your first name",
    hint: "This is what goes on your name card at the table.",
    error: "Please fill in your first name.",
  },
  geboortedatum: {
    title: "What is your date of birth?",
    day: "Day",
    month: "Month",
    year: "Year",
    dayPlaceholder: "DD",
    monthPlaceholder: "MM",
    yearPlaceholder: "YYYY",
    hint: "So we can seat you with people in your age group.",
    incomplete: "Please fill in your full date of birth.",
    invalid: "This date doesn't look right.",
    under18: "Sunday Table is for ages 18 and up.",
  },
  leeftijd: {
    title: "Do you like sitting with people around your own age?",
    options: { yes: "Yes, please", no: "I don't mind" },
  },
  stad: {
    title: "Which city would you like to join a table in?",
    geoHint: "Is this right?",
    other: "Another city",
    otherLabel: "Which city?",
    otherPlaceholder: "For example Leiden",
    otherError: "Please fill in your city.",
  },
  stopStad: {
    count: (n, city) => `${n}+ people in ${city} are already on the list.`,
    few: (city) => `You're not the only one in ${city}.`,
    statLabel: (city) => `on the list in ${city}`,
  },
  zoekt: {
    title: "What are you in the mood for?",
    options: {
      places: "Discovering new places",
      cosy: "Just a cosy Sunday",
      wines: "Tasting new wines",
      treat: "Treating myself",
      new_city: "New in town",
    },
  },
  stopZoekt: {
    places: "You're in the right place. We pick places worth the visit.",
    cosy: "A good glass, no planning. That's what Sunday Table is for.",
    wines: "At the table you get our wine picks from the list.",
    treat: "An afternoon that's all yours.",
    new_city: "The nicest way to get to know a city.",
  },
  gesprek: {
    title: "At the table, you're more...",
    options: { talker: "The talker", listener: "The listener", both: "Both" },
  },
  stopGesprek: {
    known: "Good to know. We'll keep it in mind.",
    both: "Exactly what keeps a table going.",
  },
  wijn: {
    title: "Red, white or bubbles?",
    options: { red: "Red", white: "White", bubbles: "Bubbles", none: "I'd rather not drink alcohol" },
  },
  stopWijn: {
    wine: "Good choice.",
    none: "Perfectly fine. You simply order what you like.",
  },
  gezelschap: {
    title: "Are you coming alone or with someone?",
    options: { alone: "Alone", with: "With someone" },
  },
  stopAlleen: "Almost everyone comes alone. You take a seat and the conversation starts by itself.",
  wie: {
    title: "Who are you bringing?",
    options: { friend: "A friend", partner: "My partner", family: "Family", colleague: "A colleague" },
  },
  stopWie: {
    friend: "Nice. You sit together, with a few new faces around you.",
    partner: "You sit together at the table, among new people.",
    family: "Joining together. Often the best stories of the afternoon.",
    colleague: "Away from work for once, with a good glass.",
  },
  taal: {
    title: "Which language do you prefer at the table?",
    options: { dutch: "Dutch", english: "English", both: "Either is fine" },
  },
  dieet: {
    title: "Any dietary needs?",
    options: {
      vegetarian: "Vegetarian",
      vegan: "Vegan",
      gluten_free: "Gluten-free",
      lactose_free: "Lactose-free",
      nut_allergy: "Nut allergy",
      other: "Other",
      none: "None",
    },
    note: "We'll pass it on to the venue.",
    otherLabel: "What should we know?",
    otherPlaceholder: "For example no fish",
  },
  formats: {
    title: "Coming soon at MyTable. Which would you like to join?",
    options: {
      wine_tasting: { title: "Wine tasting", body: "Taste special wines with matching bites." },
      wine_walk: { title: "Wine walk", body: "Walk past the nicest wine bars with a small group." },
      chefs_special: { title: "Chef's Table", body: "The chef cooks their best dishes in small courses." },
      sunday_only: { title: "Just Sunday Table", body: null },
    },
    note: "These formats come later. You'll be the first to hear once there's a date.",
  },
  bron: {
    title: "How did you hear about us?",
    options: {
      instagram: "Instagram",
      facebook: "Facebook",
      friends: "Through friends",
      google: "Google",
      other: "Other",
    },
  },
  stopReviews: { eyebrow: "At the table", title: "What guests say" },
  klaar: {
    title: "Ready to join 4 to 6 new people at the table?",
    options: { yes: "Yes, please", unsure: "Not sure yet" },
  },
  zoeken: {
    title: "Finding your table",
    items: ["Your city", "Your age group", "Your table"],
  },
  kies: {
    title: "Choose your Sunday",
    sub: (city) => `Tables in and near ${city}, for your age group.`,
    inCity: (city) => `In ${city}`,
    nearby: "Nearby",
    comingSoon: "Coming soon",
    spotsOpen: "Seats available",
    soonBadge: "Coming soon",
    perSeat: (price) => `€${price} per seat`,
    seats: "Seats",
    seatOption: (n) => (n === 1 ? "1 seat" : "2 seats"),
    onlyOneLeft: "Only 1 seat left at this table.",
    total: (price) => `Total €${price}`,
    reserve: "Reserve",
    reserving: "One moment...",
    guarantee:
      "Free to move up to 7 days before. If the table doesn't go ahead, you get your money back automatically.",
    notify: "Keep me posted",
    notified: "Noted. You'll be the first to hear.",
    unsure: "No rush. You can always come back via Log in.",
    noMatch: (city) =>
      `You're on the list. As soon as a table opens in ${city}, you'll be the first to hear.`,
    share: "Share with a friend",
    shareTitle: "Sunday Table",
    shareText: "A Sunday afternoon at the table with new people. Want to join?",
    shareCopied: "Link copied.",
    dutchTableNote: "This table is held in Dutch.",
    dutchFine: "Dutch is fine too",
    checkoutError: "That didn't work. Please try again.",
    where: "In a wine bar in the city. You'll hear where a week ahead.",
    selectAria: "Choose this table",
  },
};

export function getQuizCopy(locale: Locale): QuizCopy {
  return locale === "en" ? en : nl;
}
