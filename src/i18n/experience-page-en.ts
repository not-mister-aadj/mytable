import type { ExperiencePageLabels } from "./types";
import { images } from "@/data/images";
import {
  chefsSpecialFlowEn,
  tastingFlowEn,
  tastingQuotesEn,
  wineWalkFlowEn,
  wineWalkQuotesEn,
} from "./experience-mood-blocks-en";

export const experiencePageEn: ExperiencePageLabels = {
  viewTableCta: "View table",
  secondaryCta: "Back to agenda",
  heroTrustBar: "★★★★★ 4.8 · 1200+ guests at the table since 2024",
  heroTrustFooter:
    "Pay in full when you book · Free date exchange up to 48 hours before · Dietary needs welcome",
  heroSpotsHint: "{count} spots left for this date",
  pillSoloTogether: "Come alone or together",
  perPerson: "€{price} per person",
  aboutTitle: "About this experience",
  expectTitle: "What to expect",
  flowTitle: "How the evening flows",
  flowExpandCta: "View all steps",
  venuesTitle: "Where you join the table",
  venuesSubtitle:
    "Visit one of our partner restaurants. Super fun at the table: the chef prepares specials to surprise you, with wine and food in one place.",
  guestQuotesTitle: "What guests say",
  routeTitle: "An afternoon through {city}",
  routeMapEyebrow: "A feel for the route",
  routeMapTitle: "Past these spots in {city}",
  routeSubtitle:
    "Get a feel for the vibe and neighbourhood. All stops and addresses are on this page. We'll email them again one day before.",
  socialTitle: "A night out, your way.",
  socialSubtitle:
    "Your own table, come solo, or join others. You choose how social it gets.",
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
  bookingEmail: "Email",
  bookingName: "Name",
  bookingDietary: "Anything we should know about food?",
  bookingDietaryPlaceholder: "Allergies, veggie, no fish…",
  bookingSeatingLabel: "Who's coming with you?",
  bookingSeatingOwn: "Just our group, own table",
  bookingSeatingOwnHint: "Your table, your people. Wine and bites, no strangers.",
  bookingSeatingJoin: "I'll join others at the table",
  bookingSeatingJoinHint: "Solo or with a friend. New faces, easy conversation.",
  bookingTableLanguageLabel: "What language feels good at the table?",
  bookingTableLanguageBoth: "Dutch, English, or a mix of both",
  bookingTableLanguagePreferDutch: "Mostly Dutch, please",
  bookingStepNext: "Continue",
  bookingStepBack: "Back",
  bookingFemaleOnlyNote: "This table is for women only.",
  bookingMediaConsent:
    "By completing your booking, you agree that photos and videos may be taken during the event and used for MyTable marketing, including our website, social media, email and online ads.",
  bookingMediaConsentReadMore: "More in our",
  bookingMediaConsentTerms: "terms",
  bookingMediaConsentPrivacy: "privacy policy",
  bookingMediaConsentAnd: "and",
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
    closed: "Sold out",
    new: "New in our lineup",
  },
  closedCta: "Sold out",
  moods: {
    tastings: {
      tagline: "Wine tasting at one table, girls only or mixed group",
      experienceFlow: tastingFlowEn,
      guestQuotes: tastingQuotesEn,
      description:
        "You sit down at the table, taste several wines with matching bites, and enjoy what the chef prepares as specials for the table. No wine lecture, just context and room to enjoy at your own pace, usually two to three hours.",
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
          title: "Book your own table or join one",
          description:
            "Reserve for friends or a date, or come solo and join others who are up for a relaxed evening.",
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
        "Book your own table with friends, come alone, or pull up a chair with people who want a fun evening out.",
        "Taste, laugh, catch up without the fuss. Nobody's grading your wine knowledge; everyone's just curious.",
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
    wineWalk: {
      tagline: "A relaxed walk full of wine, great spots, and good company.",
      description:
        "A MyTable wine walk is not a scripted tour, but a relaxed afternoon in the city. You pass characterful spots, taste something nice along the way, and meet people naturally. The route gives structure, but the vibe stays easy and social.",
      experienceFlow: wineWalkFlowEn,
      guestQuotes: wineWalkQuotesEn,
      whatToExpect: [
        {
          title: "Several selected venues",
          description: "You visit different restaurants and wine bars in the city.",
        },
        {
          title: "Wine and bites along the way",
          description: "At each stop something is ready to try.",
        },
        {
          title: "Relaxed walking pace",
          description: "No rush between venues.",
        },
        {
          title: "Small social group",
          description: "Enough people to feel lively, not too large.",
        },
        {
          title: "Come alone or together",
          description: "Coming alone is very normal and welcome.",
        },
        {
          title: "No forced small talk",
          description: "Meeting people feels natural through the route and stops.",
        },
      ],
      socialParagraphs: [
        "With your own group or just along for the walk. You'll meet others who want a good afternoon out.",
        "Walk, taste, laugh. Not a dull tour: great stops and time to chat whenever you feel like it.",
      ],
      gallery: [
        images.wineBar,
        images.wineGlasses,
        images.restaurantInterior,
        images.cheers,
        images.heroMain,
        images.restaurantDining,
      ],
      duration: "About 3 to 4 hours",
      included: "Wine tastings, bites, and route guidance",
      walkingDistance: "Usually 2 to 4 km, depending on the city",
      faq: [
        {
          question: "Can I come alone?",
          answer:
            "Yes. Many people come alone. The route and group are set up so you can easily chat with others.",
        },
        {
          question: "Do I have to walk a lot?",
          answer:
            "No. The pace is relaxed and distances between venues stay manageable.",
        },
        {
          question: "What is included?",
          answer:
            "At each stop you get wine, a bite, or a small pairing. Exact details can vary by city.",
        },
        {
          question: "When do I get the route?",
          answer:
            "You receive practical info and the start location in advance. Venues may be shared before or closer to the date depending on the format.",
        },
        {
          question: "What if it rains?",
          answer:
            "The experience usually goes ahead. Bring a jacket or umbrella if unsure. We keep the pace relaxed.",
        },
      ],
    },
    chefsSpecial: {
      tagline: "A special evening at the table, curated by the chef.",
      description:
        "Chef's Special is an evening where you do not have to choose everything yourself. The restaurant sets the direction, the chef creates something special, and you join a table with good company. It is an accessible way to experience a restaurant differently.",
      experienceFlow: chefsSpecialFlowEn,
      guestQuotes: tastingQuotesEn,
      whatToExpect: [
        {
          title: "A special menu or multiple courses",
          description: "The restaurant shapes the evening.",
        },
        {
          title: "One selected restaurant",
          description: "Everything happens at one venue.",
        },
        {
          title: "Great atmosphere at the table",
          description: "Small group, relaxed conversation.",
        },
        {
          title: "Come alone or together",
          description: "Coming alone is very normal and welcome.",
        },
        {
          title: "Small group",
          description: "Usually 8 to 14 guests.",
        },
        {
          title: "No decision fatigue",
          description: "The chef or restaurant decides the lineup.",
        },
      ],
      socialParagraphs: [
        "Your own table with friends or pull up a chair: both work. Great food, good vibes, people who want a night out.",
        "Small enough to stay cozy, relaxed enough to just be yourself. Wine newbie or fan, everyone's welcome.",
      ],
      gallery: [
        images.restaurantDining,
        images.restaurantInterior,
        images.wineGlasses,
        images.cheers,
        images.wineBar,
        images.heroMain,
      ],
      duration: "About 2.5 to 3 hours",
      included: "Menu or multiple courses as described on the event page",
      faq: [
        {
          question: "Will I know what I eat in advance?",
          answer:
            "Sometimes yes, sometimes no. For Chef's Special the restaurant decides. If there is a fixed menu, we show it on the page.",
        },
        {
          question: "Are drinks included?",
          answer:
            "Only when this is clearly stated on the event page. Otherwise you pay for drinks at the restaurant.",
        },
        {
          question: "Can I share dietary requirements?",
          answer:
            "Yes. Tell us when you book and we align with the restaurant.",
        },
        {
          question: "Can I come alone?",
          answer:
            "Yes. The table is set up so coming alone feels normal and relaxed.",
        },
        {
          question: "Is this fine dining?",
          answer:
            "Not necessarily. Chef's Special means the restaurant puts together something special for the evening.",
        },
      ],
    },
  },
};
