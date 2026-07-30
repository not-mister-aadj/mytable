import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
} from "./types";

export const wineWalkFlowNl: ExperienceFlowStep[] = [
  {
    title: "Tickets in de voorverkoop",
    description:
      "Je boekt vooraf via deze pagina. Na betaling ontvang je je bevestiging per mail. Ruilen kan tot 48 uur voor de start.",
  },
  {
    title: "Start bij het eerste restaurant",
    description:
      "Je komt op tijd bij de eerste locatie van je route. Daar toon je je ticket en geniet je van de eerste wijn-spijs combinatie.",
  },
  {
    title: "Door naar de volgende stop",
    description:
      "Klaar? Je loopt met je eigen gezelschap naar het volgende restaurant. Geen gids, wel een vaste route op eigen tempo.",
  },
  {
    title: "Proef bij elke plek",
    description:
      "Bij iedere stop staat een pairing klaar. Zo ontdek je meerdere restaurants in één middag, zonder keuzestress.",
  },
];

export const chefsSpecialFlowNl: ExperienceFlowStep[] = [
  {
    title: "Reserveer je tickets",
    description:
      "Je boekt vooraf voor jezelf of je gezelschap. Alles is betaald voordat je aankomt.",
  },
  {
    title: "Aankomst in het restaurant",
    description:
      "Je wordt ontvangen op de gereserveerde plek. De chef heeft de avond voor je samengesteld.",
  },
  {
    title: "Family style aan tafel",
    description:
      "Meerdere voor-, hoofd- en nagerechten komen in het midden. Jullie delen en proeven wat het huis te bieden heeft.",
  },
  {
    title: "Op eigen tempo",
    description:
      "Geen strak schema. Geniet van de avond; daarna kun je vaak nog nablijven voor een drankje.",
  },
];

export const sharedDinnerFlowNl: ExperienceFlowStep[] = [
  {
    title: "Boek je plekken",
    description:
      "Je reserveert tickets voor je eigen gezelschap. Betaling gebeurt vooraf.",
  },
  {
    title: "Welkom in het restaurant",
    description:
      "Je wordt ontvangen en krijgt een korte uitleg over het menu van de avond.",
  },
  {
    title: "Gedeeld menu",
    description:
      "Het restaurant serveert een doordacht menu. Gerechten worden gedeeld, zodat je meer proeft.",
  },
  {
    title: "Rustig afronden",
    description:
      "Na het dessert is er ruimte om na te praten of op tijd verder te gaan.",
  },
];

export const tastingFlowNl: ExperienceFlowStep[] = [
  {
    title: "Boek vooraf",
    description:
      "Je koopt tickets voor jezelf of je groep. Na betaling staat alles klaar in je bevestiging.",
  },
  {
    title: "Ontvangst met een eerste glas",
    description:
      "Je wordt verwelkomd in het restaurant. De host of wijnbar legt kort uit wat er op tafel komt.",
  },
  {
    title: "Vier wijnen met bites",
    description:
      "Je proeft vier wijnen met bijpassende hapjes, op één plek, op eigen tempo.",
  },
  {
    title: "Afsluiten zonder haast",
    description:
      "Plan de middag in. Extra bestellen kan vaak aan tafel; de bediening vertelt wat er mogelijk is.",
  },
];

export const sundayFlowNl: ExperienceFlowStep[] = tastingFlowNl;

export const mysteryFlowNl: ExperienceFlowStep[] = [
  {
    title: "Boek je avond",
    description:
      "Na boeking ontvang je de praktische details. Je weet waar je moet zijn.",
  },
  {
    title: "Verrassingsmenu",
    description:
      "Het restaurant serveert een avond die past bij de sfeer van de locatie.",
  },
  {
    title: "Jouw gezelschap, één tafel",
    description:
      "Je zit met wie je hebt geboekt. Wij regelen het restaurant en het menu.",
  },
  {
    title: "Details achteraf",
    description:
      "Na de avond kun je de locatie terugvinden via je bevestiging of onze follow-up.",
  },
];

export const tastingQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Vier wijnen, lekkere bites, geen gedoe. We hoefden nergens over na te denken.",
    name: "Anna",
    age: 31,
  },
  {
    quote:
      "Ruim twee uur geproefd op ons tempo. De pairings klopten; precies wat we zochten voor een zondagmiddag.",
    name: "Petra",
    age: 45,
  },
  {
    quote:
      "We kwamen voor de wijn en bleven hangen voor de sfeer. Geen examen, wel goede smaak.",
    name: "Kim & Sam",
    detail: "Duo",
  },
];

export const wineWalkQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Meerdere restaurants in één middag, zonder zelf te plannen. Elke stop een sterke pairing.",
    name: "Mark",
    age: 34,
  },
  {
    quote:
      "Het tempo was rustig, de route helder. Ideaal met vrienden: wandelen, proeven, verder.",
    name: "Sanne",
    age: 29,
  },
  {
    quote:
      "We ontdekten drie plekken die we anders nooit hadden bezocht. Alles vooraf geregeld.",
    name: "Tom & Eva",
    detail: "Duo",
  },
];

export const sharedDinnerQuotesNl: ExperienceGuestQuote[] = [
  {
    quote:
      "Family style was precies goed: meer proeven van de keuken zonder keuzestress.",
    name: "Lisa",
    age: 29,
  },
  {
    quote:
      "Het menu klopte van voor tot dessert. Fijn dat drank en dieetwensen duidelijk waren geregeld.",
    name: "David",
    age: 36,
  },
  {
    quote:
      "Alsof we een privéavond in het restaurant hadden, maar dan zonder organisatiestress.",
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
