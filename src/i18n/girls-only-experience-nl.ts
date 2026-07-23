import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
  ExperienceMoodContent,
} from "./types";

export const girlsOnlyTastingFlowNl: ExperienceFlowStep[] = [
  {
    title: "Boek online",
    description:
      "Kies je plek, betaal vooraf en je ontvangt direct een bevestiging per mail. Geen wachtlijst, geen gedoe.",
  },
  {
    title: "Geef je wensen door",
    description:
      "Dieetwensen of allergieën? Geef het bij boeken door. Tot 48 uur van tevoren kun je nog gratis ruilen naar een andere datum.",
  },
  {
    title: "Schuif zondag aan",
    description:
      "De host verwelkomt je aan tafel. Vier wijnen en bijpassende bites komen naar je toe: solo, met vriendin of aan jullie eigen vriendinnentafel.",
  },
];

export const girlsOnlyTastingQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Ik kwam solo en was echt nerveus. Binnen tien minuten zat ik al te kletsen, alsof ik vriendinnen had meegenomen.",
    name: "Lisa",
    detail: "solo, Rotterdam",
  },
  {
    quote:
      "Alles was al betaald. Geen gedoe met de rekening, geen menu-ruzie. Gewoon genieten met mijn meiden.",
    name: "Sanne",
    detail: "groep van 4",
  },
  {
    quote:
      "Met mijn vriendin geboekt voor €39 p.p. Scheelde flink t.o.v. solo. Waarom hebben we dit niet eerder gedaan?",
    name: "Noor",
    detail: "duo",
  },
  {
    quote:
      "Mijn vriendinnen konden niet, dus solo gegaan. Het voelde alsof ik met gezellige meiden uit eten was. Niet awkward, gewoon fijn.",
    name: "Emma",
    detail: "solo",
  },
];

export const girlsOnlyTastingsMoodNl: Partial<ExperienceMoodContent> = {
  tagline:
    "Vier wijnen en bite-pairings, gezellig met je meiden aan tafel.",
  description:
    "Een zondagmiddag met vier wijnen en bite-pairings, gekozen door de wijnbar. Jullie genieten aan één tafel: solo, met vriendin of met je groep. Geen wijnexamen, wel een gezellige middag. Plan gerust de hele middag. En soms? Dan gaat het daarna nog door: nawijnen, borrelen of ergens lekker uit eten.",
  experienceFlow: girlsOnlyTastingFlowNl,
  guestQuotes: girlsOnlyTastingQuotesNl,
  whatToExpect: [
    {
      title: "Vier wijnen, gekozen door de wijnbar",
      description:
        "De wijnbar stelt de proeverij samen: vier wijnen met bijpassende bite-pairings. Jullie hoeven alleen op te komen dagen.",
    },
    {
      title: "Eigen vriendinnentafel of aanschuiven",
      description:
        "Met 3+ vriendinnen? Jullie eigen tafel. Solo of met z'n tweeën? Wij schuiven je aan bij gezellige meiden.",
    },
    {
      title: "Eén plek, één zondagmiddag",
      description:
        "Geen stops door de stad. Alles gebeurt op één zorgvuldig gekozen wijnbar.",
    },
    {
      title: "Solo? Ook prima",
      description:
        "Geen volledige groep? Boek solo of met een vriendin en schuif aan bij andere girls. MyTable regelt je plek.",
    },
    {
      title: "Op eigen tempo",
      description:
        "Plan de hele middag in. Geen strak schema. En soms pakt de groep het zelf nog lekker vast met nawijnen of ergens uit eten.",
    },
  ],
  socialParagraphs: [
    "Boek een tafel voor je groep en geniet van een zondagmiddag uit met je meiden. Jij reserveert, wij regelen wijn, bites en de tafel.",
    "Proeven, lachen, bijpraten. Geen netwerkpraat en geen speeddating-sfeer. Gewoon een fijne girls-only zondagmiddag.",
  ],
  faq: [
    {
      question: "Wanneer zijn de events?",
      answer:
        "Altijd op zondag, in de middag. De exacte tijd staat op je tafelkaart en in je bevestigingsmail.",
    },
    {
      question: "Wat kost het en wat krijg ik ervoor?",
      answer:
        "Alleen €49 per persoon; met z'n tweeën €39 per persoon (duo-tarief). Per persoon krijg je vier wijnen met bijpassende bites, een hele zondagmiddag aan tafel en alles vooraf geregeld. Geen rekening aan tafel.",
    },
    {
      question: "Kan ik solo komen?",
      answer:
        "Ja, en je bent niet de enige. Veel girls boeken solo of met één vriendin. Wij schuiven je aan bij een gezellige tafel met andere meiden.",
    },
    {
      question: "Kan ik annuleren of ruilen?",
      answer:
        "Annuleren is niet mogelijk. Wel kun je gratis ruilen naar een andere datum tot 48 uur voor de start. Alles betaal je vooraf bij het reserveren.",
    },
    {
      question: "Kan ik dieetwensen doorgeven?",
      answer:
        "Ja. Geef het bij boeken door. Het restaurant houdt er rekening mee waar dat kan.",
    },
    {
      question: "Waar vindt de proeverij plaats?",
      answer:
        "In één partnerrestaurant per stad. De exacte locatie staat op je boekingsbevestiging.",
    },
    {
      question: "Met hoeveel vriendinnen kan ik komen?",
      answer:
        "Met 3 of meer reserveer je jullie eigen vriendinnentafel. Solo of met z'n tweeën schuif je aan bij anderen. Kleine tafels, meestal 8 tot 14 vrouwen per middag.",
    },
  ],
};

export const girlsOnlyExperienceLabelsNl = {
  heroBenefitBullets: [
    "Vier wijnen + gepaarde bites aan tafel",
    "Girls Only · solo mag, vriendinnen welkom",
    "Alles vooraf betaald · geen rekening aan tafel",
  ],
  includedEyebrow: "Wat zit erin",
  includedTitle: "Alles geregeld voor jullie middag uit",
  includedSubtitle:
    "Eén restaurant, één tafel. Jij reserveert, wij regelen wijn, bites en gezellige meiden.",
  includedItems: [
    { value: "4", label: "wijnen" },
    { value: "4", label: "bites" },
    { value: "1", label: "restaurant" },
    { value: "100%", label: "vooraf betaald" },
  ],
  flowEyebrow: "Goed om te weten",
  flowTitle: "Hoe werkt het?",
  guestQuotesEyebrow: "Echte verhalen",
  guestQuotesTitle: "Wat andere meiden zeggen",
  midCtaEyebrow: "Kaartjes kopen",
  midCtaTitle: "Klaar voor zondagmiddag wijnspijs?",
  midCtaTrustLine:
    "Gratis ruilen tot 48 uur van tevoren · Alles vooraf betaald · Dieetwensen mogelijk",
  venuesTitle: "Waar je aan tafel schuift",
  venuesSubtitle:
    "Eén zorgvuldig gekozen partnerrestaurant per stad. Superleuk aan tafel: vier wijnen, gepaarde bites en gezellige meiden.",
  pillSoloTogether: "Solo of met je vriendinnen",
  socialTitle: "Girls-only wijnspijs op zondagmiddag.",
  socialSubtitle:
    "Eigen tafel met je groep, of aanschuiven als je geen volledige groep hebt.",
  finalCtaHeadline: "Klaar voor je volgende zondagmiddag wijnspijs?",
  finalCtaSubheadline:
    "Vier wijnen, gepaarde bites en gezelligheid met je meiden. Zonder datumprikkers, zonder gedoe.",
  bookingSeatingOwn: "Met mijn vriendinnen, eigen tafel",
  bookingSeatingOwnHint: "Jullie tafel, jullie crew. Wijn, bites, geen gedoe.",
  bookingSeatingJoin: "Ik schuif aan bij anderen",
  bookingSeatingJoinHint:
    "Solo of met een vriendin. MyTable regelt je plek aan tafel.",
  bookingTiers: {
    legend: "Hoe kom je?",
    perPerson: "€{price} p.p.",
    perPersonFrom: "Vanaf €{price} p.p.",
    bestValue: "Beste keuze",
    mostChosen: "Meest gekozen",
    seatOne: "1 plek",
    seatOther: "{count} plekken",
    seatsFrom: "Vanaf {count} plekken",
    groupSeatsLabel: "Aantal plekken",
    seatsJoinOthers: "schuif aan bij anderen",
    seatsOwnTable: "jullie eigen tafel",
    soloTitle: "Solo & schuif aan",
    duoTitle: "Twee is feest, schuif aan",
    groupTitle: "Vriendinnentafel, jullie eigen tafel",
    soloCta: "Reserveer mijn plek",
    duoCta: "Reserveer onze plekken",
    groupCta: "Reserveer onze tafel",
  },
  bookingTrustBullets: [
    "Alles vooraf betaald",
    "Gratis ruilen tot 48 uur van tevoren",
    "Dieetwensen mogelijk",
    "Met je vriendinnen of solo",
  ],
  practicalValues: {
    solo: "Geen groep? Solo of met een vriendin aanschuiven kan ook",
    groupSize: "Kleine tafels, meestal 8 tot 14 vrouwen per zondagmiddag",
  },
};

export const girlsOnlyWineTastingCardTextNl =
  "Je meiden, vier wijnen, één tafel. Jij reserveert, wij doen de rest.";

export const girlsOnlyWineTastingTaglineNl =
  "Girls-only wijnspijs op zondagmiddag. Zonder gedoe.";
