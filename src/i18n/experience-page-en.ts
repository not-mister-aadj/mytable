import type { ExperiencePageLabels } from "./types";
import { images } from "@/data/images";
import { tastingFlowEn, tastingQuotesEn } from "./experience-mood-blocks-en";

export const experiencePageEn: ExperiencePageLabels = {
  viewTableCta: "View table",
  secondaryCta: "Back to agenda",
  agendaCta: "View agenda",
  heroTrustBar: "★★★★★ 4.8 · 1200+ guests at the table since 2024",
  heroTrustFooter:
    "Pay in full when you book · Free date exchange up to 48 hours before · Dietary needs welcome",
  heroSpotsHint: "{count} spots left for this date",
  pillSoloTogether: "Come alone or together",
  perPerson: "€{price} per person",
  aboutTitle: "About this experience",
  expectTitle: "What to expect",
  flowTitle: "How the evening flows",
  venuesTitle: "Where you join the table",
  venuesSubtitle:
    "One partner restaurant per evening. Super fun at the table: the chef prepares specials to surprise you, with wine and food in one place.",
  guestQuotesTitle: "What guests say",
  routeTitle: "An afternoon through {city}",
  routeMapEyebrow: "Find on the map",
  routeMapTitle: "A walk past these restaurants",
  routeSubtitle:
    "You walk at an easy pace past carefully chosen stops. The full route arrives after booking.",
  routeOpenInApple: "Open route in Maps",
  routeMapSetupHint:
    "Preferred view: Apple Maps (MapKit). Add credentials for the full map embed.",
  socialTitle: "You're here for wine and good company. Not to network.",
  socialSubtitle:
    "A small group at one table, with room to taste, laugh, and talk at your own pace.",
  galleryTitle: "Atmosphere",
  practicalTitle: "Practical info",
  faqTitle: "Frequently asked questions",
  relatedTitle: "More tables to discover",
  finalCtaHeadline: "Join a table with good wine and great company.",
  finalCtaSubheadline:
    "Chef's special, one restaurant, and conversation that flows naturally.",
  finalCtaPrimary: "Reserve your seat",
  finalCtaSecondary: "View other tables",
  bookingDate: "Date",
  bookingTime: "Time",
  bookingCity: "City",
  bookingPrice: "Price",
  bookingSpots: "Spots",
  spotsLeftBadge: "{count} spots still available",
  bookingViewsLabel: "{count} people viewed this table this week",
  bookingTrustBullets: [
    "Pay in full when you book",
    "Free date exchange up to 48 hours before",
    "Dietary needs welcome",
    "Come alone or together",
  ],
  trustLines: [
    "Curated venues and hosts",
    "Come alone, with friends, or as a duo",
    "Relaxed atmosphere, no forced small talk",
  ],
  practicalLabels: {
    startTime: "Start time",
    duration: "Duration",
    city: "City",
    included: "Included",
    dietary: "Dietary needs",
    solo: "Coming alone",
    payment: "Payment",
    exchange: "Exchanges",
    walking: "Walking distance",
    weather: "Weather",
    arrival: "Arrival",
    routeReveal: "Route & venues",
    groupSize: "Group size",
  },
  practicalValues: {
    dietary:
      "Tell us when you book. The chef adjusts the specials where possible.",
    solo: "Arriving alone is completely normal and welcome",
    payment: "Everything is paid in full when you reserve.",
    exchange:
      "Free exchange to another date up to 48 hours before start. Cancellations are not available.",
    weather:
      "Usually indoors at the restaurant. In fine weather, when a terrace is available, the table may be seated outside.",
    arrival:
      "Arrive 10 minutes before start. The host welcomes you and seats the group.",
    routeReveal:
      "You receive the restaurant and address by email after your booking is confirmed.",
    groupSize: "Small groups, usually 8 to 14 guests per table",
  },
  spotsByStatus: {
    available: "Plenty of seats still available",
    almostFull: "Only a few spots left, book soon",
    soldOut: "This table is sold out",
    new: "New in our lineup",
  },
  moods: {
    tastings: {
      tagline: "Wine tasting at one table, girls only or mixed group",
      experienceFlow: tastingFlowEn,
      guestQuotes: tastingQuotesEn,
      description:
        "MyTable starts with wine tastings at a single restaurant. You join a small group, taste several wines with matching bites, and enjoy what the chef prepares as specials for the table. No wine lecture, just context and room to enjoy at your own pace, usually two to three hours.",
      whatToExpect: [
        {
          title: "One restaurant, one table",
          description:
            "No stops across the city. Everything happens at one carefully chosen venue.",
        },
        {
          title: "Chef's special for the group",
          description:
            "The chef creates specials for everyone at the table. Wine and food are matched.",
        },
        {
          title: "Girls only or mixed",
          description:
            "Pick a table that fits: women only, or a mixed group where everyone is welcome.",
        },
        {
          title: "Accessible guidance",
          description:
            "Our host shares background on the wines without turning it into an exam.",
        },
        {
          title: "Your own pace",
          description:
            "Plan for two to three hours. No tight schedule, time to taste, talk, and linger.",
        },
        {
          title: "Adjustments on request",
          description:
            "Dietary needs or preferences? Tell us when you book and we align with the chef where possible.",
        },
      ],
      socialParagraphs: [
        "You join people who want a proper night out. Sometimes solo, sometimes with friends or on a date. It's great fun when the chef surprises you with the next special or the pour that goes with it, and conversation flows on its own.",
        "Nobody is there to prove anything or make business contacts. Whether you know a lot about wine or are simply curious, everyone tastes, eats, and chats on equal footing. One place for the whole evening keeps it calm and personal.",
      ],
      gallery: [
        images.wineBar,
        images.wineGlasses,
        images.restaurantInterior,
        images.cheers,
        images.heroMain,
        images.restaurantDining,
      ],
      duration: "2 to 3 hours, at your own pace",
      included: "Wine tasting, chef's special bites, and host at the table",
      faq: [
        {
          question: "What's the difference between girls only and mixed?",
          answer:
            "Girls only means only women join the table. Mixed groups welcome everyone, solo, with friends, or on a date.",
        },
        {
          question: "What is a chef's special?",
          answer:
            "The chef prepares dishes and pairings specifically for your table, not standard à la carte, but matched to the wine and the group.",
        },
        {
          question: "Can I share dietary requirements?",
          answer:
            "Yes. Tell us when you book. The chef adjusts the specials where possible.",
        },
        {
          question: "Can I order more?",
          answer:
            "At the table you can often order extras, such as another course, bite, or glass. Some partner venues also sell the full bottle of a wine you enjoyed. It varies by restaurant; the host or staff will explain what's possible.",
        },
        {
          question: "Where does the tasting take place?",
          answer:
            "At one partner restaurant per city. The exact venue is on your booking confirmation.",
        },
        {
          question: "Can I cancel or exchange?",
          answer:
            "Cancellations are not available. You can exchange to another date for free up to 48 hours before start. Everything is paid in full when you book. Email us if you want to exchange.",
        },
      ],
    },
  },
};
