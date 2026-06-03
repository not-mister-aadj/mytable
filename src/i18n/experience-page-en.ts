import type { ExperiencePageLabels } from "./types";
import { images } from "@/data/images";
import {
  mysteryFlowEn,
  mysteryQuotesEn,
  sharedDinnerFlowEn,
  sharedDinnerQuotesEn,
  sundayFlowEn,
  sundayQuotesEn,
  tastingFlowEn,
  tastingQuotesEn,
  wineWalkFlowEn,
  wineWalkQuotesEn,
} from "./experience-mood-blocks-en";

export const experiencePageEn: ExperiencePageLabels = {
  viewTableCta: "View table",
  secondaryCta: "Back to agenda",
  agendaCta: "View agenda",
  heroTrustBar: "★★★★★ 4.8 · 1200+ guests at the table since 2024",
  heroTrustFooter:
    "Free cancellation up to 48 hours before · Small groups · Hosted experience",
  heroSpotsHint: "Only {count} spots left for this date",
  pillSoloTogether: "Come solo or together",
  perPerson: "€{price} per person",
  aboutTitle: "About this experience",
  expectTitle: "What to expect",
  flowTitle: "How does the experience unfold?",
  venuesTitle: "Discover the places at the table",
  venuesSubtitle:
    "From hidden wine bars to restaurants with character. Every stop is about atmosphere, taste, and good company.",
  guestQuotesTitle: "What guests say",
  routeTitle: "An afternoon through {city}",
  routeMapEyebrow: "Explore on the map",
  routeMapTitle: "A walk past these restaurants",
  routeSubtitle:
    "You walk at an easy pace past carefully chosen stops. The full route arrives after booking.",
  routeOpenInApple: "Open route in Maps",
  routeMapSetupHint:
    "Preferred view: Apple Maps (MapKit). Add credentials for the full Apple map.",
  socialTitle: "No awkward networking. Just a good table.",
  socialSubtitle:
    "MyTable is about relaxed meetings, good conversation, and a table where everyone feels welcome.",
  galleryTitle: "Atmosphere",
  practicalTitle: "Practical info",
  faqTitle: "Frequently asked questions",
  relatedTitle: "More tables to explore",
  finalCtaHeadline: "Take a seat at a table that makes your Sunday better.",
  finalCtaSubheadline:
    "Good wine, beautiful places, and conversations that happen naturally.",
  finalCtaPrimary: "Reserve your spot",
  finalCtaSecondary: "Browse other tables",
  bookingDate: "Date",
  bookingTime: "Time",
  bookingCity: "City",
  bookingPrice: "Price",
  bookingSpots: "Spots",
  spotsLeftBadge: "Only {count} spots left",
  bookingViewsLabel: "{count} people viewed this table this week",
  bookingTrustBullets: [
    "Free cancellation up to 48 hours before",
    "Small groups & relaxed atmosphere",
    "Come solo or together",
    "Hosted experience",
  ],
  trustLines: [
    "Curated venues and hosts",
    "Come solo, with friends, or as a pair",
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
    dietary: "Share when booking, we'll coordinate with the venue",
    solo: "Arriving alone is completely normal and warmly welcomed",
    cancellation:
      "Free cancellation up to 48 hours before, after that the amount becomes credit",
    weather:
      "In rain we adjust the route where needed. Only extreme weather changes the programme.",
    arrival:
      "Arrive 10 minutes before start. Your host welcomes you and gathers the group.",
    routeReveal:
      "The full route and addresses arrive by email after your booking is confirmed.",
    groupSize: "Small groups, usually 8 to 14 guests per table",
  },
  spotsByStatus: {
    available: "Plenty of seats still available",
    almostFull: "Only a few seats left, book soon",
    soldOut: "This table is sold out",
    new: "New in our lineup",
  },
  moods: {
    wineWalks: {
      tagline:
        "A relaxed Sunday afternoon of wine, beautiful spots, and good company.",
      experienceFlow: wineWalkFlowEn,
      guestQuotes: wineWalkQuotesEn,
      description:
        "A MyTable wine walk is not a scripted tour, but a relaxed afternoon through the city. You stroll past carefully chosen wine bars and characterful spots, taste something delicious at each stop, and keep joining tables full of new company. The pace is easy, the mood is warm, and there is always room for a good conversation.",
      whatToExpect: [
        {
          title: "Start with a welcome drink",
          description:
            "We begin together with a glass and a short intro, so everyone feels at ease right away.",
        },
        {
          title: "Three to four tasting moments",
          description:
            "Along the way you taste wines and matching bites at venues we have personally selected.",
        },
        {
          title: "Easy walking pace",
          description:
            "No rush, no marathon. We take our time to taste, talk, and see the city.",
        },
        {
          title: "A mix of solo guests and pairs",
          description:
            "The group is always a good blend. You do not need to know anyone to feel at home immediately.",
        },
        {
          title: "Host who handles everything",
          description:
            "Our host guides the route, introduces each venue, and keeps the atmosphere light and easy.",
        },
        {
          title: "Finish with a toast",
          description:
            "We end with one last glass, and people often linger to chat. Nothing scheduled after that.",
        },
      ],
      socialParagraphs: [
        "Wine walks may be our most relaxed tables. You are not seated at one long table all evening, but move through the city and connect with new people along the way. That makes conversation feel natural, never forced.",
        "Many guests arrive solo and leave with new favorite spots in the city. Sometimes people exchange details, sometimes they do not. Both are fine. The point is an afternoon where you feel good, with good wine and warm company.",
      ],
      gallery: [
        images.cityWalk,
        images.wineGlasses,
        images.wineBar,
        images.cheers,
        images.heroMain,
        images.restaurantInterior,
      ],
      duration: "About 4 hours",
      included: "Wine tastings, bites, and guided city walk",
      walkingDistance: "About 3 km, easy pace with regular stops",
      faq: [
        {
          question: "Do I need a lot of wine knowledge?",
          answer:
            "Not at all. We taste in an accessible way and are happy to explain what you are trying, without turning it into a lecture.",
        },
        {
          question: "What if I come alone?",
          answer:
            "Perfect. Many guests arrive solo and enjoy it that way. Our hosts make sure everyone connects quickly.",
        },
        {
          question: "Are the venues wheelchair accessible?",
          answer:
            "It varies by route. Email us in advance if you have specific needs and we will find the best option.",
        },
        {
          question: "What happens in bad weather?",
          answer:
            "In rain we adjust the route where needed. We only switch to an alternative program in extreme weather.",
        },
      ],
    },
    sharedDinners: {
      tagline: "One table, new faces, an evening full of flavor",
      experienceFlow: sharedDinnerFlowEn,
      guestQuotes: sharedDinnerQuotesEn,
      description:
        "At a shared dinner you join one long table at a restaurant we have carefully chosen. The menu is thoughtful, the atmosphere is warm, and the evening is about good food and open conversation. You do not need to know anyone. We create the setting, you enjoy the table.",
      whatToExpect: [
        {
          title: "Welcome drink on arrival",
          description:
            "You start with a glass in hand, so the evening begins in a relaxed way from the first minute.",
        },
        {
          title: "Shared menu",
          description:
            "The restaurant serves a menu that fits the mood of the evening, with attention to season and flavor.",
        },
        {
          title: "Long table, open seating",
          description:
            "Everyone sits at the same table. No assigned seats, no speeches, just an evening together.",
        },
        {
          title: "A mix of solo guests and pairs",
          description:
            "The group is thoughtfully composed so conversation starts naturally and no one is left on the sidelines.",
        },
        {
          title: "Host on hand",
          description:
            "Our host welcomes everyone, introduces the concept briefly, and keeps the mood light without steering it.",
        },
        {
          title: "Room to keep talking",
          description:
            "After dessert there is no hard end time. Stay if you like, leave on time if you prefer.",
        },
      ],
      socialParagraphs: [
        "Shared dinners are for people who want a beautiful night out, with food worth the trip and company that arrives on its own. It feels like dining with friends, except you have not met them yet.",
        "We keep groups small enough for intimacy, but large enough for variety. Nobody has to network. All we ask is openness to good conversation and an empty stomach.",
      ],
      gallery: [
        images.restaurantDining,
        images.longTable,
        images.cheers,
        images.restaurantInterior,
        images.heroMain,
        images.wineGlasses,
      ],
      duration: "About 3 hours",
      included: "Welcome drink, three-course menu, and coffee or tea",
      faq: [
        {
          question: "Can I share dietary needs?",
          answer:
            "Yes, share them when booking. We coordinate with the restaurant so they can accommodate you.",
        },
        {
          question: "How large is the group?",
          answer:
            "Usually between 10 and 16 people. Small enough for real conversation, large enough for variety.",
        },
        {
          question: "What if I do not click with someone?",
          answer:
            "That can happen, just like in real life. The table is long enough to find your place and the mood stays relaxed.",
        },
        {
          question: "Is drink included in the price?",
          answer:
            "Welcome drink and coffee or tea are included. Extra wine or cocktails you order yourself at the table.",
        },
      ],
    },
    tastings: {
      tagline: "Taste, learn, and laugh around an intimate table",
      experienceFlow: tastingFlowEn,
      guestQuotes: tastingQuotesEn,
      description:
        "Our tastings are small-scale sessions in wine bars and restaurants where flavor comes first. You try several wines or pairings with bites, get context without a classroom feel, and meet people who are just as curious about good taste. It is convivial, informal, and always focused on quality.",
      whatToExpect: [
        {
          title: "Intimate group size",
          description:
            "We work with small groups so everyone can taste, ask questions, and join the conversation.",
        },
        {
          title: "Curated tasting selection",
          description:
            "Each tasting has a theme, such as a region, grape variety, or seasonal pairing with bites.",
        },
        {
          title: "Accessible guidance",
          description:
            "Our host or sommelier shares background and tips without turning it into an exam.",
        },
        {
          title: "Matching bites",
          description:
            "Each tasting includes small dishes that lift the flavors and complete the evening.",
        },
        {
          title: "Room for questions",
          description:
            "No silly questions. Everyone tastes differently, and that is part of the fun.",
        },
        {
          title: "Relaxed finish",
          description:
            "After the final pour there is time to chat, order more, or simply enjoy the atmosphere.",
        },
      ],
      socialParagraphs: [
        "Tastings attract people who love discovering new things. Conversation moves from flavor to favorite city spots, and often beyond. Because you sit at a table instead of wandering a room, everything feels personal and warm.",
        "Whether you taste often or are looking at wine seriously for the first time, everyone starts on equal footing. It is about curiosity, not expertise. That is why conversations often go far beyond what is in your glass.",
      ],
      gallery: [
        images.wineBar,
        images.wineGlasses,
        images.restaurantInterior,
        images.cheers,
        images.heroMain,
        images.restaurantDining,
      ],
      duration: "About 2.5 hours",
      included: "Wine tasting flight and matching bites",
      faq: [
        {
          question: "How many pours will I taste?",
          answer:
            "It varies by session, usually between five and seven tasting moments with matching bites.",
        },
        {
          question: "Can I join as a non-drinker?",
          answer:
            "Email us in advance. Some sessions offer non-alcoholic alternatives, depending on the theme.",
        },
        {
          question: "Is food included?",
          answer:
            "Yes, bites are part of the tasting. It is not a full dinner, but you will not leave hungry.",
        },
        {
          question: "Where do tastings take place?",
          answer:
            "In wine bars and restaurants we select personally. The exact venue is on your booking confirmation.",
        },
      ],
    },
    sundayTables: {
      tagline: "Sunday tables, long lunch pleasure, and light energy",
      experienceFlow: sundayFlowEn,
      guestQuotes: sundayQuotesEn,
      description:
        "Sunday Tables are our slow Sundays around the table. Think long lunch or brunch in a beautiful room, with seasonal dishes, good coffee, and the calm energy only a Sunday can bring. You join people who want an afternoon without rush, with room for conversation and great food.",
      whatToExpect: [
        {
          title: "Long table in daylight",
          description:
            "We choose venues with plenty of light and a warm, inviting atmosphere that suits a lazy Sunday.",
        },
        {
          title: "Seasonal menu or brunch",
          description:
            "The menu changes per edition, always with attention to fresh flavors and beautiful presentation.",
        },
        {
          title: "Coffee, tea, and welcome",
          description:
            "You start with something warm in hand while everyone arrives and takes their seat.",
        },
        {
          title: "Relaxed pace",
          description:
            "No tight schedule. Dishes arrive gently, so you can enjoy and talk.",
        },
        {
          title: "A mix of company",
          description:
            "Solo guests, friends, and pairs share the table. The mood is open and low-pressure.",
        },
        {
          title: "Soft landing at the end",
          description:
            "After dessert there is room to keep talking or close the afternoon quietly.",
        },
      ],
      socialParagraphs: [
        "Sunday tables feel like an invitation to slow down. People often arrive straight from their weekend and pull up a chair without expectations. It is the perfect table if you want company without the bustle of a Friday night.",
        "Because it happens during the day, everything feels lighter. Conversations drift toward travel, favorite spots, what you ate last week. It is social, but never heavy. Exactly how a Sunday should feel.",
      ],
      gallery: [
        images.brunch,
        images.longTable,
        images.restaurantDining,
        images.cheers,
        images.heroMain,
        images.restaurantInterior,
      ],
      duration: "About 3 hours",
      included: "Welcome drink, shared lunch or brunch, and coffee or tea",
      faq: [
        {
          question: "Is this brunch or lunch?",
          answer:
            "It varies by edition. On the detail page and in your confirmation you will see exactly what is on the menu.",
        },
        {
          question: "Can I bring children?",
          answer:
            "Our Sunday Tables are aimed at adults. Contact us if you have a specific question.",
        },
        {
          question: "What time does it start?",
          answer:
            "Usually around midday. The exact start time is on your booking confirmation.",
        },
        {
          question: "What if I am late?",
          answer:
            "Let us know. We will try to seat you, but the menu sometimes progresses on schedule.",
        },
      ],
    },
    mysteryTables: {
      tagline: "The venue stays a surprise, the atmosphere does not",
      experienceFlow: mysteryFlowEn,
      guestQuotes: mysteryQuotesEn,
      description:
        "At a Mystery Table you do not know where you are eating beforehand, but you do know it will be worth it. We select a restaurant that fits the evening, reveal the location shortly before start, and set a table full of new company. It feels like a mini adventure, with all the comfort of a MyTable experience.",
      whatToExpect: [
        {
          title: "Venue revealed just before",
          description:
            "You receive details a few days before the evening, enough time to prepare without losing the mystery.",
        },
        {
          title: "Curated restaurant",
          description:
            "Every mystery venue has been visited by us and meets our standard for atmosphere, quality, and service.",
        },
        {
          title: "Shared dinner at one table",
          description:
            "You eat together with the group at one long table, just like our other dinner experiences.",
        },
        {
          title: "Theme or style per edition",
          description:
            "Sometimes it is a surprising cuisine, sometimes a hidden gem. Each evening has its own character.",
        },
        {
          title: "Host who keeps the secret",
          description:
            "Until the reveal, only our team knows where you are going. You just need to show up.",
        },
        {
          title: "An evening full of anticipation",
          description:
            "The mystery makes the start of the night playful. People guess, laugh, and enjoy the surprise together.",
        },
      ],
      socialParagraphs: [
        "Mystery Tables are for people who like doing something unexpected, but still want certainty about quality. The secret gives the evening a playful start, and once you walk in everything feels familiar.",
        "Many guests arrive with an open mind and leave with a new favorite place they might never have found alone. That is exactly why we built this format, surprise with good taste.",
      ],
      gallery: [
        images.mysteryDinner,
        images.restaurantInterior,
        images.cheers,
        images.restaurantDining,
        images.wineBar,
        images.heroMain,
      ],
      duration: "About 3 hours",
      included: "Welcome drink, three-course menu, and venue surprise",
      faq: [
        {
          question: "When will I find out where it is?",
          answer:
            "Usually three to five days before the evening. You will receive an email with address, time, and practical tips.",
        },
        {
          question: "Can I share dietary needs?",
          answer:
            "Yes, share them when booking. We choose a venue that can work with them and coordinate with the restaurant.",
        },
        {
          question: "What if I do not like the cuisine?",
          answer:
            "We vary styles per edition. Look at past editions or email us if you have specific preferences.",
        },
        {
          question: "Is it safe to come alone?",
          answer:
            "Absolutely. Many guests arrive solo. You are never alone on the street, and at the table you are part of the group right away.",
        },
      ],
    },
  },
};
