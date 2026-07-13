import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
  ExperienceMoodContent,
} from "./types";

export const girlsOnlyTastingFlowNl: ExperienceFlowStep[] = [
  {
    title: "Welkom & intro",
    description:
      "Je wordt ontvangen met een eerste glas. De host vertelt kort welke wijnen het restaurant heeft gekozen en hoe ze gepaird zijn.",
  },
  {
    title: "Proeven aan tafel",
    description:
      "Vier wijnen en bijpassende bites, bij elkaar gepaird. Jullie zitten aan jullie eigen tafel en bepalen het tempo.",
  },
  {
    title: "Gezellig, zonder gedoe",
    description:
      "Geen menu-ruzie, geen rekening splitsen. Gewoon proeven, lachen en bijpraten zoals een middag uit met je meiden.",
  },
  {
    title: "Afsluiten zonder haast",
    description:
      "Plan de hele middag in. Soms gaat het daarna nog door — nawijnen, borrelen of ergens lekker uit eten met je meiden.",
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
    "Een zondagmiddag wijn en bites met je meiden aan één tafel. Het restaurant kiest vier wijnen en pairt ze met bites. Alles rond de tafel geregeld. Geen wijnexamen, wel context en ruimte om op jullie tempo te genieten — plan gerust de hele middag. En soms? Dan gaat het daarna nog door: nawijnen, borrelen of ergens lekker uit eten met je meiden.",
  experienceFlow: girlsOnlyTastingFlowNl,
  guestQuotes: girlsOnlyTastingQuotesNl,
  whatToExpect: [
    {
      title: "Wijn en bites geregeld",
      description:
        "Het restaurant kiest vier wijnen en pairt ze met bites. Wij regelen alles rond de tafel. Jullie hoeven alleen op te komen dagen.",
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
        "Plan de hele middag in. Geen strak schema — en soms pakt de groep het zelf nog lekker vast met nawijnen of ergens uit eten.",
    },
  ],
  socialParagraphs: [
    "Boek een tafel voor je groep en geniet van een zondagmiddag uit met je meiden. Jij reserveert, wij regelen wijn, bites en de tafel.",
    "Proeven, lachen, bijpraten. Geen netwerkpraat en geen speeddating-sfeer. Gewoon een fijne girls-only zondagmiddag.",
  ],
  faq: [
    {
      question: "Kan ik met mijn vriendinnen boeken?",
      answer:
        "Ja. Reserveer voor je groep en jullie zitten samen aan een eigen tafel. Twee, vier of meer: jullie bepalen wie erbij is.",
    },
    {
      question: "Met hoeveel vriendinnen kan ik komen?",
      answer:
        "Het mooiste is met je eigen groepje: twee, vier of meer, aan jullie eigen tafel. Nodig gerust je vriendinnen uit. Kom je solo of met een vriendin? Dat kan ook. Wil je aanschuiven bij andere girls, dan regelen wij een gezellige plek.",
    },
    {
      question: "Wanneer zijn de events?",
      answer:
        "Elke zondagmiddag, meestal tussen 12:00 en 17:00. De exacte tijd staat op je tafelkaart en in je bevestigingsmail.",
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
    "Vier wijnen, gepaarde bites en gezelligheid met je meiden. Zonder datumprikkers, zonder gedoe.",
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
  "Je meiden, vier wijnen, één tafel. Jij reserveert, wij doen de rest.";

export const girlsOnlyWineTastingTaglineNl =
  "Girls-only wijnspijs op zondagmiddag. Zonder gedoe.";
