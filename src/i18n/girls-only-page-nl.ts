import { listTopNlCityNames } from "@/data/nl-top-cities";
import type { GirlsOnlyPageLabels } from "./girls-only-page.types";

export const girlsOnlyPageNl: GirlsOnlyPageLabels = {
  socialPromise:
    "Meet the people you’ll make plans with. Wij regelen de tafel.",
  meta: {
    title: "MyTable · Vertel wat je zoekt | Sunday Table of culinaire ervaringen",
    description:
      "Zoek je nieuwe mensen op zondagmiddag, of liever Wine Walks en diners? Kies je pad - wij tonen precies wat bij je past.",
  },
  hero: {
    eyebrow: "MyTable",
    headlineLine1: "Vertel wat",
    headlineLine2: "je zoekt.",
    subtitle:
      "Nieuwe mensen leren kennen op zondag - of meteen culinaire wandelingen en tafels. Jij kiest; wij leiden je goed.",
    painHeadline: "Eén keuze. Geen agenda-overload.",
    microcopy:
      "Geen dating. Geen netwerkborrel. Wel goede smaak en goed gezelschap.",
    trustLine:
      "Gratis aanvraag · ±2 min · Vrijblijvend",
    imageAlt:
      "Mensen genieten samen van wijn aan een levendige MyTable-tafel",
    scarcityTemplate: "Nog {count} plekken voor {city} op {date}",
    featuredInHeroLabel: "Volgende Sunday Table",
  },
  intent: {
    brand: "MyTable",
    question: "Wat zoek je?",
    subtitle:
      "Kies je pad. We onthouden het - en tonen alleen wat ertoe doet.",
    meet: {
      id: "meet",
      title: "Nieuwe mensen ontmoeten",
      description:
        "Zondagmiddag Sunday Table - solo welkom, echte introducties, daarna plannen maken.",
      detailEyebrow: "Sunday Table · Community",
      detailTitle: "Word onderdeel van de tafel",
      detailBody:
        "Maandelijks zondagmiddag nieuwe gezichten. Lidmaatschap geeft vroege toegang tot Sunday Tables én 10% korting op alle culinaire ervaringen.",
      perks: [
        "Sunday Tables om nieuwe mensen te leren kennen",
        "10% korting op Wine Walks, proeverijen en diners",
        "Als eerste horen wanneer er plekken openen",
        "Solo welkom - wij regelen tafel en introducties",
      ],
      primaryCta: "Schrijf je in voor community + 10%",
      secondaryCta: "Hoe Sunday Table werkt",
    },
    culinary: {
      id: "culinary",
      title: "Culinaire ervaringen",
      description:
        "Wine Walks, proeverijen en diners - boeken met vrienden, partner of groep.",
      detailEyebrow: "Ervaringen · Agenda",
      detailTitle: "Alle culinaire tafels",
      detailBody:
        "Geen community-funnel nodig. Direct de agenda: wandelingen, proeverijen en diners in jouw stad.",
      perks: [
        "Wine Walks door de stad",
        "Proeverijen en chef-tafels",
        "Boek voor twee, groep of solo",
        "Duidelijke data, steden en prijzen",
      ],
      primaryCta: "Bekijk culinaire ervaringen",
      secondaryCta: "Liever eerst mensen ontmoeten?",
    },
    changePath: "Andere keuze",
  },
  cta: {
    viewAllSundays: "Reserveer je plek",
    choosePath: "Vertel wat je zoekt",
  },
  faq: {
    title: "Veelgestelde vragen",
    items: [
      {
        question: "Wat is het verschil tussen Sunday Table en culinaire ervaringen?",
        answer:
          "Sunday Table is onze community op zondagmiddag: nieuwe mensen ontmoeten. Culinaire ervaringen (Wine Walks, proeverijen, diners) boeken je in de agenda - met vrienden, iemand die je ontmoette, of solo. Op de homepage kies je eerst welk pad bij je past.",
      },
      {
        question: "Wat houdt het lidmaatschap / de 10% korting in?",
        answer:
          "Wie via het community-pad inschrijft, komt op de lijst voor Sunday Tables én early access. Lidmaatschap geeft 10% korting op culinaire ervaringen. De korting wordt zichtbaar zodra je lidmaatschap actief is; tot die tijd zetten we je klaar op de wachtlijst.",
      },
      {
        question: "Wat is een Sunday Table?",
        answer:
          "Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.",
      },
      {
        question: "Kan ik ook alleen komen?",
        answer:
          "Ja - dat is juist het punt van Sunday Table. Veel gasten komen solo. Wij regelen tafel, host en introducties. Later boek je premium ervaringen graag met mensen die je hier leerde kennen, of met je eigen vrienden.",
      },
      {
        question: "Is dit dating of netwerken?",
        answer:
          "Nee. MyTable is hospitality: goede smaak, goed gezelschap en gedeelde ervaringen. Geen speeddating en geen zakelijke netwerkborrel.",
      },
      {
        question: "Wat is het verschil tussen girls only en gemengd?",
        answer:
          "Dat is een tafelvoorkeur. Bij girls only schuiven alleen vrouwen aan. Bij gemengd is iedereen welkom. Het concept - tafel, host, wijn - blijft hetzelfde.",
      },
      {
        question: "Hoe werkt de stap naar premium ervaringen?",
        answer:
          "Na Sunday Table plan je samen een Wine Walk, proeverij of diner. Boek met vrienden, iemand die je aan tafel leerde kennen, of individueel. Groepen zijn welkom en maken het makkelijker om een tafel te vullen.",
      },
      {
        question: "Kan ik met mijn vriendinnen of groep boeken?",
        answer:
          "Zeker. Op premium ervaringen kies je met z’n tweeën, met een groep, of een hele tafel. Plekken in één boeking zitten samen.",
      },
      {
        question: "Wanneer zijn de Sunday Tables?",
        answer:
          "Rond de eerste zondag van de maand, meestal ’s middags. Exacte data staan in de agenda en op je tafelkaart.",
      },
      {
        question: "Waar vindt het plaats?",
        answer:
          "In een partnerrestaurant. De stad staat op de tafelkaart. Na je boeking mailen we locatie, tijd en praktische info.",
      },
      {
        question: "Moet ik veel van wijn weten?",
        answer:
          "Nee. Nieuwsgierigheid is genoeg. De host deelt context zonder dat het een les wordt.",
      },
      {
        question: "Kan ik dieetwensen doorgeven?",
        answer:
          "Ja. Geef het door bij het reserveren. De chef past waar mogelijk aan.",
      },
      {
        question: "Kan ik annuleren of ruilen?",
        answer:
          "Annuleren is niet mogelijk. Wel kun je gratis ruilen naar een andere datum tot 48 uur voor de start. Alles betaal je vooraf.",
      },
    ],
  },
  headerNav: {
    tables: "Sunday Tables",
    howItWorks: "Hoe het werkt",
    priorityList: "Wachtlijst",
    testimonials: "Wat gasten zeggen",
    faq: "FAQ",
    founder: "Ons verhaal",
  },
  howItWorks: {
    eyebrow: "Twee paden, één MyTable",
    title: "Eerst kiezen, dan pas boeken",
    subtitle:
      "Community op zondag, of meteen de culinaire agenda. Zo verkopen we je nooit het verkeerde.",
    highlights: [
      "Pad 1: Sunday Table → nieuwe mensen → lidmaatschap met 10%",
      "Pad 2: Wine Walks, proeverijen en diners in de agenda",
      "Jij kiest in één klik wat je zoekt",
      "Wij tonen daarna alleen wat past",
    ],
    cta: "Kies je pad",
  },
  benefits: {
    title: "Waarom gasten boeken",
    subtitle:
      "Duidelijke tafel. Goede host. En daarna plannen die blijven.",
    items: [
      {
        title: "Kom solo - niemand zit alleen",
        description:
          "Sunday Table is gemaakt om nieuwe mensen te ontmoeten. Wij regelen tafel, host en introducties.",
      },
      {
        title: "Daarna samen verder",
        description:
          "Nodig iemand uit die je aan tafel leerde kennen, of breng je eigen vrienden mee naar een Wine Walk, proeverij of diner.",
      },
      {
        title: "Alles all-in voor €49",
        description:
          "Wijn, hapjes en host inbegrepen. Geen verrassingen. Gratis ruilen tot 48 uur van tevoren.",
      },
      {
        title: "Geen dating, geen netwerkborrel",
        description:
          "Hospitality met goede smaak en goed gezelschap. Plekken zijn beperkt - boek op tijd.",
      },
    ],
  },
  events: {
    title: "Kies je Sunday Table",
    subtitle:
      "Eén moment per stad. Kies je datum, check de plekken en plan je tafel.",
    empty:
      "Er komen regelmatig nieuwe Sunday Tables bij. Kom binnenkort terug of join de wachtlijst.",
    viewAll: "Alles bekijken",
  },
  sundayTable: {
    eyebrow: "Sunday Table",
    title: "Meet the people you’ll make plans with.",
    body: "Join een warme tafel elke eerste zondag van de maand. Kom solo, ontmoet nieuwe mensen en ontdek met wie je je volgende ervaring wilt delen.",
  },
  premium: {
    eyebrow: "Daarna: culinaire ervaringen",
    title: "Bring your table together again.",
    body: "Na Sunday Table boek je een Wine Walk, proeverij of diner - met mensen die je hier leerde kennen, of met je eigen groep.",
    cta: "Bekijk culinaire ervaringen",
  },
  nextTable: {
    eyebrow: "Volgende stap",
    title: "Met wie deel je de volgende tafel?",
    body: "Iemand ontmoet die je graag opnieuw zou zien? Kies samen een Wine Walk, proeverij of diner.",
    cta: "Bekijk culinaire ervaringen",
    shareWhatsapp: "Deel via WhatsApp",
    copyLink: "Kopieer link",
    copied: "Gekopieerd",
  },
  presaleSignup: {
    title: "Join de wachtlijst",
    subtitle:
      "Sunday Tables en premium ervaringen raken snel vol. Schrijf je in en hoor als eerste wanneer er plekken openen in jouw stad.",
    nameLabel: "Naam",
    namePlaceholder: "Je voornaam",
    citiesLabel: "Waar wil je aan tafel?",
    citiesHint: "Kies één of meerdere steden",
    citiesRequired: "Kies minstens één stad",
    cities: listTopNlCityNames(),
    emailLabel: "E-mail",
    emailPlaceholder: "je@email.nl",
    cta: "Houd me op de hoogte",
    success:
      "Je staat op de lijst. We mailen je zodra er plekken openen.",
    error: "Aanmelden mislukt. Probeer het later opnieuw.",
  },
  testimonials: {
    eyebrow: "Wat gasten zeggen",
    title: "Van nieuwe gezichten naar echte plannen",
  },
  founderStory: {
    eyebrow: "Het verhaal achter MyTable",
    title: "Hoi, ik ben Elif",
    paragraphs: [
      "Ik was altijd al die ene die mensen aan elkaar koppelde. Feestje organiseren, groepen bij elkaar brengen, ervoor zorgen dat iedereen zich fijn voelt.",
      "MyTable is waar goede smaak en goed gezelschap samenkomen. Sunday Table helpt je nieuwe mensen te ontmoeten. Daarna boek je samen de ervaringen die ertoe doen.",
      "Geen datingplatform, geen netwerkborrel. Gewoon proeven, lachen en plannen maken rond de tafel.",
      "Rechts op de foto zie je Siraadj, mijn boyfriend. Hij regelt alle technische dingen en het camerawerk.",
    ],
    signOff: "Elif, gastvrouw bij MyTable",
    imageAlt: "Elif en Siraadj aan tafel tijdens een gezellig evenement",
  },
  finalCta: {
    title: "Nog geen keuze gemaakt?",
    subtitle:
      "Vertel wat je zoekt - community op zondag, of culinaire ervaringen. Wij leiden je goed.",
    button: "Vertel wat je zoekt",
  },
  status: {
    available: "Beschikbaar",
    almostFull: "Bijna vol",
    soldOut: "Uitverkocht",
    closed: "Uitverkocht",
    new: "Nieuw",
  },
  femaleOnlyBadge: "Girls only",
  reserveCta: "Reserveer",
  viewTableCta: "Plan je tafel",
  joinIndividuallyCta: "Individueel aanschuiven",
  perPersonFrom: "€{price} per persoon",
};
