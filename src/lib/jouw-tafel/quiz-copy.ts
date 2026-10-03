// Quiz copy (/jouw-tafel/start), Dutch and English. House rules: short,
// warm and calm, no em dashes, no exclamation marks, no emojis. Tables are
// mixed, drinks are never included, a venue is never named, and numbers are
// only ever live ones (rounded down).

import type { Locale } from "@/i18n/config";
import type {
  AgeMattersAnswer,
  GenderAnswer,
  TableTypeAnswer,
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
  gender: { title: string; options: Record<GenderAnswer, string> };
  tafeltype: { title: string; options: Record<TableTypeAnswer, string> };
  stad: {
    title: string;
    sub: string;
    geoHint: string;
    other: string;
    otherLabel: string;
    otherPlaceholder: string;
    otherError: string;
    /** Under the place field when nothing on the list matches. */
    noResults: string;
  };
  /** "Rotterdam, Den Haag en Zwolle" / "Rotterdam, The Hague and Zwolle". */
  joinCities: (cities: string[]) => string;
  stopStad: {
    /** One city: the title. */
    one: (city: string) => string;
    /** One city with a sign-up count. */
    count: (n: number, city: string) => string;
    /** Under the "{n}+" in the stat card (one city). */
    statLabel: (city: string) => string;
    /** Two or more cities with a combined count: the title. */
    multiTitle: string;
    /** Two or more cities without a count: the title. */
    multiFallbackTitle: string;
    /** Two or three cities: the combined (distinct) count, cities named. */
    countCities: (n: number, cities: string[]) => string;
    /** Four or more cities: the combined (distinct) count. */
    countMany: (n: number) => string;
    /** Always with two or more of our cities. */
    perCity: string;
    /** Only towns outside our cities: the title ("and {more} other cities"
     * with more than one). */
    otherTitle: (city: string, more: number) => string;
    /** Only towns outside our cities: the waitlist line (also the card on
     * the table list). */
    otherLine: (cities: string) => string;
    /** Our cities plus towns outside them: the extra line. */
    mixedLine: (cities: string) => string;
  };
  zoekt: { title: string; options: Record<WhyAnswer, string> };
  stopZoekt: Record<WhyAnswer, string>;
  gesprek: { title: string; options: Record<ConversationAnswer, string> };
  stopGesprek: { known: string; both: string };
  wijn: { title: string; options: Record<WineAnswer, string> };
  /** One line per wine answer. */
  stopWijn: Record<WineAnswer, string>;
  gezelschap: { title: string; options: Record<CompanionAnswer, string> };
  stopAlleen: string;
  /** After "Nog niet zeker". */
  stopTwijfel: { title: string; line: string };
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
    selectAria: string;
    /** Only towns outside our cities: heading above our cities' tables. */
    ourCities: string;
    /** Line 1 of a table card. */
    tableName: string;
    /** Under the subtitle when she prefers a women-only table. */
    girlsOnly: string;
    /** Our chosen cities without a table on the list (joined; n of them). */
    noSunday: (cities: string, n: number) => string;
    /** The link under the subtitle, and the sheet's title. */
    infoLink: string;
    infoClose: string;
    /** The sheet's lines; the price line only when there is a price. */
    infoLines: string[];
    infoPrice: (price: string, from: boolean) => string;
    infoLast: string;
  };
};

/** "a, b en c". */
function joinNl(items: string[]): string {
  return items.length <= 1 ? items[0] ?? "" : `${items.slice(0, -1).join(", ")} en ${items[items.length - 1]}`;
}

/** "a, b and c". */
function joinEn(items: string[]): string {
  return items.length <= 1 ? items[0] ?? "" : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

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
  gender: {
    title: "Hoe identificeer je jezelf?",
    options: { female: "Vrouw", male: "Man", other: "Anders", unspecified: "Zeg ik liever niet" },
  },
  tafeltype: {
    title: "Aan wat voor tafel schuif je het liefst aan?",
    options: { mixed: "Gemengd", girls_only: "Alleen vrouwen", any: "Maakt mij niet uit" },
  },
  stad: {
    title: "In welke stad wil je aanschuiven?",
    sub: "Kies alle steden waar je zou aanschuiven.",
    geoHint: "Klopt dit?",
    other: "Andere stad",
    otherLabel: "Welke stad?",
    otherPlaceholder: "Bijvoorbeeld Leiden",
    otherError: "Kies een plaats uit de lijst.",
    noResults: "Geen plaats gevonden.",
  },
  joinCities: (cities) => joinNl(cities),
  stopStad: {
    one: (city) => `Je bent niet de enige in ${city}.`,
    count: (n, city) => `In ${city} hebben zich al ${n}+ mensen aangemeld.`,
    statLabel: (city) => `aangemeld in ${city}`,
    multiTitle: "Je bent in goed gezelschap.",
    multiFallbackTitle: "Meer steden, meer zondagen.",
    countCities: (n, cities) => `In ${joinNl(cities)} hebben zich al ${n}+ mensen aangemeld.`,
    countMany: (n) => `In de steden die jij koos hebben zich al ${n}+ mensen aangemeld.`,
    perCity: "Straks zie je per stad welke zondagen er zijn.",
    otherTitle: (city, more) =>
      more === 0
        ? `We komen graag naar ${city}.`
        : `We komen graag naar ${city} en ${more} ${more === 1 ? "andere stad" : "andere steden"}.`,
    otherLine: (cities) =>
      `Je staat op de wachtlijst voor ${cities}. Zodra er genoeg aanmeldingen zijn, plannen we daar een zondag en hoor jij het als eerste.`,
    mixedLine: (cities) => `${cities} zetten we op de wachtlijst. Je hoort het als we daar starten.`,
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
    treat: "Een goed glas, goed gezelschap. Je verdient het.",
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
    red: "Een rode wijn op zondagmiddag. Daar zeggen we geen nee tegen.",
    white: "Een fris glas wit. Altijd een goed begin van de middag.",
    bubbles: "Bubbels op zondag. Dan wordt het vast gezellig.",
    none: "Helemaal goed. Je bestelt gewoon wat je lekker vindt.",
  },
  gezelschap: {
    title: "Kom je alleen of met iemand?",
    options: { alone: "Alleen", with: "Met iemand" },
  },
  stopAlleen: "Bijna iedereen komt alleen. Je schuift aan en het gesprek begint vanzelf.",
  stopTwijfel: {
    title: "Iedereen aan tafel is ook nieuw.",
    line: "De meeste gasten komen alleen, en bijna iedereen wil daarna nog een keer.",
  },
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
  stopReviews: { eyebrow: "Aan tafel", title: "Dit zeggen gasten na hun zondag." },
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
    sub: (city) => `Tafels in en rond ${city}.`,
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
      `Je bent aangemeld. Zodra er in ${city} een tafel opent, hoor je het als eerste.`,
    share: "Deel met een vriend",
    shareTitle: "Sunday Table",
    shareText: "Een zondagmiddag aan tafel met nieuwe mensen. Zin om mee te doen?",
    shareCopied: "Link gekopieerd.",
    dutchTableNote: "Deze tafel is Nederlandstalig.",
    dutchFine: "Nederlands is ook prima",
    checkoutError: "Dat lukte niet. Probeer het nog een keer.",
    selectAria: "Kies deze tafel",
    ourCities: "Of schuif aan in een van onze steden",
    tableName: "Sunday Table",
    girlsOnly: "Girls only tafels plannen we zodra er genoeg aanmeldingen zijn. Je hoort het als eerste.",
    noSunday: (cities, n) =>
      `${cities} ${n > 1 ? "hebben" : "heeft"} nog geen zondag gepland. Je hoort het als eerste zodra er een is.`,
    infoLink: "Wat is een Sunday Table?",
    infoClose: "Sluiten",
    infoLines: [
      "Een middag aan tafel met 4 tot 6 mensen in een goede wijnbar in jouw stad.",
      "Om 14:00 schuif je aan.",
      "Waar precies, hoor je een week van tevoren.",
    ],
    infoPrice: (price, from) => `Je plek kost ${from ? "vanaf " : ""}${price}. Je drankjes bestel en betaal je zelf aan tafel.`,
    infoLast: "De meeste gasten komen alleen. Kom je met iemand, dan zitten jullie samen.",
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
  gender: {
    title: "How do you identify?",
    options: { female: "Woman", male: "Man", other: "Other", unspecified: "Prefer not to say" },
  },
  tafeltype: {
    title: "What kind of table would you like to join?",
    options: { mixed: "Mixed", girls_only: "Women only", any: "I don't mind" },
  },
  stad: {
    title: "Which city would you like to join a table in?",
    sub: "Pick every city where you'd join a table.",
    geoHint: "Is this right?",
    other: "Another city",
    otherLabel: "Which city?",
    otherPlaceholder: "For example Leiden",
    otherError: "Pick a place from the list.",
    noResults: "No place found.",
  },
  joinCities: (cities) => joinEn(cities),
  stopStad: {
    one: (city) => `You're not the only one in ${city}.`,
    count: (n, city) => `${n}+ people in ${city} have already signed up.`,
    statLabel: (city) => `signed up in ${city}`,
    multiTitle: "You're in good company.",
    multiFallbackTitle: "More cities, more Sundays.",
    countCities: (n, cities) => `${n}+ people in ${joinEn(cities)} have already signed up.`,
    countMany: (n) => `${n}+ people have already signed up in the cities you picked.`,
    perCity: "Next, you'll see the Sundays in each city.",
    otherTitle: (city, more) =>
      more === 0
        ? `We'd love to come to ${city}.`
        : `We'd love to come to ${city} and ${more} other ${more === 1 ? "city" : "cities"}.`,
    otherLine: (cities) =>
      `You're on the waitlist for ${cities}. Once enough people sign up, we'll plan a Sunday there and you'll be the first to hear.`,
    mixedLine: (cities) => `We've put ${cities} on the waitlist. You'll hear from us when we start there.`,
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
    treat: "A good glass, good company. You've earned it.",
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
    red: "A red on a Sunday afternoon. We won't say no to that.",
    white: "A crisp glass of white. Always a good start to the afternoon.",
    bubbles: "Bubbles on a Sunday. That's bound to be a good time.",
    none: "Perfectly fine. You simply order what you like.",
  },
  gezelschap: {
    title: "Are you coming alone or with someone?",
    options: { alone: "Alone", with: "With someone" },
  },
  stopAlleen: "Almost everyone comes alone. You take a seat and the conversation starts by itself.",
  stopTwijfel: {
    title: "Everyone at the table is new too.",
    line: "Most guests come alone, and almost everyone wants to come back.",
  },
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
  stopReviews: { eyebrow: "At the table", title: "What guests say after their Sunday." },
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
    sub: (city) => `Tables in and around ${city}.`,
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
      `You're signed up. As soon as a table opens in ${city}, you'll be the first to hear.`,
    share: "Share with a friend",
    shareTitle: "Sunday Table",
    shareText: "A Sunday afternoon at the table with new people. Want to join?",
    shareCopied: "Link copied.",
    dutchTableNote: "This table is held in Dutch.",
    dutchFine: "Dutch is fine too",
    checkoutError: "That didn't work. Please try again.",
    selectAria: "Choose this table",
    ourCities: "Or join a table in one of our cities",
    tableName: "Sunday Table",
    girlsOnly: "We'll plan women-only tables once enough people sign up. You'll be the first to hear.",
    noSunday: (cities, n) =>
      `${cities} ${n > 1 ? "have" : "has"} no Sunday planned yet. You'll be the first to hear when there is one.`,
    infoLink: "What is a Sunday Table?",
    infoClose: "Close",
    infoLines: [
      "An afternoon at a table with 4 to 6 people in a good wine bar in your city.",
      "You take your seat at 14:00.",
      "You'll hear exactly where a week before.",
    ],
    infoPrice: (price, from) =>
      `Your seat costs ${from ? "from " : ""}${price}. You order and pay for your own drinks at the table.`,
    infoLast: "Most guests come alone. If you bring someone, you sit together.",
  },
};

export function getQuizCopy(locale: Locale): QuizCopy {
  return locale === "en" ? en : nl;
}
