import type { Dictionary } from "../types";
import { images } from "@/data/images";
import { getCatalogExperiences } from "@/data/experience-catalog";
import { experiencePageEn } from "../experience-page-en";

const catalogEn = getCatalogExperiences("en");

export const en: Dictionary = {
  meta: {
    title: "MyTable · Good taste. Great company.",
    description:
      "Wine tastings at one table in one restaurant. Girls only or mixed group. Pick your table and come.",
  },
  header: {
    nav: {
      experiences: "Experiences",
      howItWorks: "How it works",
      forVenues: "For venues",
      faq: "FAQ",
    },
    cta: "Join the table",
    languageSwitch: "NL",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeAria: "MyTable home",
  },
  hero: {
    headlineLine1: "Good taste.",
    headlineLine2: "Great company.",
    subheadline:
      "Wine tasting at one restaurant. We handle everything around the table. You show up and enjoy.",
    ctaPrimary: "Pick your table",
    microcopy:
      "Girls only or mixed group. Solo, with friends, or on a date.",
    nextTableLabel: "Next table",
    imageAlt: "People enjoying wine and food together at the table",
  },
  valueStrip: [
    "Curated venues",
    "Food and wine in sync",
    "Solo or your own table",
    "Relaxed social atmosphere",
  ],
  featuredCarousel: {
    eyebrow: "THE FINEST TABLES IN THE NETHERLANDS",
    title: "See the tables you won't want to miss",
    subtitle:
      "Atmosphere, people, conversation, and beautiful places. This is MyTable.",
    cta: "View all upcoming tables",
    cards: [
      {
        id: "featured-tasting-girls",
        title: "Wine tasting · girls only",
        city: "Amsterdam",
        date: "Sunday 23 June",
        caption: "One restaurant, chef's special, women only.",
        category: "Girls only",
        image: images.wineGlasses,
        icon: "wine",
      },
      {
        id: "featured-tasting-mixed",
        title: "Wine tasting · mixed group",
        city: "Rotterdam",
        date: "Sunday 16 June",
        caption: "Join a mixed table — solo or together.",
        category: "Mixed group",
        image: images.wineBar,
        icon: "wine",
      },
      {
        id: "featured-tasting-utrecht",
        title: "Wine tasting · girls only",
        city: "Utrecht",
        date: "Sunday 22 June",
        caption: "Two to three hours of tasting and talk at your pace.",
        category: "Girls only",
        image: images.restaurantInterior,
        icon: "wine",
      },
    ],
  },
  experiences: {
    title: "See the tables you won't want to miss",
    subtitle:
      "Pick your city, reserve your seat, and join a table with good taste and great company.",
    status: {
      available: "Available",
      almostFull: "Almost full",
      soldOut: "Sold out",
      new: "New",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserve your seat",
    viewAllCta: "View all upcoming tables",
    items: catalogEn,
  },
  agenda: {
    hero: {
      title: "Find a table that fits you.",
      subtitle:
        "Wine tastings at one restaurant. Choose girls only or a mixed group.",
      supportLine: "Come alone, bring someone, or simply pull up a chair.",
    },
    tabsAriaLabel: "Choose a group",
    tabs: [
      { id: "all", label: "All tables" },
      { id: "girlsOnly", label: "Girls only" },
      { id: "mixed", label: "Mixed group" },
    ],
    grid: {
      title: "Tables you won't want to miss",
      subtitle:
        "Pick your city, reserve your seat, and join a table with good taste and great company.",
    },
    empty: {
      title: "No tables found",
      text: "There are no tables for this group yet. Try another category or view all tables.",
      showAllCities: "Show all tables",
    },
    status: {
      available: "Available",
      almostFull: "Almost full",
      soldOut: "Sold out",
      new: "New",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserve your seat",
    items: catalogEn,
  },
  concept: {
    title: "More than just a reservation.",
    subtitle:
      "Wine tasting at one restaurant, chef's special for the group, and an evening at your own pace. We handle everything around the table. You come to enjoy.",
    cards: [
      {
        title: "One restaurant, one table",
        description:
          "No stops across the city. You taste and dine at one carefully chosen venue.",
      },
      {
        title: "Chef's special",
        description:
          "The chef prepares specials for everyone at the table — wine and food that match.",
      },
      {
        title: "Girls only or mixed",
        description:
          "Choose a women-only table, or join a mixed group — solo, with friends, or on a date.",
      },
    ],
  },
  howItWorks: {
    title: "How MyTable works",
    steps: [
      {
        title: "Pick your table",
        description:
          "Girls only or mixed group. Wine tasting at one restaurant.",
      },
      {
        title: "Reserve your spot",
        description:
          "For friends, a date, solo, or a seat at a table that's already set.",
      },
      {
        title: "Arrive at the table",
        description:
          "You get the where and when. We handle the venue, the vibe, and every detail around it.",
      },
      {
        title: "Enjoy the evening",
        description:
          "Chef's special, good wine, and company — two to three hours at your own pace.",
      },
    ],
  },
  venueDiscovery: {
    title: "Places for wine and food",
    subtitle:
      "Real addresses across the Netherlands, from Rotterdam to Maastricht. WijnSpijs partner venues where wine and food come together.",
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
    eyebrow: "What our guests say",
    title: "Real stories from the table",
  },
  venueCta: {
    title: "Bring MyTable to your venue.",
    subtitle:
      "MyTable helps restaurants and wine bars turn quiet moments into memorable social experiences. We bring curious guests, handle the guest experience, and create a reason for people to discover your place.",
    cta: "Partner with us",
    benefits: [
      {
        title: "Fill selected moments",
        description:
          "Turn quieter service windows into lively, memorable social tables.",
      },
      {
        title: "Reach new local guests",
        description:
          "Connect with curious diners who value atmosphere and discovery.",
      },
      {
        title: "Create repeat discovery",
        description:
          "Give people a reason to return, and to bring others to your door.",
      },
    ],
  },
  newsletter: {
    title: "Be first at the table.",
    subtitle:
      "Get early access to new wine tastings and tables in your city.",
    emailLabel: "Email",
    emailPlaceholder: "Your email",
    cityLabel: "City",
    cta: "Join the list",
    success:
      "Thank you. You're on the list. We'll be in touch when the next table opens in your city.",
    cities: ["Rotterdam", "Den Haag", "Amsterdam", "Utrecht"],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        question: "Can I come alone?",
        answer:
          "Yes. Many people join solo. MyTable is designed to make that feel normal and relaxed.",
      },
      {
        question: "Can I bring friends?",
        answer:
          "Yes. You can book alone, with a friend, or as a small group.",
      },
      {
        question: "Is this a dating event?",
        answer:
          "No. MyTable is about good food, drinks, and social connection. It is not positioned as dating or networking.",
      },
      {
        question: "What is included?",
        answer:
          "Wine tasting, chef's special bites, and a host at the table. Each event card shows exactly what is included.",
      },
      {
        question: "Do I need to know anything about wine?",
        answer:
          "No. You only need curiosity and an appetite for a good time.",
      },
      {
        question: "Are the groups curated?",
        answer:
          "Yes. You choose girls only or a mixed group. We keep groups small at one table so the atmosphere stays relaxed.",
      },
      {
        question: "When do I get the details?",
        answer:
          "You receive the restaurant, time, and practical info by email after you book.",
      },
      {
        question: "Can restaurants partner with MyTable?",
        answer:
          "Yes. Restaurants and wine bars can contact us to explore collaborations.",
      },
    ],
  },
  experiencePage: experiencePageEn,
  footer: {
    tagline: "Good taste. Great company.",
    links: {
      experiences: "Experiences",
      howItWorks: "How it works",
      forVenues: "For venues",
      faq: "FAQ",
      instagram: "Instagram",
      contact: "Contact",
    },
    copyright: "All rights reserved.",
  },
};
