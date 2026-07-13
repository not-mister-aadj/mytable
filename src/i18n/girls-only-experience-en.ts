import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
  ExperienceMoodContent,
} from "./types";

export const girlsOnlyTastingFlowEn: ExperienceFlowStep[] = [
  {
    title: "Welcome & intro",
    description:
      "You're welcomed with a first glass. The host briefly explains which wines the restaurant has chosen and how they're paired.",
  },
  {
    title: "Taste at your table",
    description:
      "Four wines and matching bites, paired together. You sit at your own table and set the pace.",
  },
  {
    title: "Cozy, no hassle",
    description:
      "No menu drama, no splitting the bill. Just tasting, laughing, and catching up like an afternoon out with your crew.",
  },
  {
    title: "Finish without rushing",
    description:
      "Plan for the whole afternoon. Sometimes the fun continues afterward — more wine, drinks, or dinner out with your crew.",
  },
];

export const girlsOnlyTastingQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "I came solo and was genuinely nervous. But within ten minutes I was chatting away. Way more fun than I expected.",
    name: "Lisa",
    detail: "with 3 friends",
  },
  {
    quote:
      "Booked with my sister and two friends. Our own table, everything sorted. Why didn't we do this sooner?",
    name: "Sanne",
    detail: "group of 4",
  },
  {
    quote:
      "My friends couldn't make it, so I went solo. It felt like dining out with fun girls. Not awkward, just nice.",
    name: "Noor",
    detail: "solo",
  },
];

export const girlsOnlyTastingsMoodEn: Partial<ExperienceMoodContent> = {
  tagline: "Girls-only wine & bites on Sunday afternoon. No hassle.",
  description:
    "A Sunday afternoon of wine and bites with your crew at one table. The restaurant selects four wines and pairs them with bites. Everything around the table sorted. No wine exam, just context and room to enjoy at your pace — plan for the whole afternoon. And sometimes? The fun keeps going: more wine, drinks, or dinner out together.",
  experienceFlow: girlsOnlyTastingFlowEn,
  guestQuotes: girlsOnlyTastingQuotesEn,
  whatToExpect: [
    {
      title: "Wine and bites sorted",
      description:
        "The restaurant selects four wines and pairs them with bites. We handle everything around the table. You just show up.",
    },
    {
      title: "Your own table",
      description:
        "Book for your group and sit together at your own table. Two, four, or more: you decide who joins.",
    },
    {
      title: "One restaurant, one Sunday afternoon",
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
        "Plan for the whole afternoon. No tight schedule — and sometimes the group keeps the vibe going with more wine or dinner out.",
    },
  ],
  socialParagraphs: [
    "Book a table for your group and enjoy a Sunday afternoon out with your girls. You reserve, we handle wine, bites, and the table.",
    "Tasting, laughing, catching up. No networking talk, no speed-dating vibe. Just a fun girls-only Sunday afternoon.",
  ],
  faq: [
    {
      question: "Can I book with my friends?",
      answer:
        "Yes. Reserve for your group and you sit together at your own table. Two, four, or more: you decide who joins.",
    },
    {
      question: "How many friends can I bring?",
      answer:
        "Best with your own group: two, four, or more at your own table. Bring your friends along. Coming solo or with one friend? That works too. If you want to join other girls at the table, we'll find you a cozy spot.",
    },
    {
      question: "When are the events?",
      answer:
        "Every Sunday afternoon, usually between 12:00 and 17:00. The exact time is on your table card and in your confirmation email.",
    },
    {
      question: "Can I share dietary needs?",
      answer:
        "Yes. Tell us when you book. The restaurant accommodates where possible.",
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
  socialTitle: "Girls-only wine & bites on Sunday afternoon.",
  socialSubtitle:
    "Your own table with your group, or join others if you don't have a full group.",
  finalCtaHeadline: "Ready for your next Sunday afternoon wine & bites?",
  finalCtaSubheadline:
    "Four wines, paired bites, and good company with your girls. No date polls, no hassle.",
  bookingSeatingOwn: "With my friends, own table",
  bookingSeatingOwnHint: "Your table, your crew. Wine, bites, no hassle.",
  bookingSeatingJoin: "I'll join others at the table",
  bookingSeatingJoinHint:
    "Solo or with a friend. MyTable finds your spot at the table.",
  bookingTiers: {
    legend: "How are you coming?",
    perPerson: "€{price} p.p.",
    bestValue: "Best value",
    mostChosen: "Most chosen",
    seatOne: "1 spot",
    seatOther: "{count} spots",
    soloTitle: "I'm coming solo",
    duoTitle: "Together",
    groupTitle: "Friends table",
    soloCta: "Reserve my spot",
    duoCta: "Reserve our spots",
    groupCta: "Reserve our table",
  },
  bookingTrustBullets: [
    "Pay in full when you book",
    "Free date exchange up to 48 hours before",
    "Dietary needs welcome",
    "With friends or solo",
  ],
  practicalValues: {
    solo: "No group? Join solo or bring a friend",
    groupSize: "Small tables, usually 8 to 14 women per Sunday afternoon",
  },
};

export const girlsOnlyWineTastingCardTextEn =
  "Your girls, four wines, one table. You reserve, we do the rest.";

export const girlsOnlyWineTastingTaglineEn =
  "Girls-only wine & bites on Sunday afternoon. No hassle.";
