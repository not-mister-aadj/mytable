import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
  ExperienceMoodContent,
} from "./types";

export const girlsOnlyTastingFlowEn: ExperienceFlowStep[] = [
  {
    title: "Book online",
    description:
      "Pick your spot, pay upfront, and get instant confirmation by email. No waitlist, no hassle.",
  },
  {
    title: "Share your preferences",
    description:
      "Dietary needs or allergies? Tell us when you book. You can still exchange for free up to 48 hours before.",
  },
  {
    title: "Join us on Sunday",
    description:
      "The host welcomes you at the table. Four wines and paired bites come to you: solo, with a friend, or at your own friends' table.",
  },
];

export const girlsOnlyTastingQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "I came solo and was genuinely nervous. Within ten minutes I was chatting like I'd brought friends along.",
    name: "Lisa",
    detail: "solo, Rotterdam",
  },
  {
    quote:
      "Everything was already paid. No bill drama, no menu arguments. Just enjoying the afternoon with my girls.",
    name: "Sanne",
    detail: "group of 4",
  },
  {
    quote:
      "Booked with my friend. Sharing the table felt right immediately. Why didn't we do this sooner?",
    name: "Noor",
    detail: "duo",
  },
  {
    quote:
      "My friends couldn't make it, so I went solo. It felt like dining out with fun girls. Not awkward, just nice.",
    name: "Emma",
    detail: "solo",
  },
];

export const girlsOnlyTastingsMoodEn: Partial<ExperienceMoodContent> = {
  tagline:
    "Four wines and bite pairings, a fun afternoon with your girls at the table.",
  description:
    "A Sunday afternoon of four wines and bite pairings, chosen by the wine bar. You enjoy one table together: solo, with a friend, or with your group. No wine exam, just a fun afternoon. Plan for the whole afternoon. And sometimes? The fun keeps going: more wine, drinks, or dinner out.",
  experienceFlow: girlsOnlyTastingFlowEn,
  guestQuotes: girlsOnlyTastingQuotesEn,
  whatToExpect: [
    {
      title: "Four wines, chosen by the wine bar",
      description:
        "The wine bar puts the tasting together: four wines with matching bite pairings. You just show up.",
    },
    {
      title: "Your own table or join others",
      description:
        "Three or more friends? Your own table. Solo or as a duo? We'll seat you with other girls.",
    },
    {
      title: "One place, one Sunday afternoon",
      description:
        "No stops across the city. Everything happens at one carefully chosen wine bar.",
    },
    {
      title: "Solo? That works too",
      description:
        "No full group? Book solo or bring a friend and join other girls. MyTable finds your spot.",
    },
    {
      title: "Your own pace",
      description:
        "Plan for the whole afternoon. No tight schedule. And sometimes the group keeps the vibe going with more wine or dinner out.",
    },
  ],
  socialParagraphs: [
    "Book a table for your group and enjoy a Sunday afternoon out with your girls. You reserve, we handle wine, bites, and the table.",
    "Tasting, laughing, catching up. No networking talk, no speed-dating vibe. Just a fun girls-only Sunday afternoon.",
  ],
  faq: [
    {
      question: "When are the events?",
      answer:
        "Always on Sunday, in the afternoon. The exact time is on your table card and in your confirmation email.",
    },
    {
      question: "What's included and what does it cost?",
      answer:
        "€49 per person whether you come solo, as a pair or with a group. Per person you get four wines with paired bites, a full Sunday afternoon at the table, and everything sorted upfront. No bill at the table.",
    },
    {
      question: "Can I come solo?",
      answer:
        "Yes, and you won't be the only one. Many girls book solo or with one friend. We'll seat you at a cozy table with other women.",
    },
    {
      question: "Can I cancel or exchange?",
      answer:
        "Cancellations are not available. You can exchange to another date for free up to 48 hours before start. Everything is paid in full when you book.",
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
      question: "How many friends can I bring?",
      answer:
        "With 3 or more you get your own friends' table. Solo or as a duo, you join others. Small tables, usually 8 to 14 women per afternoon.",
    },
  ],
};

export const girlsOnlyExperienceLabelsEn = {
  heroBenefitBullets: [
    "Four wines + paired bites at the table",
    "Girls Only · solo welcome, friends too",
    "Pay upfront · no bill to split at the table",
  ],
  includedEyebrow: "What's included",
  includedTitle: "Everything sorted for your afternoon out",
  includedSubtitle:
    "One restaurant, one table. You reserve, we handle wine, bites, and good company.",
  includedItems: [
    { value: "4", label: "wines" },
    { value: "4", label: "bites" },
    { value: "1", label: "restaurant" },
    { value: "100%", label: "paid upfront" },
  ],
  flowEyebrow: "Good to know",
  flowTitle: "How does it work?",
  guestQuotesEyebrow: "Real stories",
  guestQuotesTitle: "What other girls say",
  midCtaEyebrow: "Get tickets",
  midCtaTitle: "Ready for Sunday wine & bites?",
  midCtaTrustLine:
    "Free exchange up to 48 hours before · Pay in full when you book · Dietary needs welcome",
  venuesTitle: "Where you join the table",
  venuesSubtitle:
    "One carefully chosen partner restaurant per city. Four wines, paired bites, and good company at the table.",
  pillSoloTogether: "Plan your table",
  socialTitle: "Good plans deserve a table.",
  socialSubtitle:
    "Bring your friends, invite someone from Sunday Table, or join individually. We arrange the wine, food and experience.",
  finalCtaHeadline: "Ready for your next Sunday afternoon wine & bites?",
  finalCtaSubheadline:
    "Four wines, paired bites, and good company. No date polls, no hassle.",
  bookingSeatingOwn: "With my friends, own table",
  bookingSeatingOwnHint: "Your table, your crew. Wine, bites, no hassle.",
  bookingSeatingJoin: "I'll join others at the table",
  bookingSeatingJoinHint:
    "Solo or with a friend. MyTable finds your spot at the table.",
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
    seatsJoinOthers: "a place at a shared table",
    seatsOwnTable: "you'll sit together",
    seatingTogetherHint:
      "Minimum 2 tickets. You sit with the people you bring.",
    soloTitle: "Just me",
    duoTitle: "The two of us",
    groupTitle: "Bring a group",
    tableTitle: "Reserve a table",
    soloCta: "Reserve my spot",
    duoCta: "Reserve our spots",
    groupCta: "Reserve our spots",
    tableCta: "Reserve the table",
  },
  bookingTrustBullets: [
    "Pay in full when you book",
    "Free date exchange up to 48 hours before",
    "Dietary needs welcome",
    "With friends, as a pair, or individually",
  ],
  practicalValues: {
    solo: "Joining individually is welcome; groups are encouraged",
    groupSize: "Small tables, usually 8 to 14 women per Sunday afternoon",
  },
};

export const girlsOnlyWineTastingCardTextEn =
  "Your girls, four wines, one table. You reserve, we do the rest.";

export const girlsOnlyWineTastingTaglineEn =
  "Girls-only wine & bites on Sunday afternoon. No hassle.";
