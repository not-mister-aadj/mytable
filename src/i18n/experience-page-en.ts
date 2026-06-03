import type { ExperiencePageLabels } from "./types";
import { images } from "@/data/images";
import { tastingFlowEn, tastingQuotesEn } from "./experience-mood-blocks-en";

export const experiencePageEn: ExperiencePageLabels = {
  viewTableCta: "View table",
  secondaryCta: "Back to agenda",
  agendaCta: "View agenda",
  heroTrustBar: "★★★★★ 4.8 · 1200+ guests at the table since 2024",
  heroTrustFooter:
    "Free cancellation up to 48 hours before · Small groups · Hosted experience",
  heroSpotsHint: "{count} spots left for this date",
  pillSoloTogether: "Come alone or together",
  perPerson: "€{price} per person",
  aboutTitle: "About this experience",
  expectTitle: "What to expect",
  flowTitle: "How the evening flows",
  venuesTitle: "Where you join the table",
  venuesSubtitle:
    "One partner restaurant per evening. The chef prepares specials for the group — wine and food in one place.",
  guestQuotesTitle: "What guests say",
  routeTitle: "An afternoon through {city}",
  routeMapEyebrow: "Find on the map",
  routeMapTitle: "A walk past these restaurants",
  routeSubtitle:
    "You walk at an easy pace past carefully chosen stops. The full route arrives after booking.",
  routeOpenInApple: "Open route in Maps",
  routeMapSetupHint:
    "Preferred view: Apple Maps (MapKit). Add credentials for the full map embed.",
  socialTitle: "No awkward networking. Just a good table.",
  socialSubtitle:
    "MyTable is about relaxed meetings, good conversation, and a table where everyone feels welcome.",
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
    "Free cancellation up to 48 hours before",
    "Small groups & relaxed atmosphere",
    "Come alone or together",
    "Hosted experience",
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
    cancellation: "Cancellation",
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
    cancellation:
      "Free cancellation up to 48 hours before; after that the amount becomes credit",
    weather: "The tasting takes place indoors at the restaurant.",
    arrival:
      "Arrive 10 minutes before start. The host welcomes you and seats the group.",
    routeReveal:
      "You receive the restaurant and address by email after your booking is confirmed.",
    groupSize: "Small groups, usually 8 to 14 guests per table",
  },
  spotsByStatus: {
    available: "Plenty of seats still available",
    almostFull: "Only a few spots left — book soon",
    soldOut: "This table is sold out",
    new: "New in our lineup",
  },
  moods: {
    tastings: {
      tagline: "Wine tasting at one table — girls only or mixed group",
      experienceFlow: tastingFlowEn,
      guestQuotes: tastingQuotesEn,
      description:
        "MyTable starts with wine tastings at a single restaurant. You join a small group, taste several wines with matching bites, and enjoy what the chef prepares as specials for the table. No wine lecture — just context and room to enjoy at your own pace, usually two to three hours.",
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
            "Plan for two to three hours. No tight schedule — time to taste, talk, and linger.",
        },
        {
          title: "Adjustments on request",
          description:
            "Dietary needs or preferences? Tell us when you book and we align with the chef where possible.",
        },
      ],
      socialParagraphs: [
        "Tastings attract people who like discovery without hassle. Conversation moves from flavour to favourite spots in the city, and often beyond. Because you stay in one place all evening, everything feels calm and personal.",
        "Whether you taste a lot or are new to wine, everyone starts on equal footing. It's about curiosity, not expertise. That's how conversations go beyond what's in your glass.",
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
            "Girls only means only women join the table. Mixed groups welcome everyone — solo, with friends, or on a date.",
        },
        {
          question: "What is a chef's special?",
          answer:
            "The chef prepares dishes and pairings specifically for your table — not standard à la carte, but matched to the wine and the group.",
        },
        {
          question: "Can I share dietary requirements?",
          answer:
            "Yes. Tell us when you book. The chef adjusts the specials where possible.",
        },
        {
          question: "How many pours are included?",
          answer:
            "Usually between five and seven tasting moments with matching bites from the chef.",
        },
        {
          question: "Where does the tasting take place?",
          answer:
            "At one partner restaurant per city. The exact venue is on your booking confirmation.",
        },
      ],
    },
  },
};
