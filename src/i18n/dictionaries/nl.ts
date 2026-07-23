import type { Dictionary } from "../types";
import { images } from "@/data/images";
import { experiencePageNl } from "../experience-page-nl";
import { bookingOutcomeNl } from "../booking-outcome-nl";

export const nl: Dictionary = {
  meta: {
    title: "MyTable · Wijnproeverijen & gezellige tafels in Nederland",
    description:
      "Boek een wijnproeverij of chef's special aan één tafel. Girls only of gemengd, solo of met vriendinnen. Elke zondag in steden door heel Nederland.",
  },
  header: {
    nav: {
      girlsOnly: "Girls only",
      calendar: "Agenda",
      waitlist: "Wachtlijst",
    },
    languageSwitch: "EN",
    openMenu: "Menu openen",
    closeMenu: "Menu sluiten",
    homeAria: "MyTable home",
  },
  hero: {
    headlineLine1: "Goede smaak.",
    headlineLine2: "Goed gezelschap.",
    subheadline:
      "Elke zondagmiddag: wijnproeverijen en chef's specials aan één tafel. Wij regelen alles. Date, vrienden, groep of solo: iedereen is welkom.",
    ctaPrimary: "Kies je zondagmiddag",
    microcopy:
      "Zin in een gezellige zondagmiddag? Boek voor twee, met vrienden of je hele groep. Ook alleen komen kan. Geen datumprikkers.",
    nextTableLabel: "Volgende tafel",
    imageAlt: "Mensen die samen aan tafel van wijn en eten genieten",
  },
  valueStrip: [
    "Elke zondagmiddag",
    "4 wijnen · 4 bites",
    "Eigen tafel of aanschuiven",
    "Kleine groepen",
  ],
  experiences: {
    title: "Kies je zondagmiddag",
    subtitle:
      "Elke zondag, één moment per stad. Kies je datum, check hoeveel plekken er zijn, en reserveer.",
    status: {
      available: "Beschikbaar",
      almostFull: "Bijna vol",
      soldOut: "Uitverkocht",
      closed: "Uitverkocht",
      new: "Nieuw",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserveer je plek",
    viewAllCta: "Bekijk alle aankomende tafels",
    items: [],
  },
  agenda: {
    hero: {
      title: "Vind je zondagmiddag.",
      subtitle:
        "Wijnproeverijen op zondagmiddag op de leukste plekken in Nederland. Goed eten, mooie wijnen, ontspannen sfeer.",
      supportLine:
        "Wij regelen alles rond de tafel. Jij geniet van wijn en spijs.",
    },
    tabsAriaLabel: "Kies je zondagmiddag",
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
      title: "Kies je zondagmiddag",
      subtitle:
        "Elke zondag, één moment per stad. Kies je datum, check hoeveel plekken er zijn, en reserveer.",
    },
    empty: {
      title: "Geen beschikbare tafels",
      text: "Er staan nu geen open tafels voor dit filter. Zet je op de wachtlijst — jij hoort als eerste wanneer er plekken vrijkomen.",
      showAllCities: "Alle tafels tonen",
      waitlistCta: "Naar de wachtlijst",
    },
    status: {
      available: "Beschikbaar",
      almostFull: "Bijna vol",
      soldOut: "Uitverkocht",
      closed: "Uitverkocht",
      new: "Nieuw",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserveer je plek",
    items: [],
  },
  concept: {
    title: "Meer dan alleen een reservering.",
    subtitle:
      "Wijnproeverij aan één tafel, chef's special voor de groep en een zondagmiddag op eigen tempo. Wij regelen alles rond de tafel. Jij komt genieten.",
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
        title: "Leukste plekken in Nederland",
        description:
          "Van Rotterdam tot Maastricht: je ontdekt locaties waar wijn, sfeer en goed eten perfect samenkomen.",
      },
    ],
  },
  howItWorks: {
    title: "Zo werkt MyTable",
    expandCta: "Bekijk alle stappen",
    steps: [
      {
        title: "Kies je zondagmiddag",
        description:
          "Kies je stad en datum. Girls only of gemengd, met wijn en spijs als middelpunt.",
      },
      {
        title: "Reserveer online",
        description:
          "Boek voor je groep of schuif solo aan. Alles betaal je vooraf, direct bevestigd.",
      },
      {
        title: "Kom zondag aan tafel",
        description:
          "Vier wijnen, chef's bites en gezelschap. Plan de hele middag, vaak gaat het daarna nog gezellig door.",
      },
    ],
  },
  venueDiscovery: {
    title: "Plekken met wijn en spijs",
    subtitle:
      "De leukste adressen in Nederland, van Rotterdam tot Maastricht. Partnerlocaties van MyTable waar wijn en spijs samenkomen.",
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
    cta: "Naar de wachtlijst",
    success:
      "Bedankt. Je staat op de lijst. We nemen contact op zodra de volgende tafel in jouw stad opent.",
    error: "Aanmelden mislukt. Probeer het later opnieuw.",
    cities: ["Rotterdam", "Den Haag", "Amsterdam", "Utrecht"],
    emptyAgenda: {
      title: "Geen open tafel? Op de wachtlijst.",
      subtitle:
        "Vertel wat je zoekt. We mailen je zodra er nieuwe tafels openen in jouw stad — vóór de open agenda.",
      cta: "Naar de wachtlijst",
    },
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
        question: "Wanneer zijn de events?",
        answer:
          "Elke zondagmiddag, meestal tussen 12:00 en 17:00. De exacte tijd staat op je tafelkaart en in je bevestigingsmail.",
      },
      {
        question: "Kan ik alleen komen of iemand meenemen?",
        answer:
          "Beide kan. Veel gasten komen solo; anderen boeken voor zichzelf en een vriend(in), of schuiven aan bij een tafel die al staat. Het voelt normaal en ontspannen.",
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
  bookingOutcome: bookingOutcomeNl,
  footer: {
    tagline: "Goede smaak. Goed gezelschap.",
    description:
      "Sociale wijnproeverijen aan één tafel door heel Nederland. Boek solo of met vrienden. Wij regelen wijn, bites en de juiste tafelmix.",
    nationwide: "Heel Nederland",
    columns: {
      explore: "Ontdekken",
      info: "Informatie",
      popularCities: "Steden",
    },
    allCitiesCta: "Alle steden",
    links: {
      experiences: "Beschikbare tafels",
      howItWorks: "Zo werkt het",
      forVenues: "Voor locaties",
      faq: "FAQ",
      blog: "Blog",
      waitlist: "Wachtlijst",
      instagram: "Instagram",
      contact: "Contact",
      terms: "Algemene voorwaarden",
      privacy: "Privacy",
      girlsOnly: "Girls-only proeverijen",
    },
    legal: {
      eyebrow: "Juridisch",
      relatedLabel: "Gerelateerde pagina's",
    },
    copyright: "Alle rechten voorbehouden.",
  },
};
