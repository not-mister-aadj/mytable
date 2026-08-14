import type { Dictionary } from "../types";
import { images } from "@/data/images";
import { experiencePageEn } from "../experience-page-en";
import { bookingOutcomeEn } from "../booking-outcome-en";

export const en: Dictionary = {
  meta: {
    title: "MyTable · Good taste. Great company.",
    description:
      "Every first Sunday. New people. Then culinary experiences.",
  },
  header: {
    nav: {
      girlsOnly: "Sunday Table",
      calendar: "Agenda",
      account: "Account",
      clubmember: "Clubmember",
      experiences: "Agenda",
      blog: "Blog",
      myAccount: "My account",
      logIn: "Log in",
      signUp: "Sign up",
      navAria: "Main navigation",
      waitlistCta: "Join the waitlist",
    },
    languageSwitch: "NL",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    homeAria: "MyTable home",
  },
  hero: {
    headlineLine1: "Good taste.",
    headlineLine2: "Great company.",
    subheadline:
      "Every Sunday afternoon: wine tastings and chef's specials at one table. We handle everything. Date night, friends, your group, or solo: everyone is welcome.",
    ctaPrimary: "Pick your Sunday afternoon",
    microcopy:
      "Want a fun Sunday afternoon? Book for two, with friends, or your whole group. Solo works too. No date polls.",
    nextTableLabel: "Next table",
    imageAlt: "People enjoying wine and food together at the table",
  },
  valueStrip: [
    "Every Sunday afternoon",
    "4 wines · 4 bites",
    "Your table or join others",
    "Small groups",
  ],
  experiences: {
    title: "Pick your Sunday afternoon",
    subtitle:
      "Every Sunday, one slot per city. Pick your date, check how many spots are left, and reserve.",
    status: {
      available: "Available",
      almostFull: "Almost full",
      soldOut: "Sold out",
      closed: "Sold out",
      new: "New",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserve your seat",
    viewAllCta: "View all upcoming tables",
    items: [],
  },
  agenda: {
    hero: {
      eyebrow: "The agenda",
      title: "Find and book your culinary table",
      subtitle:
        "Wine Walks, tastings and dinners. Pick a date, city and number of tickets. We add new experiences regularly. Tip for a restaurant, city or experience? Email us at info@mytable.club.",
      cta: "Browse the agenda",
    },
    crossFeed: {
      eyebrow: "No one to go with yet?",
      title: "Meet people via Clubmember",
      body: "Sunday Table is for joining solo, then booking something from the agenda together.",
      benefits: [
        "Join Sunday Table on your own",
        "Meet new people in your city",
        "10% off culinary experiences",
      ],
      cta: "Go to Clubmember",
    },
    sundayTableGroup: {
      title: "Book with your Sunday Table",
      body: "Pick a Wine Walk or Food Walk in your city. Members get 10% off.",
    },
    browse: {
      cityLabel: "City",
      cityAll: "All cities",
      dateLabel: "Date",
      dateAll: "All dates",
      results: "{count} results",
      clear: "Clear filters",
    },
    tabsAriaLabel: "Filter by type",
    tabs: [
      { id: "all", label: "All" },
      { id: "tastings", label: "Tasting" },
      { id: "wineWalk", label: "Wine walk" },
      { id: "foodWalk", label: "Food walk" },
      { id: "chefsSpecial", label: "Chef's special" },
    ],
    tabHints: {
      all: "",
      tastings: "Wine and food pairings at one table.",
      wineWalk: "Through the city, wine at every stop.",
      foodWalk: "Through the city, tasting at multiple spots.",
      chefsSpecial: "The best starters, mains and desserts from the house.",
    },
    grid: {
      title: "Upcoming tables",
      subtitle: "Wine Walks, tastings and dinners. Pick date, city and number of tickets.",
    },
    empty: {
      title: "No experiences available",
      text: "There are no open tables for this filter right now. Check Sunday Table or come back later for new dates.",
      showAllCities: "Show all experiences",
      communityCta: "Go to Sunday Table",
    },
    status: {
      available: "Available",
      almostFull: "Almost full",
      soldOut: "Sold out",
      closed: "Sold out",
      new: "New",
    },
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserve your seat",
    items: [],
  },
  concept: {
    title: "More than just a reservation.",
    subtitle:
      "Wine tasting at one table, chef's special for the group, and a Sunday afternoon at your own pace. We handle everything around the table. You come to enjoy.",
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
    expandCta: "View all steps",
    steps: [
      {
        title: "Pick your Sunday afternoon",
        description:
          "Choose your city and date. Book tickets for yourself or your party, with wine and food at the center.",
      },
      {
        title: "Reserve online",
        description:
          "Book 1 to 6 tickets. Pay in full upfront, confirmed right away.",
      },
      {
        title: "Show up Sunday afternoon",
        description:
          "Four wines, chef's bites, and good company. Plan for the whole afternoon, often the fun keeps going afterward.",
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
    cta: "Go to Sunday Table",
    success:
      "Thank you. You're on the list. We'll be in touch when the next table opens in your city.",
    error: "Sign-up failed. Please try again later.",
    cities: ["Rotterdam", "Den Haag", "Amsterdam", "Utrecht"],
    emptyAgenda: {
      title: "Join the MyTable Club",
      subtitle:
        "Via Sunday Table you hear first when new tables open in your city.",
      cta: "Go to Sunday Table",
    },
  },
  faq: {
    title: "FAQ",
    items: [
      {
        question: "What is MyTable?",
        answer:
          "Culinary events at partner restaurants: wine tastings and more. You book tickets for yourself or your party and bring your own group. We handle everything around the table; you come for good wine, chef's specials, and good company. Meeting new people happens through Clubmember / Sunday Table.",
      },
      {
        question: "Will I sit with strangers?",
        answer:
          "No. On the agenda you book your own seats: solo or with friends. Matching with new people only happens through Clubmember and Sunday Table.",
      },
      {
        question: "When are the events?",
        answer:
          "Every Sunday afternoon, usually between 12:00 and 17:00. The exact time is on your table card and in your confirmation email.",
      },
      {
        question: "Can I come alone or bring someone?",
        answer:
          "Both work. Book 1 to 6 tickets for yourself or your party. It feels normal and relaxed.",
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
    description:
      "Every first Sunday. New people. Then culinary experiences.",
    nationwide: "All of the Netherlands",
    columns: {
      explore: "Explore",
      info: "Information",
      popularCities: "Cities",
    },
    allCitiesCta: "All cities",
    links: {
      experiences: "Available tables",
      howItWorks: "How it works",
      forVenues: "For venues",
      faq: "FAQ",
      blog: "Blog",
      instagram: "Instagram",
      contact: "Contact",
      terms: "Terms and conditions",
      privacy: "Privacy",
      girlsOnly: "Sunday Table",
    },
    legal: {
      eyebrow: "Legal",
      relatedLabel: "Related pages",
    },
    copyright: "All rights reserved.",
  },
};
