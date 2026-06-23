import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
  ExperienceMoodContent,
} from "./types";

export const girlsOnlyTastingFlowNl: ExperienceFlowStep[] = [
  {
    title: "Ontvangst & intro",
    description:
      "Je wordt verwelkomd met een eerste glas. De host legt kort uit wat de chef voor jullie tafel heeft bedacht.",
  },
  {
    title: "Proeven aan jullie tafel",
    description:
      "Vier wijnen en chef's bites, afgestemd op elkaar. Jullie zitten samen aan een eigen tafel en bepalen zelf het tempo.",
  },
  {
    title: "Gezelligheid zonder gedoe",
    description:
      "Geen menu-ruzie, geen rekening verdelen. Gewoon proeven, lachen en bijpraten zoals bij een avond uit met je meiden.",
  },
  {
    title: "Afsluiten zonder haast",
    description:
      "Reken op twee tot drie uur. Wie wil blijft nog even napraten aan de bar.",
  },
];

export const girlsOnlyTastingQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Precies zo'n avond als we zochten. Vier wijnen, lekkere bites en nergens over hoeven nadenken.",
    name: "Lisa",
    detail: "met 3 vriendinnen",
  },
  {
    quote:
      "Met mijn zus en twee vriendinnen gereserveerd. Eigen tafel, alles geregeld. We zaten de hele avond te proeven en te kletsen.",
    name: "Sanne",
    detail: "groep van 4",
  },
  {
    quote:
      "Geen groep beschikbaar, dus solo gegaan. Toch een hele fijne avond. Het draaide vooral om de wijn en de sfeer.",
    name: "Noor",
    detail: "solo",
  },
];

export const girlsOnlyTastingsMoodNl: Partial<ExperienceMoodContent> = {
  tagline: "Girls-only wijnspijs met je vriendinnen. Zonder gedoe.",
  description:
    "Een avond wijn en bites met je meiden aan één tafel. Vier wijnen, chef's specials en alles rond de tafel geregeld. Geen wijnles, wel context en ruimte om op jullie tempo te genieten, meestal twee tot drie uur.",
  experienceFlow: girlsOnlyTastingFlowNl,
  guestQuotes: girlsOnlyTastingQuotesNl,
  whatToExpect: [
    {
      title: "Wijn en bites geregeld",
      description:
        "Vier wijnen en bites van de chef. Wij regelen alles rond de tafel. Jullie hoeven alleen op te komen dagen.",
    },
    {
      title: "Jullie eigen tafel",
      description:
        "Reserveer voor je groep en zit samen aan een eigen tafel. Twee, vier of meer: jullie bepalen wie erbij is.",
    },
    {
      title: "Eén restaurant, één avond",
      description:
        "Geen stops door de stad. Alles speelt zich af op één plek die we zorgvuldig kiezen.",
    },
    {
      title: "Solo? Ook prima",
      description:
        "Geen volledige groep? Boek solo of met een vriendin en schuif aan bij andere girls. MyTable regelt je plek.",
    },
    {
      title: "Toegankelijke uitleg",
      description:
        "Onze host deelt achtergrond over de wijnen zonder dat het een examen wordt.",
    },
    {
      title: "Op eigen tempo",
      description:
        "Reken op twee tot drie uur. Geen strak schema, ruimte om te proeven, praten en na te genieten.",
    },
  ],
  socialParagraphs: [
    "Boek een tafel voor je groep en geniet van een avond die voelt als uit eten met je meiden.",
    "Proeven, lachen, bijpraten. Geen netwerkpraat en geen speeddating-sfeer. Gewoon een leuke girls' wine night.",
  ],
  faq: [
    {
      question: "Kan ik met mijn vriendinnen boeken?",
      answer:
        "Ja. Reserveer voor je groep en jullie zitten samen aan een eigen tafel. Twee, vier of meer: jullie bepalen wie erbij is.",
    },
    {
      question: "Wat als ik geen groep heb?",
      answer:
        "Boek solo of met een vriendin en schuif aan bij andere girls aan tafel. MyTable zorgt dat je aan een gezellige tafel belandt.",
    },
    {
      question: "Wat is een chef's special?",
      answer:
        "De chef bereidt gerechten en pairings speciaal voor jullie tafel. Geen standaard à-la-carte, wel iets dat bij de wijn en de groep past.",
    },
    {
      question: "Kan ik dieetwensen doorgeven?",
      answer:
        "Ja. Geef het bij boeken door. De chef past de specials aan waar dat kan.",
    },
    {
      question: "Waar vindt de proeverij plaats?",
      answer:
        "In één partnerrestaurant per stad. De exacte locatie staat op je boekingsbevestiging.",
    },
    {
      question: "Kan ik annuleren of ruilen?",
      answer:
        "Annuleren is niet mogelijk. Wel kun je gratis ruilen naar een andere datum tot 48 uur voor de start. Alles betaal je vooraf bij het reserveren.",
    },
  ],
};

export const girlsOnlyExperienceLabelsNl = {
  pillSoloTogether: "Met je vriendinnen · solo ook welkom",
  socialTitle: "Een girls' wine night met je meiden.",
  socialSubtitle:
    "Eigen tafel met je groep, of aanschuiven als je geen volledige groep hebt.",
  finalCtaHeadline: "Klaar voor je volgende girls' wine night?",
  finalCtaSubheadline:
    "Vier wijnen, chef's bites en een avond die voelt als uit eten met je vriendinnen.",
  bookingSeatingOwn: "Met mijn vriendinnen, eigen tafel",
  bookingSeatingOwnHint: "Jullie tafel, jullie crew. Wijn, bites, geen gedoe.",
  bookingSeatingJoin: "Ik schuif aan bij anderen",
  bookingSeatingJoinHint:
    "Solo of met een vriendin. MyTable regelt je plek aan tafel.",
  bookingTrustBullets: [
    "Alles vooraf betaald",
    "Gratis ruilen tot 48 uur van tevoren",
    "Dieetwensen mogelijk",
    "Met je vriendinnen of solo",
  ],
  practicalValues: {
    solo: "Geen groep? Solo of met een vriendin aanschuiven kan ook",
    groupSize: "Kleine tafels, meestal 8 tot 14 vrouwen per avond",
  },
};

export const girlsOnlyWineTastingCardTextNl =
  "Vier wijnen, chef's bites en een avond die voelt als uit eten met je meiden.";

export const girlsOnlyWineTastingTaglineNl =
  "Girls-only wijnspijs met je vriendinnen. Zonder gedoe.";
