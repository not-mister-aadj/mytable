import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
} from "./types";

export const wineWalkFlowNl: ExperienceFlowStep[] = [
  {
    title: "Start bij de eerste locatie",
    description:
      "We beginnen op de eerste locatie met een korte introductie, zodat iedereen rustig kan landen.",
  },
  {
    title: "Proef onderweg",
    description:
      "Bij iedere stop staat er iets klaar om te proeven. Denk aan wijn, bites of een kleine pairing.",
  },
  {
    title: "Wandel op rustig tempo",
    description:
      "Tussen de locaties wandel je samen door de stad. Geen haast, geen strak programma.",
  },
  {
    title: "Ontmoet nieuwe mensen",
    description:
      "Omdat je onderweg wisselt van plek en gesprek, voelt ontmoeten natuurlijk en ontspannen.",
  },
];

export const chefsSpecialFlowNl: ExperienceFlowStep[] = [
  {
    title: "Schuif aan",
    description:
      "Je komt aan bij het restaurant en wordt ontvangen aan de MyTable-tafel.",
  },
  {
    title: "Laat je verrassen",
    description:
      "De chef of het restaurant serveert een speciaal menu of meerdere gangen.",
  },
  {
    title: "Eet samen",
    description:
      "De tafel is ingericht voor ontspannen gesprek, zonder dat het voelt als networking.",
  },
  {
    title: "Blijf hangen",
    description:
      "Na afloop kun je vaak nog blijven voor een drankje of verder praten.",
  },
];

export const sharedDinnerFlowNl: ExperienceFlowStep[] = [
  {
    title: "Welkom aan tafel",
    description:
      "Je begint met een drankje en een korte intro, zodat iedereen meteen op zijn gemak is.",
  },
  {
    title: "Gedeeld menu",
    description:
      "Het restaurant serveert een doordacht menu terwijl gesprekken vanzelf op gang komen.",
  },
  {
    title: "Open tafel",
    description:
      "Iedereen zit aan dezelfde lange tafel. Geen speeches, geen verplicht smalltalk.",
  },
  {
    title: "Rustig afronden",
    description:
      "Na het dessert is er ruimte om door te praten of op tijd naar huis te gaan.",
  },
];

export const tastingFlowNl: ExperienceFlowStep[] = [
  {
    title: "Ontvangst & intro",
    description:
      "Je wordt verwelkomd met een eerste glas. De host legt kort uit wat de chef voor de tafel heeft bedacht.",
  },
  {
    title: "Chef's special aan tafel",
    description:
      "Het restaurant serveert specials voor de hele groep, wijn en bites die bij elkaar passen, op eigen tempo.",
  },
  {
    title: "Gesprekken aan tafel",
    description:
      "De tafel is klein genoeg voor intimiteit en groot genoeg voor nieuwe ontmoetingen.",
  },
  {
    title: "Afsluiten zonder haast",
    description:
      "Plan de hele middag in. Veel groepen houden het daarna nog gezellig, nawijnen, borrelen of ergens uit eten.",
  },
];

export const sundayFlowNl: ExperienceFlowStep[] = [
  {
    title: "Zondagse start",
    description:
      "Koffie, brunch en een warm welkom voordat de tafel echt vol wordt.",
  },
  {
    title: "Langzaam tempo",
    description:
      "Geen haast: de middag is bedoeld om te ontspannen en bij te komen.",
  },
  {
    title: "Nieuwe gezichten",
    description:
      "Aan tafel ontmoet je mensen die ook zin hebben in een ontspannen zondag.",
  },
  {
    title: "Zachte afronding",
    description:
      "Vaak blijft de tafel nog even zitten voor een laatste kopje of glas.",
  },
];

export const mysteryFlowNl: ExperienceFlowStep[] = [
  {
    title: "Ontvangst op geheime locatie",
    description:
      "Na boeking ontvang je de details. Je weet waar je moet zijn, niet per se waar je eindigt.",
  },
  {
    title: "Verrassingsmenu",
    description:
      "Het restaurant serveert een avond die past bij de sfeer van de mystery tafel.",
  },
  {
    title: "Gedeelde tafel",
    description:
      "Je schuift aan bij mensen die ook zin hebben in iets anders dan standaard uit eten.",
  },
  {
    title: "Onthulling achteraf",
    description:
      "Na de avond delen we vaak waar je bent geweest, zodat je de plek terug kunt vinden.",
  },
];

export const tastingQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Ik dacht dat het misschien awkward zou worden, maar binnen tien minuten voelde het normaal. Vier wijnen, lekkere bites, en geen gedoe.",
    name: "Anna",
    age: 31,
  },
  {
    quote:
      "Oké wacht… veel leuker dan ik had verwacht. Ruim twee uur geproefd en gekletst, op ons tempo. Waarom heb ik dit niet eerder gedaan?",
    name: "Petra",
    age: 45,
  },
  {
    quote:
      "We kwamen voor de wijn en bleven hangen voor de gesprekken. Gewoon gezellig, zonder dat iemand je test op wijnkennis.",
    name: "Kim & Sam",
    detail: "Duo",
  },
];

export const wineWalkQuotesNl: ExperienceGuestQuote[] = tastingQuotesNl;

export const sharedDinnerQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Alsof je uit eten gaat met vrienden die je nog niet kent. Precies de juiste sfeer.",
    name: "Lisa",
    age: 29,
  },
  {
    quote:
      "Ik was nerveus om alleen te komen, maar binnen tien minuten voelde het normaal.",
    name: "David",
    age: 36,
  },
  {
    quote:
      "De chef's specials waren verrassend goed en de gesprekken liepen vanzelf door tot laat.",
    name: "Noor",
    age: 33,
  },
];

export const sundayQuotesNl: ExperienceGuestQuote[] = tastingQuotesNl;
export const mysteryQuotesNl: ExperienceGuestQuote[] = sharedDinnerQuotesNl;

export const rotterdamRouteStopsNl = [
  "Witte de With",
  "Westelijk Handelsterrein",
  "Oude Haven",
  "Meent",
];
