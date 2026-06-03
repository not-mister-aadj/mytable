import type { Dictionary } from "../types";
import { images } from "@/data/images";
import { getCatalogExperiences } from "@/data/experience-catalog";
import { experiencePageNl } from "../experience-page-nl";

const catalogNl = getCatalogExperiences("nl");

export const nl: Dictionary = {
  meta: {
    title: "MyTable · Goede smaak. Goed gezelschap.",
    description:
      "Wijnproeverijen aan één tafel in één restaurant. Girls only of gemengde groep. Kies je tafel en kom langs.",
  },
  header: {
    nav: {
      experiences: "Ervaringen",
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
      "Wijnproeverij in één restaurant. Wij regelen alles rond de tafel. Jij komt genieten.",
    ctaPrimary: "Kies je tafel",
    microcopy:
      "Girls only of gemengde groep. Solo, met vrienden, of op date.",
    nextTableLabel: "Volgende tafel",
    imageAlt: "Mensen die samen aan tafel van wijn en eten genieten",
  },
  valueStrip: [
    "Gecureerde locaties",
    "Bord en glas die kloppen",
    "Solo of eigen tafel",
    "Ontspannen sfeer",
  ],
  featuredCarousel: {
    eyebrow: "DE LEUKSTE TAFELS VAN NEDERLAND",
    title: "Bekijk de tafels die je niet wilt missen",
    subtitle:
      "Sfeer, mensen, gesprekken en mooie plekken. Dit is MyTable.",
    cta: "Bekijk alle aankomende tafels",
    cards: [
      {
        id: "featured-tasting-girls",
        title: "Wijnproeverij · girls only",
        city: "Amsterdam",
        date: "Zondag 23 juni",
        caption: "Eén restaurant, chef's special, alleen voor vrouwen.",
        category: "Girls only",
        image: images.wineGlasses,
        icon: "wine",
      },
      {
        id: "featured-tasting-mixed",
        title: "Wijnproeverij · gemengd",
        city: "Rotterdam",
        date: "Zondag 16 juni",
        caption: "Schuif aan bij een gemengde tafel — solo of samen.",
        category: "Gemengde groep",
        image: images.wineBar,
        icon: "wine",
      },
      {
        id: "featured-tasting-utrecht",
        title: "Wijnproeverij · girls only",
        city: "Utrecht",
        date: "Zondag 22 juni",
        caption: "Twee tot drie uur proeven en praten op eigen tempo.",
        category: "Girls only",
        image: images.restaurantInterior,
        icon: "wine",
      },
    ],
  },
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
        "Wijnproeverijen in één restaurant. Kies girls only of een gemengde groep.",
      supportLine:
        "Kom alleen, neem iemand mee, of schuif gewoon aan.",
    },
    tabsAriaLabel: "Kies een groep",
    tabs: [
      { id: "all", label: "Alle tafels" },
      { id: "girlsOnly", label: "Girls only" },
      { id: "mixed", label: "Gemengde groep" },
    ],
    grid: {
      title: "Bekijk de tafels die je niet wilt missen",
      subtitle:
        "Kies je stad, reserveer je plek en schuif aan bij een tafel met goede smaak en goed gezelschap.",
    },
    empty: {
      title: "Geen tafels gevonden",
      text: "Er zijn nog geen tafels voor deze groep. Kies een andere categorie of bekijk alle tafels.",
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
          "De chef bereidt specials voor iedereen aan tafel — wijn en spijs die bij elkaar passen.",
      },
      {
        title: "Girls only of gemengd",
        description:
          "Kies een tafel alleen voor vrouwen, of schuif aan bij een gemengde groep — solo, met vrienden of op date.",
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
          "Chef's special, goede wijn en gezelschap — twee tot drie uur op eigen tempo.",
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
        question: "Kan ik alleen komen?",
        answer:
          "Ja. Veel mensen komen alleen. MyTable is ontworpen om dat normaal en ontspannen te laten voelen.",
      },
      {
        question: "Kan ik vrienden meenemen?",
        answer:
          "Ja. Je kunt alleen boeken, met een vriend komen of als kleine groep.",
      },
      {
        question: "Is dit een dating-event?",
        answer:
          "Nee. MyTable draait om goed eten, drinken en sociale verbinding. Het is geen dating of netwerken.",
      },
      {
        question: "Wat is inbegrepen?",
        answer:
          "Wijnproeverij, chef's special bites en een host aan tafel. Op elke eventkaart staat precies wat is inbegrepen.",
      },
      {
        question: "Moet ik iets van wijn weten?",
        answer:
          "Nee. Je hebt alleen nieuwsgierigheid en zin in een goede tijd nodig.",
      },
      {
        question: "Zijn de groepen gecureerd?",
        answer:
          "Ja. Je kiest girls only of een gemengde groep. We werken met kleine groepen aan één tafel zodat de sfeer ontspannen blijft.",
      },
      {
        question: "Wanneer krijg ik de details?",
        answer:
          "Je ontvangt restaurant, tijd en praktische info per e-mail na je boeking.",
      },
      {
        question: "Kunnen restaurants samenwerken met MyTable?",
        answer:
          "Ja. Restaurants en wijnbars kunnen contact opnemen om samenwerking te verkennen.",
      },
    ],
  },
  experiencePage: experiencePageNl,
  footer: {
    tagline: "Goede smaak. Goed gezelschap.",
    links: {
      experiences: "Ervaringen",
      howItWorks: "Zo werkt het",
      forVenues: "Voor locaties",
      faq: "FAQ",
      instagram: "Instagram",
      contact: "Contact",
    },
    copyright: "Alle rechten voorbehouden.",
  },
};
