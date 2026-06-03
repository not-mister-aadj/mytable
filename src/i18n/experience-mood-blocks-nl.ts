import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
} from "./types";

export const wineWalkFlowNl: ExperienceFlowStep[] = [
  {
    title: "Je eerste glas",
    description:
      "We starten samen op de eerste locatie met een korte intro en een eerste glas.",
  },
  {
    title: "Ontdek de stad",
    description:
      "Tussen de locaties wandel je op ontspannen tempo door de stad.",
  },
  {
    title: "Nieuwe gesprekken",
    description:
      "Aan iedere tafel ontstaan nieuwe gesprekken en ontmoetingen.",
  },
  {
    title: "Afsluiten zonder haast",
    description:
      "Vaak blijven mensen na afloop nog hangen voor een laatste drankje.",
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
      "Je wordt verwelkomd met een eerste glas en een korte uitleg over de proef.",
  },
  {
    title: "Proeverij in stappen",
    description:
      "Je proeft meerdere wijnen en bites in een rustig tempo, met ruimte voor vragen.",
  },
  {
    title: "Gesprekken aan tafel",
    description:
      "De tafel is klein genoeg voor intimiteit en groot genoeg voor nieuwe ontmoetingen.",
  },
  {
    title: "Afsluiten met proost",
    description:
      "We eindigen met een laatste glas. Wie wil blijft nog even napraten.",
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

export const wineWalkQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Ik kwam alleen en ging weg met drie nieuwe favoriete plekken in Rotterdam.",
    name: "Sophie",
    age: 34,
  },
  {
    quote:
      "Het voelde totaal niet ongemakkelijk. Gewoon een leuke zondag met goede gesprekken.",
    name: "Mark",
    age: 41,
  },
  {
    quote:
      "We wilden iets anders doen dan standaard uit eten. Dit voelde echt als een ervaring.",
    name: "Elise & Tom",
    detail: "Duo",
  },
];

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
      "Het menu was verrassend goed en de gesprekken liepen vanzelf door tot laat.",
    name: "Noor",
    age: 33,
  },
];

export const tastingQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Geen saaie proefles, wel echt leren proeven terwijl je gezellig aan tafel zit.",
    name: "Anna",
    age: 31,
  },
  {
    quote:
      "Perfecte zondagmiddag: niet te lang, niet te kort, en fijne mensen om je heen.",
    name: "Peter",
    age: 45,
  },
  {
    quote:
      "We gingen voor de wijn en bleven hangen voor de gesprekken. Zou zo weer doen.",
    name: "Kim & Sam",
    detail: "Duo",
  },
];

export const sundayQuotesNl: ExperienceGuestQuote[] = wineWalkQuotesNl;
export const mysteryQuotesNl: ExperienceGuestQuote[] = sharedDinnerQuotesNl;

export const rotterdamRouteStopsNl = [
  "Witte de With",
  "Westelijk Handelsterrein",
  "Oude Haven",
  "Meent",
];
