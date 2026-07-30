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
  viewTableCta: "Plan your table",
  secondaryCta: "Back to agenda",
  heroTrustBar: "★★★★★ 4.8 · 1200+ guests at the table since 2024",
  heroTrustFooter:
    "Pay in full when you book · Free date exchange up to 48 hours before · Dietary needs welcome",
  heroSpotsHint: "{count} spots left for this date",
  heroBenefitBullets: [
    "Four wines + paired bites at the table",
    "Book for yourself or your own party",
    "Pay upfront, no bill to split at the table",
  ],
  pillSoloTogether: "Book your tickets",
  perPerson: "€{price} per person",
  perPersonFrom: "€{price} per person",
  includedEyebrow: "What's included",
  includedTitle: "Everything sorted for one afternoon out",
  includedSubtitle:
    "One restaurant, one table. You book ahead; we arrange wine, bites and the experience.",
  includedItems: [
    { value: "4", label: "wines" },
    { value: "4", label: "bites" },
    { value: "1", label: "restaurant" },
    { value: "100%", label: "paid upfront" },
  ],
  aboutTitle: "About this experience",
  expectTitle: "What to expect",
  flowEyebrow: "Good to know",
  flowTitle: "How does it work?",
  flowExpandCta: "View all steps",
  venuesTitle: "The restaurants",
  venuesSubtitle:
    "At a partner restaurant: chef specials with wine and food in one place.",
  guestQuotesTitle: "What guests say",
  guestQuotesEyebrow: "Experiences",
  midCtaEyebrow: "Get tickets",
  midCtaTitle: "Ready to book?",
  midCtaTrustLine:
    "Free exchange up to 48 hours before · Pay in full when you book · Dietary needs welcome",
  routeTitle: "An afternoon through {city}",
  routeMapEyebrow: "The route",
  routeMapTitle: "Past these spots in {city}",
  routeSubtitle:
    "All stops are on this page. We email the details again one day before.",
  socialTitle: "Your evening, our organisation.",
  socialSubtitle:
    "Book tickets for yourself, a date, friends or a group. We arrange wine, food and the venue.",
  galleryTitle: "Atmosphere",
  practicalTitle: "Practical info",
  faqTitle: "Frequently asked questions",
  relatedTitle: "More experiences",
  finalCtaHeadline: "Reserve your spot for great wine and food.",
  finalCtaSubheadline:
    "Chef's special or tasting: one restaurant, everything arranged ahead.",
  finalCtaPrimary: "Plan your table",
  finalCtaSecondary: "See other dates",
  bookingDate: "Date",
  bookingTime: "Time",
  bookingCity: "City",
  bookingPrice: "Price",
  bookingSpots: "Spots",
  bookingEmail: "Email",
  bookingName: "Name",
  bookingDietary: "Anything we should know about food?",
  bookingDietaryPlaceholder: "Allergies, veggie, no fish…",
  bookingTiers: {
    legend: "Number of tickets",
    perPerson: "€{price} p.p.",
    perPersonFrom: "€{price} p.p.",
    bestValue: "Recommended",
    mostChosen: "Most chosen",
    seatOne: "1 spot",
    seatOther: "{count} spots",
    seatsFrom: "From {count} spots",
    groupSeatsLabel: "Number of tickets",
    seatsJoinOthers: "ticket",
    seatsOwnTable: "you'll sit together",
    seatingTogetherHint:
      "Book the number of tickets for yourself or your party. You sit with the people you bring.",
    soloTitle: "Just me",
    duoTitle: "The two of us",
    groupTitle: "Bring a group",
    tableTitle: "Reserve a table",
    soloCta: "Reserve my spot",
    duoCta: "Reserve our spots",
    groupCta: "Reserve our spots",
    tableCta: "Reserve the table",
  },
  bookingSeatingLabel: "Who's coming with you?",
  bookingSeatingOwn: "Own party",
  bookingSeatingOwnHint: "Your table, your group. Wine and bites included.",
  bookingSeatingJoin: "Just me",
  bookingSeatingJoinHint: "Book one or more tickets for yourself.",
  bookingTableLanguageLabel: "Preferred language at the table",
  bookingTableLanguageHint:
    "Helpful for the staff. Dutch and English are both fine.",
  bookingTableLanguageBoth: "Dutch, English, or a mix of both",
  bookingTableLanguagePreferDutch: "Mostly Dutch, please",
  bookingStepNext: "Continue",
  bookingStepBack: "Back",
  bookingFemaleOnlyNote: "This experience is for women only.",
  bookingPriorityList:
    "Add me to the waitlist. I'll hear about new dates first and get a nice discount.",
  bookingMediaConsent:
    "Photos and videos may be taken during the event for MyTable (website, socials and email).",
  bookingMediaConsentReadMore: "More in our",
  bookingMediaConsentTerms: "terms",
  bookingMediaConsentPrivacy: "privacy policy",
  bookingMediaConsentAnd: "and",
  spotsLeftBadge: "{count} spots still available",
  bookingViewsLabel: "{count} people viewed this experience this week",
  bookingTrustBullets: [
    "Pay in full when you book",
    "Free date exchange up to 48 hours before",
    "Dietary needs welcome",
    "Book for yourself or your group",
  ],
  trustLines: [
    "Selected restaurants and hosts",
    "Book for yourself or your own party",
    "Wine, food and atmosphere, arranged ahead",
  ],
  practicalLabels: {
    dayOfWeek: "Day",
    partOfDay: "Part of day",
    startTime: "Start time",
    duration: "Duration",
    city: "City",
    included: "Included",
    dietary: "Dietary needs",
    solo: "Booking individually",
    payment: "Payment",
    exchange: "Exchanges",
    walking: "Walking distance",
    weather: "Weather",
    arrival:
      "Arrive 10 minutes before start. The host or staff will show you to your seats.",
    routeReveal: "Route & venues",
    groupSize: "Depends on the format; details are on the event page",
  },
  practicalValues: {
    dietary:
      "Tell us when you book. The chef adjusts the specials where possible.",
    solo: "You book tickets for yourself or your party",
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
      tagline: "Four wines and bite pairings at one table.",
      experienceFlow: tastingFlowEn,
      guestQuotes: tastingQuotesEn,
      description:
        "On Sunday afternoon you sit down for four wines with bite pairings, chosen by the wine bar. No wine exam: a tasting in one place, paid ahead, at your own pace.",
      whatToExpect: [
        {
          title: "One wine bar, one table",
          description:
            "Everything happens in one place. You book ahead; we arrange wine, bites and the organisation.",
        },
        {
          title: "Four wines, chosen by the wine bar",
          description:
            "The wine bar puts the tasting together: four wines with matching bite pairings.",
        },
        {
          title: "With your own party",
          description:
            "Book tickets for yourself, a date, friends or a group. You sit with the people you bring.",
        },
        {
          title: "Your own pace",
          description:
            "Plan for the afternoon. No tight schedule. Extra orders are often possible at the table.",
        },
        {
          title: "Adjustments on request",
          description:
            "Dietary needs or preferences? Tell us when you book and we align where possible.",
        },
      ],
      socialParagraphs: [
        "Book tickets for your own party. We arrange the tasting, the venue and the organisation.",
        "Taste without wine knowledge. Everything is paid ahead; you come to enjoy.",
      ],
      gallery: [
        images.wineBar,
        images.wineGlasses,
        images.restaurantInterior,
        images.cheers,
        images.heroMain,
        images.restaurantDining,
      ],
      dayOfWeek: "Always on Sunday",
      partOfDay: "Afternoon",
      duration: "Whole afternoon, at your own pace",
      included: "Four wines with bite pairings, chosen by the wine bar",
      faq: [
        {
          question: "Will I sit with strangers?",
          answer:
            "No. You book tickets for yourself or your party. Matching with new people happens only via Clubmember and Sunday Table, not on this experience.",
        },
        {
          question: "Can I share dietary requirements?",
          answer:
            "Yes. Tell us when you book. The chef adjusts the specials where possible.",
        },
        {
          question: "Can I order more?",
          answer:
            "At the table you can often order extras, such as another course, bite, or glass. Some partner venues also sell the full bottle. It varies by restaurant; staff will explain.",
        },
        {
          question: "Where does the tasting take place?",
          answer:
            "At one partner restaurant per city. The exact venue is on your booking confirmation.",
        },
        {
          question: "When are the events?",
          answer:
            "Usually on Sunday afternoon. The exact time is on the event page and in your confirmation email.",
        },
        {
          question: "Can I cancel or exchange?",
          answer:
            "Cancellations are not available. You can exchange to another date for free up to 48 hours before start. Everything is paid in full when you book. Email us if you want to exchange.",
        },
      ],
    },
    wineWalk: {
      tagline: "Several restaurants, wine and food at every stop.",
      description:
        "A Wine Walk is a culinary walk through the city. You visit several restaurants and taste a pairing at each stop. Not a guided tour: a fixed route with your own party, at a relaxed pace.",
      experienceFlow: wineWalkFlowEn,
      guestQuotes: wineWalkQuotesEn,
      whatToExpect: [
        {
          title: "Several restaurants",
          description:
            "You visit different places and discover the city by tasting.",
        },
        {
          title: "Wine and food at every stop",
          description: "At each venue a pairing is ready.",
        },
        {
          title: "Relaxed walking pace",
          description: "No rush between venues. Distances stay manageable.",
        },
        {
          title: "With your own party",
          description:
            "You walk and taste with the people you booked for. No matching with other guests.",
        },
        {
          title: "Everything arranged ahead",
          description:
            "Tickets, route and pairings are paid and organised in advance.",
        },
      ],
      socialParagraphs: [
        "Book for yourself, a duo or a group. Along the way you follow the route with your own party.",
        "Walk, taste, move on. Not a dull tour: clear stops and space at your pace.",
      ],
      gallery: [
        images.wineBar,
        images.wineGlasses,
        images.restaurantInterior,
        images.cheers,
        images.heroMain,
        images.restaurantDining,
      ],
      dayOfWeek: "Always on Sunday",
      partOfDay: "Afternoon",
      duration: "About 3 to 4 hours",
      included: "Wine and food pairings and route",
      walkingDistance: "Usually 2 to 4 km, depending on the city",
      faq: [
        {
          question:
            "What's the difference between a wine-food walk and a food walk?",
          answer:
            "On a wine-food walk (Wine Walk), the focus is on the wines, with a matching pairing at each stop. On a food walk, the food is the star. Matching wines may be offered, but they're optional: you can enjoy the walk without wine too.",
        },
        {
          question: "Can I book alone?",
          answer:
            "Yes. You book tickets for yourself. You follow the route with your own party; we do not match you with other guests.",
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
          question: "When are the wine walks?",
          answer:
            "Usually on Sunday during the day. The exact time is on the event page and in your confirmation email.",
        },
        {
          question: "When do I get the route?",
          answer:
            "You receive practical info and the start location in advance. Stops are also on this page.",
        },
        {
          question: "What if it rains?",
          answer:
            "The experience usually goes ahead. Bring a jacket or umbrella if unsure. The pace stays relaxed.",
        },
      ],
    },
    chefsSpecial: {
      tagline: "The best of the restaurant, family style.",
      description:
        "Chef's Table is an evening to discover the restaurant the way the chef intended. Multiple starters, mains and desserts arrive family style: shared with your party, so everyone tastes more.",
      experienceFlow: chefsSpecialFlowEn,
      guestQuotes: tastingQuotesEn,
      whatToExpect: [
        {
          title: "Multiple courses, family style",
          description:
            "Starters, mains and dessert land in the middle of the table.",
        },
        {
          title: "The best of the kitchen",
          description:
            "The chef shapes the evening so you taste more of the restaurant than with a single plate of your own.",
        },
        {
          title: "One restaurant",
          description:
            "Everything happens in one place. You book ahead for your party.",
        },
        {
          title: "No decision fatigue",
          description:
            "You do not build a menu. The chef decides what comes out.",
        },
      ],
      socialParagraphs: [
        "Book a table or tickets for your own party. Dishes in the middle, taste first.",
        "Family style so you taste more of the kitchen, without organising it yourself.",
      ],
      gallery: [
        images.restaurantDining,
        images.restaurantInterior,
        images.wineGlasses,
        images.cheers,
        images.wineBar,
        images.heroMain,
      ],
      dayOfWeek: "Always on Sunday",
      partOfDay: "Evening",
      duration: "About 2.5 to 3 hours",
      included:
        "Multiple starters, mains and dessert, family style",
      faq: [
        {
          question: "Will I know what I eat in advance?",
          answer:
            "Sometimes yes, sometimes no. For Chef's Table the chef shapes the evening. If there is a fixed menu, we show it on the page.",
        },
        {
          question: "What does family style mean?",
          answer:
            "Dishes come to the middle of the table so you share with your party and taste more of the kitchen.",
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
          question: "Can I book alone?",
          answer:
            "Yes. You book tickets for yourself. You sit with the people you bring, not with strangers.",
        },
        {
          question: "When are the Chef's Tables?",
          answer:
            "Usually on Sunday evening. The exact time is on the event page and in your confirmation email.",
        },
        {
          question: "Is this fine dining?",
          answer:
            "Not necessarily. Chef's Table mainly means you taste the best of the kitchen family style.",
        },
      ],
    },
  },
};

