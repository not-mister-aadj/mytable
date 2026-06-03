import type { Dictionary } from "../types";
import { images } from "@/data/images";
import { experiencePageEn } from "../experience-page-en";

export const en: Dictionary = {
  meta: {
    title: "MyTable — Good taste. Great company.",
    description:
      "Join curated tables, dinners, tastings, and city experiences designed around good food, good drinks, and relaxed social connection.",
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
      "Join curated tables, dinners, tastings, and city experiences designed around good food, good drinks, and relaxed social connection.",
    ctaPrimary: "View agenda",
    microcopy:
      "Come solo, bring a friend, or book together. We create the setting. You enjoy the table.",
    nextTableLabel: "Next table",
    nextTableTitle: "Sunday Wine Walk",
    nextTableCity: "Rotterdam",
    nextTableTime: "12:00–17:00",
    nextTableIncluded: "Wine + bites included",
    nextTableStatus: "Few seats left",
    imageAlt: "People enjoying wine and food together at the table",
  },
  valueStrip: [
    "Curated venues",
    "Good food & drinks",
    "Come solo or together",
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
        id: "featured-tasting",
        title: "Wine & bites tasting",
        city: "Amsterdam",
        date: "Sunday 19 May",
        caption: "Warm light, good wine, new faces.",
        category: "Tasting",
        image:
          images.wineGlasses,
        icon: "wine",
      },
      {
        id: "featured-dinner",
        title: "Dinner with strangers",
        city: "Den Haag",
        date: "Thursday 23 May",
        caption: "Laughter, sharing, one shared table.",
        category: "Shared dinner",
        image:
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        icon: "dinner",
      },
      {
        id: "featured-long-table",
        title: "Long table dinner",
        city: "Rotterdam",
        date: "Sunday 26 May",
        caption: "Candlelight and conversation that flows.",
        category: "Dinner",
        image:
          "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
        icon: "table",
      },
      {
        id: "featured-wine-walk",
        title: "Sunday wine walk",
        city: "Utrecht",
        date: "Sunday 2 June",
        caption: "The city in golden hour, glass in hand.",
        category: "Wine walk",
        image:
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
        icon: "walk",
      },
      {
        id: "featured-mystery",
        title: "Mystery restaurant night",
        city: "Amsterdam",
        date: "Friday 7 June",
        caption: "A toast to an evening you won't expect.",
        category: "Mystery",
        image:
          "https://images.unsplash.com/photo-1528605248649-88c107e84a98?w=800&q=80",
        icon: "mystery",
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
    femaleOnlyBadge: "Women only",
    reserveCta: "Reserve your seat",
    viewAllCta: "View all upcoming tables",
    items: [
      {
        id: "women-wine-walk",
        city: "Utrecht",
        experienceName: "Wine Walk — women only",
        category: "WINE WALK",
        dateTime: "Sunday 22 June · 13:00–17:00",
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
        category: "WINE WALK",
        tagline:
          "A relaxed Sunday afternoon of wine, beautiful spots, and good company.",
        dateTime: "Sunday 16 June · 12:00–17:00",
        price: 49,
        status: "almostFull",
        mood: "wineWalks",
        image: images.wineGlasses,
      },
      {
        id: "dinner-with-strangers",
        city: "Den Haag",
        experienceName: "Dinner with Strangers",
        category: "SHARED DINNER",
        dateTime: "Thursday 20 June · 19:00–22:00",
        price: 39,
        status: "almostFull",
        mood: "sharedDinners",
        image: images.restaurantDining,
      },
      {
        id: "wine-bites-tasting",
        city: "Amsterdam",
        experienceName: "Wine & Bites Tasting",
        category: "TASTING",
        dateTime: "Sunday 23 June · 14:00–16:30",
        price: 45,
        status: "soldOut",
        mood: "tastings",
        image: images.wineBar,
      },
      {
        id: "long-table-lunch",
        city: "Rotterdam",
        experienceName: "Long Table Lunch",
        category: "LONG TABLE",
        dateTime: "Sunday 30 June · 13:00–16:00",
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
        dateTime: "Friday 5 July · 19:30–22:30",
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
        dateTime: "Sunday 7 July · 11:30–14:00",
        price: 35,
        status: "almostFull",
        mood: "sundayTables",
        image: images.brunch,
      },
    ],
  },
  agenda: {
    hero: {
      title: "Find a table that fits you.",
      subtitle:
        "From wine walks to long tables and shared dinners. Choose the atmosphere that suits you.",
      supportLine: "Come alone, bring someone, or simply pull up a chair.",
    },
    tabsAriaLabel: "Choose a mood",
    tabs: [
      { id: "all", label: "All Tables" },
      { id: "wineWalks", label: "Wine Walks" },
      { id: "sharedDinners", label: "Shared Dinners" },
      { id: "tastings", label: "Tastings" },
    ],
    grid: {
      title: "Tables you won't want to miss",
      subtitle:
        "Pick your city, reserve your seat, and join a table with good taste and great company.",
    },
    empty: {
      title: "No tables found",
      text: "There are no tables for this mood yet. Try another category or view all tables.",
      showAllCities: "Show all tables",
    },
    status: {
      available: "Available",
      almostFull: "Almost full",
      soldOut: "Sold out",
      new: "New",
    },
    femaleOnlyBadge: "Women only",
    reserveCta: "Reserve your seat",
    items: [
      {
        id: "women-wine-walk",
        city: "Utrecht",
        experienceName: "Wine Walk — women only",
        category: "WINE WALK",
        dateTime: "Sunday 22 June · 13:00–17:00",
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
        category: "WINE WALK",
        tagline:
          "A relaxed Sunday afternoon of wine, beautiful spots, and good company.",
        dateTime: "Sunday 16 June · 12:00–17:00",
        price: 49,
        status: "almostFull",
        mood: "wineWalks",
        image: images.wineGlasses,
      },
      {
        id: "dinner-with-strangers",
        city: "Den Haag",
        experienceName: "Dinner with Strangers",
        category: "SHARED DINNER",
        dateTime: "Thursday 20 June · 19:00–22:00",
        price: 39,
        status: "almostFull",
        mood: "sharedDinners",
        image: images.restaurantDining,
      },
      {
        id: "wine-bites-tasting",
        city: "Amsterdam",
        experienceName: "Wine & Bites Tasting",
        category: "TASTING",
        dateTime: "Sunday 23 June · 14:00–16:30",
        price: 45,
        status: "soldOut",
        mood: "tastings",
        image: images.wineBar,
      },
      {
        id: "long-table-lunch",
        city: "Rotterdam",
        experienceName: "Long Table Lunch",
        category: "LONG TABLE",
        dateTime: "Sunday 30 June · 13:00–16:00",
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
        dateTime: "Friday 5 July · 19:30–22:30",
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
        dateTime: "Sunday 7 July · 11:30–14:00",
        price: 35,
        status: "almostFull",
        mood: "sundayTables",
        image: images.brunch,
      },
      {
        id: "wine-walk-amsterdam",
        city: "Amsterdam",
        experienceName: "Sunday Wine Walk",
        category: "WINE WALK",
        dateTime: "Sunday 9 June · 12:00–17:00",
        price: 49,
        status: "almostFull",
        mood: "wineWalks",
        image: images.cityWalk,
      },
      {
        id: "dinner-rotterdam",
        city: "Rotterdam",
        experienceName: "Dinner with Strangers",
        category: "SHARED DINNER",
        dateTime: "Friday 14 June · 19:00–22:00",
        price: 39,
        status: "soldOut",
        mood: "sharedDinners",
        image: images.restaurantDining,
      },
      {
        id: "tasting-den-haag",
        city: "Den Haag",
        experienceName: "Wine & Bites Tasting",
        category: "TASTING",
        dateTime: "Saturday 15 June · 14:00–16:30",
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
        dateTime: "Sunday 9 June · 11:30–14:00",
        price: 35,
        status: "almostFull",
        mood: "sundayTables",
        image: images.brunch,
      },
      {
        id: "long-table-amsterdam",
        city: "Amsterdam",
        experienceName: "Long Table Dinner",
        category: "LONG TABLE",
        dateTime: "Thursday 27 June · 19:00–22:30",
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
        dateTime: "Friday 12 July · 19:30–22:30",
        price: 42,
        status: "soldOut",
        mood: "mysteryTables",
        image: images.cheers,
      },
    ],
  },
  concept: {
    title: "More than just a reservation.",
    subtitle:
      "MyTable is built around atmosphere, conversation, and discovery. Some experiences happen around one shared table. Others move through the city. The format changes, but the feeling stays the same: tasteful places, relaxed people, and an easy reason to get together.",
    cards: [
      {
        title: "Come solo or together",
        description:
          "You can join by yourself, bring a friend, or book as a small group.",
      },
      {
        title: "Curated social setting",
        description:
          "We design the table, pacing, and atmosphere so conversation feels natural.",
      },
      {
        title: "No awkward networking",
        description:
          "This is not business networking or speed dating. It is simply a better way to enjoy good places with good people.",
      },
    ],
  },
  howItWorks: {
    title: "How MyTable works",
    steps: [
      {
        title: "Pick your experience",
        description:
          "Choose a dinner, tasting, walk, brunch, or shared table.",
      },
      {
        title: "Reserve your seat",
        description: "Come solo, with a friend, or as a small group.",
      },
      {
        title: "Arrive at the table",
        description:
          "We share everything you need before the experience starts.",
      },
      {
        title: "Enjoy good company",
        description:
          "Meet people naturally over food, drinks, and conversation.",
      },
    ],
  },
  venueDiscovery: {
    title: "Places worth discovering.",
    subtitle:
      "We partner with restaurants, wine bars, and hidden city spots that care about atmosphere, quality, and hospitality.",
    categories: [
      {
        title: "Wine bars",
        image:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      },
      {
        title: "Restaurants",
        image:
          "https://images.unsplash.com/photo-1600891964096-920202967dea?w=600&q=80",
      },
      {
        title: "Hidden city spots",
        image:
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80",
      },
      {
        title: "Long tables",
        image:
          "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80",
      },
    ],
  },
  testimonials: {
    title: "What people come for",
    items: [
      {
        quote:
          "I came alone and left with three people I actually wanted to see again.",
        name: "Sophie",
        age: 34,
      },
      {
        quote:
          "It felt relaxed from the first glass. Good food, nice people, no awkwardness.",
        name: "Mark",
        age: 42,
      },
      {
        quote:
          "I loved discovering a new restaurant without having to organize anything myself.",
        name: "Elise",
        age: 39,
      },
    ],
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
          "Give people a reason to return — and to bring others to your door.",
      },
    ],
  },
  newsletter: {
    title: "Be first at the table.",
    subtitle:
      "Get early access to new tables, tastings, walks, and restaurant experiences in your city.",
    emailLabel: "Email",
    emailPlaceholder: "Your email",
    cityLabel: "City",
    cta: "Join the list",
    success:
      "Thank you. You're on the list — we'll be in touch when the next table opens in your city.",
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
          "It depends on the experience. Each event card clearly shows what is included, such as wine, bites, dinner, brunch, or tasting elements.",
      },
      {
        question: "Do I need to know anything about wine?",
        answer:
          "No. You only need curiosity and an appetite for a good time.",
      },
      {
        question: "Are the groups curated?",
        answer:
          "The atmosphere is curated. Depending on the format, we may arrange tables, pacing, and group settings to keep the experience relaxed and social.",
      },
      {
        question: "When do I get the details?",
        answer:
          "You receive the practical details before the experience starts. Some mystery formats reveal the exact venue closer to the date.",
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
