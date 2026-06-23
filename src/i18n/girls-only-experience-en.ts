import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
  ExperienceMoodContent,
} from "./types";

export const girlsOnlyTastingFlowEn: ExperienceFlowStep[] = [
  {
    title: "Welcome & intro",
    description:
      "You're welcomed with a first glass. The host briefly explains what the chef has planned for your table.",
  },
  {
    title: "Taste at your table",
    description:
      "Four wines and chef's bites, paired together. You sit at your own table and set the pace.",
  },
  {
    title: "Cozy, no hassle",
    description:
      "No menu drama, no splitting the bill. Just tasting, laughing, and catching up like a night out with your crew.",
  },
  {
    title: "Finish without rushing",
    description:
      "Plan on two to three hours. Stay for a drink at the bar if you like.",
  },
];

export const girlsOnlyTastingQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "Exactly the kind of night we were looking for. Four wines, great bites, and zero planning stress.",
    name: "Lisa",
    detail: "with 3 friends",
  },
  {
    quote:
      "Booked with my sister and two friends. Our own table, everything sorted. We spent the whole evening tasting and catching up.",
    name: "Sanne",
    detail: "group of 4",
  },
  {
    quote:
      "No group available, so I went solo. Still a lovely evening. It was mostly about the wine and the vibe.",
    name: "Noor",
    detail: "solo",
  },
];

export const girlsOnlyTastingsMoodEn: Partial<ExperienceMoodContent> = {
  tagline: "Girls-only wine & bites with your friends. No hassle.",
  description:
    "An evening of wine and bites with your crew at one table. Four wines, chef's specials, and everything around the table sorted. No wine exam, just context and room to enjoy at your pace, usually two to three hours.",
  experienceFlow: girlsOnlyTastingFlowEn,
  guestQuotes: girlsOnlyTastingQuotesEn,
  whatToExpect: [
    {
      title: "Wine and bites sorted",
      description:
        "Four wines and chef's bites. We handle everything around the table. You just show up.",
    },
    {
      title: "Your own table",
      description:
        "Book for your group and sit together at your own table. Two, four, or more: you decide who joins.",
    },
    {
      title: "One restaurant, one evening",
      description:
        "No stops across the city. Everything happens at one carefully chosen spot.",
    },
    {
      title: "Solo? That works too",
      description:
        "No full group? Book solo or bring a friend and join other girls. MyTable finds your spot.",
    },
    {
      title: "Accessible guidance",
      description:
        "Our host shares background on the wines without turning it into an exam.",
    },
    {
      title: "Your own pace",
      description:
        "Plan on two to three hours. No tight schedule, room to taste, talk, and linger.",
    },
  ],
  socialParagraphs: [
    "Book a table for your group and enjoy a night that feels like dinner out with your crew.",
    "Tasting, laughing, catching up. No networking talk, no speed-dating vibe. Just a fun girls' wine night.",
  ],
  faq: [
    {
      question: "Can I book with my friends?",
      answer:
        "Yes. Reserve for your group and you sit together at your own table. Two, four, or more: you decide who joins.",
    },
    {
      question: "What if I don't have a group?",
      answer:
        "Book solo or bring a friend and join other girls at the table. MyTable makes sure you land at a cozy table.",
    },
    {
      question: "What is a chef's special?",
      answer:
        "The chef prepares dishes and pairings especially for your table. Not standard à la carte, but something that fits the wine and the group.",
    },
    {
      question: "Can I share dietary needs?",
      answer:
        "Yes. Tell us when you book. The chef adjusts the specials where possible.",
    },
    {
      question: "Where does the tasting take place?",
      answer:
        "At one partner restaurant per city. The exact location is on your booking confirmation.",
    },
    {
      question: "Can I cancel or exchange?",
      answer:
        "Cancellations are not available. You can exchange to another date for free up to 48 hours before start. Everything is paid in full when you book.",
    },
  ],
};

export const girlsOnlyExperienceLabelsEn = {
  pillSoloTogether: "With your friends · solo welcome too",
  socialTitle: "A girls' wine night with your crew.",
  socialSubtitle:
    "Your own table with your group, or join others if you don't have a full group.",
  finalCtaHeadline: "Ready for your next girls' wine night?",
  finalCtaSubheadline:
    "Four wines, chef's bites, and a night that feels like dinner out with your friends.",
  bookingSeatingOwn: "With my friends, own table",
  bookingSeatingOwnHint: "Your table, your crew. Wine, bites, no hassle.",
  bookingSeatingJoin: "I'll join others at the table",
  bookingSeatingJoinHint:
    "Solo or with a friend. MyTable finds your spot at the table.",
  bookingTrustBullets: [
    "Pay in full when you book",
    "Free date exchange up to 48 hours before",
    "Dietary needs welcome",
    "With friends or solo",
  ],
  practicalValues: {
    solo: "No group? Join solo or bring a friend",
    groupSize: "Small tables, usually 8 to 14 women per evening",
  },
};

export const girlsOnlyWineTastingCardTextEn =
  "Four wines, chef's bites, and a night that feels like dinner out with your crew.";

export const girlsOnlyWineTastingTaglineEn =
  "Girls-only wine & bites with your friends. No hassle.";
