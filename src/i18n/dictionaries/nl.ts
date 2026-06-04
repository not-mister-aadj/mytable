import type { Dictionary } from "../types";
import { images } from "@/data/images";
import { getCatalogExperiences } from "@/data/experience-catalog";
import { experiencePageNl } from "../experience-page-nl";

const catalogNl = getCatalogExperiences("nl");

export const nl: Dictionary = {
  meta: {
    title: "MyTable · Goed eten. Mooie wijnen. Gezellige tafels.",
    description:
      "Van wijnproeverijen tot chef's specials: ontdek sociale tafels op bijzondere locaties door heel Nederland.",
  },
  header: {
    nav: {
      experiences: "Beschikbare tafels",
      howItWorks: "Zo werkt het",
      forVenues: "Voor locaties",
      faq: "FAQ",
    },
    cta: "Aan tafel",
    languageSwitch: "EN",
    openMenu: "Menu openen",
    closeMenu: "Menu sluiten",
    homeAria: "MyTable home",
  },
  hero: {
    headlineLine1: "Goede smaak.",
    headlineLine2: "Goed gezelschap.",
    subheadline:
      "Wij regelen alles rond de tafel. Jij komt genieten. Van wijnproeverijen en chef-specials tot wijnwalks.",
    ctaPrimary: "Kies je tafel",
    microcopy:
      "Boek je eigen tafel, of schuif solo aan bij anderen. Met vrienden, op date, of alleen.",
    nextTableLabel: "Volgende tafel",
    imageAlt: "Mensen die samen aan tafel van wijn en eten genieten",
  },
  valueStrip: [
    "Gecureerde locaties",
    "Bord en glas die kloppen",
    "Solo of eigen tafel",
    "Ontspannen sfeer",
  ],
  experiences: {
    title: "Bekijk de tafels die je niet wilt missen",
    subtitle:
      "Kies je stad, reserveer je plek en schuif aan bij een tafel met goede smaak en goed gezelschap.",
    status: {
      available: "Beschikbaar",
      almostFull: "Bijna vol",
      soldOut: "Uitverkocht",
      new: "Nieuw",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserveer je plek",
    viewAllCta: "Bekijk alle aankomende tafels",
    items: catalogNl,
  },
  agenda: {
    hero: {
      title: "Vind een tafel die bij je past.",
      subtitle:
        "Wijnproeverijen in één restaurant. Girls only, of kom voor wijn en gezelschap: op date, solo of met vrienden.",
      supportLine:
        "Kom alleen, neem iemand mee, of schuif gewoon aan.",
    },
    tabsAriaLabel: "Kies je avond",
    tabs: [
      { id: "all", label: "Alle tafels" },
      { id: "girlsOnly", label: "Girls only" },
      { id: "mixed", label: "Date, wijn of solo" },
    ],
    tabHints: {
      all: "",
      girlsOnly:
        "Eén tafel, alleen vrouwen. Dezelfde proeverij, andere sfeer.",
      mixed:
        "Iedereen welkom. Kom voor de wijn, een date, met vrienden of gewoon alleen.",
    },
    grid: {
      title: "Bekijk de tafels die je niet wilt missen",
      subtitle:
        "Kies je stad, reserveer je plek en schuif aan bij een tafel met goede smaak en goed gezelschap.",
    },
    empty: {
      title: "Geen tafels gevonden",
      text: "Er zijn nog geen tafels voor dit filter. Kies een andere optie of bekijk alle tafels.",
      showAllCities: "Alle tafels tonen",
    },
    status: {
      available: "Beschikbaar",
      almostFull: "Bijna vol",
      soldOut: "Uitverkocht",
      new: "Nieuw",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserveer je plek",
    items: catalogNl,
  },
  concept: {
    title: "Meer dan alleen een reservering.",
    subtitle:
      "Wijnproeverij in één restaurant, chef's special voor de groep en een avond op eigen tempo. Wij regelen alles rond de tafel. Jij komt genieten.",
    cards: [
      {
        title: "Eén restaurant, één tafel",
        description:
          "Geen stops door de stad. Je proeft en eet op één plek die we zorgvuldig kiezen.",
      },
      {
        title: "Chef's special",
        description:
          "De chef bereidt specials voor iedereen aan tafel, wijn en spijs die bij elkaar passen.",
      },
      {
        title: "Girls only of gemengd",
        description:
          "Kies een tafel alleen voor vrouwen, of schuif aan bij een gemengde groep, solo, met vrienden of op date.",
      },
    ],
  },
  howItWorks: {
    title: "Zo werkt MyTable",
    steps: [
      {
        title: "Kies je tafel",
        description:
          "Girls only of gemengde groep. Wijnproeverij in één restaurant.",
      },
      {
        title: "Reserveer je plek",
        description:
          "Voor vrienden, een date, solo, of een plek aan een tafel die al staat.",
      },
      {
        title: "Kom aan tafel",
        description:
          "Je krijgt waar en wanneer. Plek, sfeer en alle details eromheen regelen wij.",
      },
      {
        title: "Geniet van de avond",
        description:
          "Chef's special, goede wijn en gezelschap, twee tot drie uur op eigen tempo.",
      },
    ],
  },
  venueDiscovery: {
    title: "Plekken met wijn en spijs",
    subtitle:
      "Echte adressen in Nederland, van Rotterdam tot Maastricht. Partnerlocaties van WijnSpijs waar wijn en spijs samenkomen.",
    places: [
      {
        name: "Proef bij Platenburg",
        city: "Rotterdam",
        image: images.restaurantDining,
      },
      {
        name: "Karaf",
        city: "Utrecht",
        image: images.wineBar,
      },
      {
        name: "UMAMI by Han",
        city: "Amsterdam",
        image: images.restaurantInterior,
      },
      {
        name: "Stadsherberg de Poshoorn",
        city: "Maastricht",
        image: images.wineGlasses,
      },
    ],
  },
  testimonials: {
    eyebrow: "Wat onze gasten zeggen",
    title: "Echte verhalen aan tafel",
  },
  venueCta: {
    title: "Breng MyTable naar jouw locatie.",
    subtitle:
      "MyTable helpt restaurants en wijnbars rustige momenten om te zetten in memorabele sociale ervaringen. Wij brengen nieuwsgierige gasten, verzorgen de gastbeleving en geven mensen een reden om jouw plek te ontdekken.",
    cta: "Word partner",
    benefits: [
      {
        title: "Vul geselecteerde momenten",
        description:
          "Maak van rustigere momenten levendige, memorabele sociale tafels.",
      },
      {
        title: "Bereik nieuwe lokale gasten",
        description:
          "Verbind met nieuwsgierige diners die sfeer en ontdekking waarderen.",
      },
      {
        title: "Creëer herhaalde ontdekking",
        description:
          "Geef mensen een reden om terug te komen, en anderen mee te nemen.",
      },
    ],
  },
  newsletter: {
    title: "Als eerste aan tafel.",
    subtitle:
      "Krijg vroegtijdig toegang tot nieuwe wijnproeverijen en tafels in jouw stad.",
    emailLabel: "E-mail",
    emailPlaceholder: "Je e-mailadres",
    cityLabel: "Stad",
    cta: "Op de lijst",
    success:
      "Bedankt. Je staat op de lijst. We nemen contact op zodra de volgende tafel in jouw stad opent.",
    cities: ["Rotterdam", "Den Haag", "Amsterdam", "Utrecht"],
  },
  faq: {
    title: "Veelgestelde vragen",
    items: [
      {
        question: "Wat is MyTable?",
        answer:
          "Wijnproeverijen aan één tafel in één partnerrestaurant. Je kiest een tafel (girls only of gemengde groep), reserveert je plek en schuift aan bij een kleine groep. Wij regelen alles rond de tafel; jij komt voor goede wijn, chef's specials en gezelligheid.",
      },
      {
        question: "Wat is het verschil tussen girls only en gemengd?",
        answer:
          "Bij girls only schuiven alleen vrouwen aan. Bij een gemengde groep is iedereen welkom: solo, met vrienden of op date. Het concept is hetzelfde, alleen de samenstelling van de groep verschilt.",
      },
      {
        question: "Kan ik alleen komen of iemand meenemen?",
        answer:
          "Beide kan. Veel gasten komen solo; anderen boeken voor zichzelf en een vriend(in), of schuiven aan bij een tafel die al staat. Het voelt normaal en ontspannen.",
      },
      {
        question: "Wat is een chef's special en wat is inbegrepen?",
        answer:
          "Geen vast à-la-carte-menu: de chef bereidt gerechten en pairings speciaal voor jouw tafel, passend bij de wijnproeverij. Meestal inbegrepen: proeverij, chef's special bites en een host aan tafel. Op elke tafelkaart staat precies wat je krijgt. Reken op twee tot drie uur op eigen tempo.",
      },
      {
        question: "Moet ik veel van wijn weten?",
        answer:
          "Nee. Nieuwsgierigheid is genoeg. Onze host deelt context over de wijnen zonder dat het een les wordt.",
      },
      {
        question: "Kan ik dieetwensen doorgeven?",
        answer:
          "Ja. Geef het door bij het reserveren. De chef past de specials aan waar dat kan.",
      },
      {
        question: "Waar vindt de proeverij plaats?",
        answer:
          "In één partnerrestaurant, geen route door de stad. De stad staat op de tafelkaart. Na je boeking stuur je per e-mail het restaurant, de tijd en praktische info.",
      },
      {
        question: "Hoe werkt betalen en ruilen?",
        answer:
          "Alles betaal je vooraf bij het reserveren. Annuleren is niet mogelijk. Wel kun je gratis ruilen naar een andere datum tot 48 uur voor de start. Mail ons als je wilt ruilen.",
      },
      {
        question: "Kan ik bijbestellen aan tafel?",
        answer:
          "Vaak wel: een extra gang, glas of bite. Sommige partnerlocaties verkopen ook de volledige fles van een wijn die je lekker vond. Dat verschilt per restaurant.",
      },
      {
        question: "Is dit dating of netwerken?",
        answer:
          "Nee. Het gaat om een ontspannen moment aan tafel met wijn, eten en gezellig gesprek. Geen zakelijke contacten en geen verplicht smalltalk.",
      },
      {
        question: "Kunnen restaurants partner worden?",
        answer:
          "Ja. Restaurants en wijnbars kunnen via Voor locaties contact opnemen om samenwerking te verkennen.",
      },
    ],
  },
  experiencePage: experiencePageNl,
  footer: {
    tagline: "Goede smaak. Goed gezelschap.",
    links: {
      experiences: "Beschikbare tafels",
      howItWorks: "Zo werkt het",
      forVenues: "Voor locaties",
      faq: "FAQ",
      instagram: "Instagram",
      contact: "Contact",
    },
    copyright: "Alle rechten voorbehouden.",
  },
};
