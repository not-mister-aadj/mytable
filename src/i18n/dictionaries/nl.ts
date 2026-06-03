import type { Dictionary } from "../types";
import { images } from "@/data/images";
import { experiencePageNl } from "../experience-page-nl";

export const nl: Dictionary = {
  meta: {
    title: "MyTable · Goede smaak. Goed gezelschap.",
    description:
      "Sluit je aan bij gecureerde tafels, diners, proeverijen en stadservaringen rond goed eten, goede dranken en ontspannen sociale verbinding.",
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
      "Sluit je aan bij gecureerde tafels, diners, proeverijen en stadservaringen rond goed eten, goede dranken en ontspannen sociale verbinding.",
    ctaPrimary: "Bekijk agenda",
    microcopy:
      "Kom alleen, neem een vriend mee of boek samen. Wij zorgen voor de setting. Jij geniet van de tafel.",
    nextTableLabel: "Volgende tafel",
    nextTableTitle: "Sunday Wine Walk",
    nextTableCity: "Rotterdam",
    nextTableTime: "12:00–17:00",
    nextTableIncluded: "Wijn + bites inbegrepen",
    nextTableStatus: "Nog enkele plekken",
    imageAlt: "Mensen die samen aan tafel van wijn en eten genieten",
  },
  valueStrip: [
    "Gecureerde locaties",
    "Goed eten & drinken",
    "Alleen of samen",
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
        id: "featured-tasting",
        title: "Wijn & bites proeverij",
        city: "Amsterdam",
        date: "Zondag 19 mei",
        caption: "Warm licht, goede wijn, nieuwe gezichten.",
        category: "Proeverij",
        image:
          images.wineGlasses,
        icon: "wine",
      },
      {
        id: "featured-dinner",
        title: "Diner met onbekenden",
        city: "Den Haag",
        date: "Donderdag 23 mei",
        caption: "Lachen, delen, en één gedeelde tafel.",
        category: "Gedeeld diner",
        image:
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        icon: "dinner",
      },
      {
        id: "featured-long-table",
        title: "Lange tafel diner",
        city: "Rotterdam",
        date: "Zondag 26 mei",
        caption: "Kaarslicht en gesprekken die vanzelf stromen.",
        category: "Diner",
        image:
          "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
        icon: "table",
      },
      {
        id: "featured-wine-walk",
        title: "Sunday wine walk",
        city: "Utrecht",
        date: "Zondag 2 juni",
        caption: "De stad in gouden uur, glas in de hand.",
        category: "Wijnwandeling",
        image:
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
        icon: "walk",
      },
      {
        id: "featured-mystery",
        title: "Mystery restaurant night",
        city: "Amsterdam",
        date: "Vrijdag 7 juni",
        caption: "Proosten op een avond die je niet verwacht.",
        category: "Mystery",
        image:
          "https://images.unsplash.com/photo-1528605248649-88c107e84a98?w=800&q=80",
        icon: "mystery",
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
    femaleOnlyBadge: "Alleen voor vrouwen",
    reserveCta: "Reserveer je plek",
    viewAllCta: "Bekijk alle aankomende tafels",
    items: [
      {
        id: "women-wine-walk",
        city: "Utrecht",
        experienceName: "Wijnwandeling (women only)",
        category: "WIJNWANDELING",
        dateTime: "Zondag 22 juni · 13:00–17:00",
        price: 52,
        status: "new",
        mood: "wineWalks",
        image: images.wineBar,
        femaleOnly: true,
      },
      {
        id: "sunday-wine-walk",
        city: "Rotterdam",
        experienceName: "Sunday Wine Walk",
        category: "WIJNWANDELING",
        tagline:
          "Een ontspannen zondagmiddag vol wijn, mooie plekken en goed gezelschap.",
        dateTime: "Zondag 16 juni · 12:00–17:00",
        price: 49,
        status: "almostFull",
        mood: "wineWalks",
        image: images.wineGlasses,
      },
      {
        id: "dinner-with-strangers",
        city: "Den Haag",
        experienceName: "Diner met onbekenden",
        category: "GEDEELD DINER",
        dateTime: "Donderdag 20 juni · 19:00–22:00",
        price: 39,
        status: "almostFull",
        mood: "sharedDinners",
        image: images.restaurantDining,
      },
      {
        id: "wine-bites-tasting",
        city: "Amsterdam",
        experienceName: "Wijn & bites proeverij",
        category: "PROEVERIJ",
        dateTime: "Zondag 23 juni · 14:00–16:30",
        price: 45,
        status: "soldOut",
        mood: "tastings",
        image: images.wineBar,
      },
      {
        id: "long-table-lunch",
        city: "Rotterdam",
        experienceName: "Long Table Lunch",
        category: "LANGE TAFEL",
        dateTime: "Zondag 30 juni · 13:00–16:00",
        price: 55,
        status: "almostFull",
        mood: "sundayTables",
        image: images.longTable,
      },
      {
        id: "mystery-restaurant",
        city: "Utrecht",
        experienceName: "Mystery Restaurant Night",
        category: "MYSTERY TABLE",
        dateTime: "Vrijdag 5 juli · 19:30–22:30",
        price: 42,
        status: "almostFull",
        mood: "mysteryTables",
        image: images.cheers,
      },
      {
        id: "social-brunch-club",
        city: "Amsterdam",
        experienceName: "Social Brunch Club",
        category: "BRUNCH",
        dateTime: "Zondag 7 juli · 11:30–14:00",
        price: 35,
        status: "almostFull",
        mood: "sundayTables",
        image: images.brunch,
      },
    ],
  },
  agenda: {
    hero: {
      title: "Vind een tafel die bij je past.",
      subtitle:
        "Van wijnwandelingen tot lange tafels en gedeelde diners. Kies de sfeer die bij je past.",
      supportLine:
        "Kom alleen, neem iemand mee, of schuif gewoon aan.",
    },
    tabsAriaLabel: "Kies een sfeer",
    tabs: [
      { id: "all", label: "Alle tafels" },
      { id: "wineWalks", label: "Wijnwandelingen" },
      { id: "sharedDinners", label: "Gedeelde diners" },
      { id: "tastings", label: "Proeverijen" },
    ],
    grid: {
      title: "Bekijk de tafels die je niet wilt missen",
      subtitle:
        "Kies je stad, reserveer je plek en schuif aan bij een tafel met goede smaak en goed gezelschap.",
    },
    empty: {
      title: "Geen tafels gevonden",
      text: "Er zijn nog geen tafels voor deze sfeer. Kies een andere categorie of bekijk alle tafels.",
      showAllCities: "Alle tafels tonen",
    },
    status: {
      available: "Beschikbaar",
      almostFull: "Bijna vol",
      soldOut: "Uitverkocht",
      new: "Nieuw",
    },
    femaleOnlyBadge: "Alleen voor vrouwen",
    reserveCta: "Reserveer je plek",
    items: [
      {
        id: "women-wine-walk",
        city: "Utrecht",
        experienceName: "Wijnwandeling (women only)",
        category: "WIJNWANDELING",
        dateTime: "Zondag 22 juni · 13:00–17:00",
        price: 52,
        status: "new",
        mood: "wineWalks",
        image: images.wineBar,
        femaleOnly: true,
      },
      {
        id: "sunday-wine-walk",
        city: "Rotterdam",
        experienceName: "Sunday Wine Walk",
        category: "WIJNWANDELING",
        tagline:
          "Een ontspannen zondagmiddag vol wijn, mooie plekken en goed gezelschap.",
        dateTime: "Zondag 16 juni · 12:00–17:00",
        price: 49,
        status: "almostFull",
        mood: "wineWalks",
        image: images.wineGlasses,
      },
      {
        id: "dinner-with-strangers",
        city: "Den Haag",
        experienceName: "Diner met onbekenden",
        category: "GEDEELD DINER",
        dateTime: "Donderdag 20 juni · 19:00–22:00",
        price: 39,
        status: "almostFull",
        mood: "sharedDinners",
        image: images.restaurantDining,
      },
      {
        id: "wine-bites-tasting",
        city: "Amsterdam",
        experienceName: "Wijn & bites proeverij",
        category: "PROEVERIJ",
        dateTime: "Zondag 23 juni · 14:00–16:30",
        price: 45,
        status: "soldOut",
        mood: "tastings",
        image: images.wineBar,
      },
      {
        id: "long-table-lunch",
        city: "Rotterdam",
        experienceName: "Long Table Lunch",
        category: "LANGE TAFEL",
        dateTime: "Zondag 30 juni · 13:00–16:00",
        price: 55,
        status: "almostFull",
        mood: "sundayTables",
        image: images.longTable,
      },
      {
        id: "mystery-restaurant",
        city: "Utrecht",
        experienceName: "Mystery Restaurant Night",
        category: "MYSTERY TABLE",
        dateTime: "Vrijdag 5 juli · 19:30–22:30",
        price: 42,
        status: "almostFull",
        mood: "mysteryTables",
        image: images.cheers,
      },
      {
        id: "social-brunch-club",
        city: "Amsterdam",
        experienceName: "Social Brunch Club",
        category: "BRUNCH",
        dateTime: "Zondag 7 juli · 11:30–14:00",
        price: 35,
        status: "almostFull",
        mood: "sundayTables",
        image: images.brunch,
      },
      {
        id: "wine-walk-amsterdam",
        city: "Amsterdam",
        experienceName: "Sunday Wine Walk",
        category: "WIJNWANDELING",
        dateTime: "Zondag 9 juni · 12:00–17:00",
        price: 49,
        status: "almostFull",
        mood: "wineWalks",
        image: images.cityWalk,
      },
      {
        id: "dinner-rotterdam",
        city: "Rotterdam",
        experienceName: "Diner met onbekenden",
        category: "GEDEELD DINER",
        dateTime: "Vrijdag 14 juni · 19:00–22:00",
        price: 39,
        status: "soldOut",
        mood: "sharedDinners",
        image: images.restaurantDining,
      },
      {
        id: "tasting-den-haag",
        city: "Den Haag",
        experienceName: "Wijn & bites proeverij",
        category: "PROEVERIJ",
        dateTime: "Zaterdag 15 juni · 14:00–16:30",
        price: 45,
        status: "almostFull",
        mood: "tastings",
        image: images.wineGlasses,
      },
      {
        id: "brunch-rotterdam",
        city: "Rotterdam",
        experienceName: "Social Brunch Club",
        category: "BRUNCH",
        dateTime: "Zondag 9 juni · 11:30–14:00",
        price: 35,
        status: "almostFull",
        mood: "sundayTables",
        image: images.brunch,
      },
      {
        id: "long-table-amsterdam",
        city: "Amsterdam",
        experienceName: "Long Table Dinner",
        category: "LANGE TAFEL",
        dateTime: "Donderdag 27 juni · 19:00–22:30",
        price: 59,
        status: "new",
        mood: "sharedDinners",
        image: images.longTable,
      },
      {
        id: "mystery-den-haag",
        city: "Den Haag",
        experienceName: "Mystery Restaurant Night",
        category: "MYSTERY TABLE",
        dateTime: "Vrijdag 12 juli · 19:30–22:30",
        price: 42,
        status: "soldOut",
        mood: "mysteryTables",
        image: images.cheers,
      },
    ],
  },
  concept: {
    title: "Meer dan alleen een reservering.",
    subtitle:
      "MyTable draait om sfeer, gesprek en ontdekking. Sommige ervaringen spelen zich af rond één gedeelde tafel. Andere bewegen door de stad. Het format wisselt, maar het gevoel blijft hetzelfde: smaakvolle plekken, ontspannen mensen en een makkelijke reden om samen te komen.",
    cards: [
      {
        title: "Alleen of samen",
        description:
          "Je kunt alleen komen, een vriend meenemen of als kleine groep boeken.",
      },
      {
        title: "Gecureerde sociale setting",
        description:
          "Wij ontwerpen de tafel, het tempo en de sfeer zodat gesprek natuurlijk voelt.",
      },
      {
        title: "Geen awkward netwerken",
        description:
          "Dit is geen business netwerken of speeddating. Het is simpelweg een betere manier om goede plekken te beleven met goede mensen.",
      },
    ],
  },
  howItWorks: {
    title: "Zo werkt MyTable",
    steps: [
      {
        title: "Kies je ervaring",
        description:
          "Kies een diner, proeverij, wandeling, brunch of gedeelde tafel.",
      },
      {
        title: "Reserveer je plek",
        description: "Kom alleen, met een vriend of als kleine groep.",
      },
      {
        title: "Kom aan tafel",
        description:
          "Wij delen alles wat je nodig hebt voordat de ervaring begint.",
      },
      {
        title: "Geniet van goed gezelschap",
        description:
          "Ontmoet mensen op een natuurlijke manier bij eten, drinken en gesprek.",
      },
    ],
  },
  venueDiscovery: {
    title: "Plekken die de moeite waard zijn.",
    subtitle:
      "Wij werken samen met restaurants, wijnbars en verborgen plekken in de stad die om sfeer, kwaliteit en gastvrijheid geven.",
    categories: [
      {
        title: "Wijnbars",
        image:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      },
      {
        title: "Restaurants",
        image:
          "https://images.unsplash.com/photo-1600891964096-920202967dea?w=600&q=80",
      },
      {
        title: "Verborgen plekken",
        image:
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80",
      },
      {
        title: "Lange tafels",
        image:
          "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80",
      },
    ],
  },
  testimonials: {
    title: "Waar mensen voor komen",
    items: [
      {
        quote:
          "Ik kwam alleen en ging weg met drie mensen die ik echt nog eens wilde zien.",
        name: "Sophie",
        age: 34,
      },
      {
        quote:
          "Het voelde ontspannen vanaf het eerste glas. Goed eten, fijne mensen, geen awkwardness.",
        name: "Mark",
        age: 42,
      },
      {
        quote:
          "Ik ontdekte graag een nieuw restaurant zonder alles zelf te moeten regelen.",
        name: "Elise",
        age: 39,
      },
    ],
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
      "Krijg vroegtijdig toegang tot nieuwe tafels, proeverijen, wandelingen en restaurantervaringen in jouw stad.",
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
          "Dat verschilt per ervaring. Op elke eventkaart staat duidelijk wat is inbegrepen, zoals wijn, bites, diner, brunch of proeverij.",
      },
      {
        question: "Moet ik iets van wijn weten?",
        answer:
          "Nee. Je hebt alleen nieuwsgierigheid en zin in een goede tijd nodig.",
      },
      {
        question: "Zijn de groepen gecureerd?",
        answer:
          "De sfeer is gecureerd. Afhankelijk van het format regelen we tafels, tempo en groepsindeling om de ervaring ontspannen en sociaal te houden.",
      },
      {
        question: "Wanneer krijg ik de details?",
        answer:
          "Je ontvangt de praktische details voordat de ervaring begint. Bij mystery-formaten onthullen we de exacte locatie dichter bij de datum.",
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
