import type { Dictionary } from "../types";
import { images } from "@/data/images";
import { getCatalogExperiences } from "@/data/experience-catalog";
import { experiencePageEn } from "../experience-page-en";
import { bookingOutcomeEn } from "../booking-outcome-en";

const catalogEn = getCatalogExperiences("en");

export const en: Dictionary = {
  meta: {
    title: "MyTable · Good food. Fine wines. Great tables.",
    description:
      "From wine tastings to chef's specials: discover social tables at special venues across the Netherlands.",
  },
  header: {
    nav: {
      experiences: "Available tables",
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
      "We handle everything at the table. You show up and enjoy: from wine tastings and chef's specials to wine walks.",
    ctaPrimary: "Pick your table",
    microcopy:
      "Book your own table, or join solo and meet others. With friends, on a date, or alone.",
    nextTableLabel: "Next table",
    imageAlt: "People enjoying wine and food together at the table",
  },
  valueStrip: [
    "Curated venues",
    "Food and wine in sync",
    "Solo or your own table",
    "Relaxed social atmosphere",
  ],
  experiences: {
    title: "See the tables you won't want to miss",
    subtitle:
      "Pick your city, reserve your seat, and join a table with good taste and great company.",
    status: {
      available: "Available",
      almostFull: "Almost full",
      soldOut: "Sold out",
      closed: "Closed",
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
        "Wine tastings at one restaurant. Girls only, or come for wine and company: on a date, solo, or with friends.",
      supportLine: "Come alone, bring someone, or simply pull up a chair.",
    },
    tabsAriaLabel: "Choose your evening",
    tabs: [
      { id: "all", label: "All tables" },
      { id: "girlsOnly", label: "Girls only" },
      { id: "mixed", label: "Date, wine or solo" },
    ],
    tabHints: {
      all: "",
      girlsOnly:
        "One table, women only. Same tasting, a different vibe.",
      mixed:
        "Everyone welcome. Come for the wine, a date, friends, or dining solo.",
    },
    grid: {
      title: "Tables you won't want to miss",
      subtitle:
        "Pick your city, reserve your seat, and join a table with good taste and great company.",
    },
    empty: {
      title: "No tables found",
      text: "There are no tables for this filter yet. Try another option or view all tables.",
      showAllCities: "Show all tables",
    },
    status: {
      available: "Available",
      almostFull: "Almost full",
      soldOut: "Sold out",
      closed: "Closed",
      new: "New",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserve your seat",
    items: catalogEn,
  },
  concept: {
    title: "More than just a reservation.",
    subtitle:
      "Wine tasting at one or more restaurants, chef's special for the group, and an evening at your own pace. We handle everything around the table. You come to enjoy.",
    cards: [
      {
        title: "One restaurant, one table",
        description:
          "No stops across the city. You taste and dine at one carefully chosen venue.",
      },
      {
        title: "Chef's special",
        description:
          "The chef prepares specials for everyone at the table, wine and food that match.",
      },
      {
        title: "Book your own table or join one",
        description:
          "Reserve for friends or a date, or come solo and join others who are up for a relaxed evening.",
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
          "Chef's special, good wine, and company, two to three hours at your own pace.",
      },
    ],
  },
  venueDiscovery: {
    title: "Places for wine and food",
    subtitle:
      "The finest addresses in the Netherlands, from Rotterdam to Maastricht. MyTable partner venues where wine and food come together.",
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
    error: "Sign-up failed. Please try again later.",
    cities: ["Rotterdam", "Den Haag", "Amsterdam", "Utrecht"],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        question: "What is MyTable?",
        answer:
          "Wine tastings at one table in one partner restaurant. You pick a table (girls only or mixed group), reserve your spot, and join a small group. We handle everything around the table; you come for good wine, chef's specials, and good company.",
      },
      {
        question: "What is the difference between girls only and mixed?",
        answer:
          "Girls only tables are for women only. Mixed groups welcome everyone: solo, with friends, or on a date. The concept is the same; only who sits at the table differs.",
      },
      {
        question: "Can I come alone or bring someone?",
        answer:
          "Both work. Many guests come solo; others book for themselves and a friend, or join a table that is already set up. It feels normal and relaxed.",
      },
      {
        question: "What is a chef's special and what is included?",
        answer:
          "Not a fixed à la carte menu: the chef prepares dishes and pairings especially for your table, matched to the wine tasting. Usually included: tasting, chef's special bites, and a host at the table. Each table card shows exactly what you get. Plan on two to three hours at your own pace.",
      },
      {
        question: "Do I need to know a lot about wine?",
        answer:
          "No. Curiosity is enough. Our host shares context about the wines without turning it into a lesson.",
      },
      {
        question: "Can I share dietary requirements?",
        answer:
          "Yes. Tell us when you book. The chef adapts the specials where possible.",
      },
      {
        question: "Where does the tasting take place?",
        answer:
          "At one partner restaurant, no route through the city. The city is on the table card. After booking, we email the restaurant, time, and practical details.",
      },
      {
        question: "How do payment and exchanges work?",
        answer:
          "Everything is paid in full when you book. Cancellations are not available. You can exchange to another date for free up to 48 hours before start. Email us if you want to exchange.",
      },
      {
        question: "Can I order more at the table?",
        answer:
          "Often yes: an extra course, glass, or bite. Some partner venues also sell the full bottle of a wine you enjoyed. It varies by restaurant.",
      },
      {
        question: "Is this dating or networking?",
        answer:
          "No. It is relaxed time at the table with wine, food, and easy conversation. No business networking and no forced small talk.",
      },
      {
        question: "Can restaurants become a partner?",
        answer:
          "Yes. Restaurants and wine bars can reach out via For venues to explore working together.",
      },
    ],
  },
  experiencePage: experiencePageEn,
  bookingOutcome: bookingOutcomeEn,
  footer: {
    tagline: "Good taste. Great company.",
    links: {
      experiences: "Available tables",
      howItWorks: "How it works",
      forVenues: "For venues",
      faq: "FAQ",
      instagram: "Instagram",
      contact: "Contact",
      terms: "Terms and conditions",
      privacy: "Privacy",
    },
    legal: {
      eyebrow: "Legal",
      relatedLabel: "Related pages",
    },
    copyright: "All rights reserved.",
  },
};
