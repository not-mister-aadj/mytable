import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
  ExperienceMoodContent,
} from "./types";

export const girlsOnlyTastingFlowNl: ExperienceFlowStep[] = [
  {
    title: "Welkom & intro",
    description:
      "Je wordt ontvangen met een eerste glas. De host vertelt kort wat de chef voor jullie tafel heeft bedacht.",
  },
  {
    title: "Proeven aan tafel",
    description:
      "Vier wijnen en chef's bites, bij elkaar gepaird. Jullie zitten aan jullie eigen tafel en bepalen het tempo.",
  },
  {
    title: "Gezellig, zonder gedoe",
    description:
      "Geen menu-ruzie, geen rekening splitsen. Gewoon proeven, lachen en bijpraten zoals een middag uit met je meiden.",
  },
  {
    title: "Afsluiten zonder haast",
    description:
      "Reken op twee tot drie uur. Blijf gerust nog even voor een drankje aan de bar.",
  },
];

export const girlsOnlyTastingQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Ik kwam solo en was echt nerveus. Maar binnen tien minuten zat ik al te kletsen. Veel leuker dan ik had verwacht.",
    name: "Lisa",
    detail: "met 3 vriendinnen",
  },
  {
    quote:
      "Met mijn zus en twee vriendinnen geboekt. Eigen tafel, alles geregeld. Waarom hebben we dit niet eerder gedaan?",
    name: "Sanne",
    detail: "groep van 4",
  },
  {
    quote:
      "Mijn vriendinnen konden niet, dus solo gegaan. Het voelde alsof ik met gezellige meiden uit eten was. Niet awkward, gewoon fijn.",
    name: "Noor",
    detail: "solo",
  },
];

export const girlsOnlyTastingsMoodNl: Partial<ExperienceMoodContent> = {
  tagline: "Girls-only wijnspijs op zondagmiddag. Zonder gedoe.",
  description:
    "Een zondagmiddag wijn en bites met je meiden aan één tafel. Vier wijnen, chef's specials, en alles rond de tafel geregeld. Geen wijnexamen, wel context en ruimte om op jullie tempo te genieten, meestal twee tot drie uur.",
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
      title: "Eén restaurant, één zondagmiddag",
      description:
        "Geen stops door de stad. Alles gebeurt op één zorgvuldig gekozen plek.",
    },
    {
      title: "Solo? Ook prima",
      description:
        "Geen volledige groep? Boek solo of met een vriendin en schuif aan bij andere girls. MyTable regelt je plek.",
    },
    {
      title: "Toegankelijke begeleiding",
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
    "Boek een tafel voor je vriendinnen en geniet van een zondagmiddag uit samen. Jij reserveert, wij regelen wijn, bites en de tafel.",
    "Proeven, lachen, bijpraten. Geen netwerkpraat en geen speeddating-sfeer. Gewoon een fijne girls-only zondagmiddag.",
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
      question: "Wanneer zijn de events?",
      answer:
        "Elke zondagmiddag, meestal tussen 12:00 en 17:00. De exacte tijd staat op je tafelkaart en in je bevestigingsmail.",
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
  socialTitle: "Girls-only wijnspijs op zondagmiddag.",
  socialSubtitle:
    "Eigen tafel met je groep, of aanschuiven als je geen volledige groep hebt.",
  finalCtaHeadline: "Klaar voor je volgende zondagmiddag wijnspijs?",
  finalCtaSubheadline:
    "Vier wijnen, chef's bites en gezelligheid met je vriendinnen. Zonder datumprikkers, zonder gedoe.",
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
    groupSize: "Kleine tafels, meestal 8 tot 14 vrouwen per zondagmiddag",
  },
};

export const girlsOnlyWineTastingCardTextNl =
  "Boek voor je vriendinnen. Vier wijnen, één tafel. Wij doen de rest.";

export const girlsOnlyWineTastingTaglineNl =
  "Girls-only wijnspijs op zondagmiddag. Zonder gedoe.";
