import { listTopNlCityNames } from "@/data/nl-top-cities";
import type { GirlsOnlyPageLabels } from "./girls-only-page.types";

export const girlsOnlyPageEn: GirlsOnlyPageLabels = {
  socialPromise:
    "Meet the people you’ll make plans with. We arrange the table.",
  meta: {
    title: "MyTable · Tell us what you’re looking for | Sunday Table or culinary experiences",
    description:
      "Looking to meet people on a Sunday afternoon, or ready for Wine Walks and dinners? Choose your path - we’ll show what fits.",
  },
  hero: {
    eyebrow: "MyTable",
    headlineLine1: "Tell us what",
    headlineLine2: "you’re looking for.",
    subtitle:
      "Meet new people on Sunday afternoon - or jump straight into culinary walks and tables. You choose; we guide you well.",
    painHeadline: "One choice. No agenda overload.",
    microcopy:
      "Not dating. Not networking. Just good taste and good company.",
    trustLine:
      "Free · About 2 min · No obligation",
    imageAlt:
      "People enjoying wine together at a lively MyTable table",
    scarcityTemplate: "{count} spots left for {city} on {date}",
    featuredInHeroLabel: "Next Sunday Table",
  },
  intent: {
    brand: "MyTable",
    question: "What are you looking for?",
    subtitle:
      "Choose your path. We’ll remember it - and only show what matters.",
    meet: {
      id: "meet",
      title: "Meet new people",
      description:
        "Sunday afternoon Sunday Table - solo welcome, real introductions, then make plans.",
      detailEyebrow: "Sunday Table · Community",
      detailTitle: "Join the table",
      detailBody:
        "Monthly Sunday afternoons with new faces. Membership means early access to Sunday Tables and 10% off every culinary experience.",
      perks: [
        "Sunday Tables to meet new people",
        "10% off Wine Walks, tastings and dinners",
        "First to hear when seats open",
        "Solo welcome - we arrange table and introductions",
      ],
      primaryCta: "Join community + 10% waitlist",
      secondaryCta: "How Sunday Table works",
    },
    culinary: {
      id: "culinary",
      title: "Culinary experiences",
      description:
        "Wine Walks, tastings and dinners - book with friends, a partner or a group.",
      detailEyebrow: "Experiences · Agenda",
      detailTitle: "All culinary tables",
      detailBody:
        "No community funnel needed. Straight to the agenda: walks, tastings and dinners in your city.",
      perks: [
        "Wine Walks through the city",
        "Tastings and chef tables",
        "Book for two, a group or solo",
        "Clear dates, cities and prices",
      ],
      primaryCta: "Browse culinary experiences",
      secondaryCta: "Rather meet people first?",
    },
    changePath: "Choose differently",
  },
  cta: {
    viewAllSundays: "Reserve your seat",
    choosePath: "Tell us what you want",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        question: "What’s the difference between Sunday Table and culinary experiences?",
        answer:
          "Sunday Table is our Sunday-afternoon community: meet new people. Culinary experiences (Wine Walks, tastings, dinners) live on the agenda - book with friends, someone you met, or solo. On the homepage you choose which path fits first.",
      },
      {
        question: "What does membership / the 10% discount mean?",
        answer:
          "If you join via the community path, you’re listed for Sunday Tables and early access. Membership includes 10% off culinary experiences. The discount appears once membership is active; until then we keep you on the waitlist.",
      },
      {
        question: "What is a Sunday Table?",
        answer:
          "Every first Sunday. New people. Then culinary experiences.",
      },
      {
        question: "Can I come alone?",
        answer:
          "Yes - that’s the point of Sunday Table. Many guests arrive solo. We arrange the table, host and introductions. Later you book premium experiences with people you met here, or with your own friends.",
      },
      {
        question: "Is this dating or networking?",
        answer:
          "No. MyTable is hospitality: good taste, good company and shared experiences. No speed dating and no business networking night.",
      },
      {
        question: "What’s the difference between girls only and mixed?",
        answer:
          "It’s a table preference. Girls only is women only. Mixed welcomes everyone. The concept - table, host, wine - stays the same.",
      },
      {
        question: "How do premium experiences fit in?",
        answer:
          "After Sunday Table you plan a Wine Walk, tasting or dinner together. Book with friends, someone you met at the table, or individually. Groups are welcome and make tables fill faster.",
      },
      {
        question: "Can I book with friends or a group?",
        answer:
          "Absolutely. On premium experiences choose the two of you, a group, or a full table. Tickets in one booking sit together.",
      },
      {
        question: "When are Sunday Tables?",
        answer:
          "Around the first Sunday of the month, usually in the afternoon. Exact dates are on the agenda and your table card.",
      },
      {
        question: "Where does it take place?",
        answer:
          "At a partner restaurant. The city is on the table card. After booking we email the venue, time and practical details.",
      },
      {
        question: "Do I need to know a lot about wine?",
        answer:
          "No. Curiosity is enough. The host shares context without turning it into a lecture.",
      },
      {
        question: "Can I share dietary needs?",
        answer:
          "Yes. Tell us when you book. The chef adjusts where possible.",
      },
      {
        question: "Can I cancel or exchange?",
        answer:
          "Cancellations aren’t available. You can exchange free of charge to another date up to 48 hours before start. Everything is paid upfront.",
      },
    ],
  },
  headerNav: {
    tables: "Sunday Tables",
    howItWorks: "How it works",
    priorityList: "Waitlist",
    testimonials: "What guests say",
    faq: "FAQ",
    founder: "Our story",
  },
  howItWorks: {
    eyebrow: "Two paths, one MyTable",
    title: "Choose first, book later",
    subtitle:
      "Community on Sunday, or straight to the culinary agenda. We never sell you the wrong thing.",
    highlights: [
      "Path 1: Sunday Table → new people → membership with 10% off",
      "Path 2: Wine Walks, tastings and dinners on the agenda",
      "You choose what you’re looking for in one click",
      "We only show what fits after that",
    ],
    cta: "Choose your path",
  },
  benefits: {
    title: "Why guests book",
    subtitle:
      "A clear table. A good host. And plans that stick.",
    items: [
      {
        title: "Come solo - nobody sits alone",
        description:
          "Sunday Table is built to meet new people. We arrange the table, host and introductions.",
      },
      {
        title: "Then continue together",
        description:
          "Invite someone you met at the table, or bring your own friends to a Wine Walk, tasting or dinner.",
      },
      {
        title: "All-in for €49",
        description:
          "Wine, bites and host included. No surprises. Free exchange until 48 hours before.",
      },
      {
        title: "Not dating. Not networking.",
        description:
          "Hospitality with good taste and good company. Spots are limited - book early.",
      },
    ],
  },
  events: {
    title: "Choose your Sunday Table",
    subtitle:
      "One moment per city. Pick your date, check availability and plan your table.",
    empty:
      "New Sunday Tables are added regularly. Check back soon or join the waitlist.",
    viewAll: "View all",
  },
  sundayTable: {
    eyebrow: "Sunday Table",
    title: "Meet the people you’ll make plans with.",
    body: "Join a welcoming table every first Sunday of the month. Come solo, meet new people and discover who you want to share your next experience with.",
  },
  premium: {
    eyebrow: "Next: culinary experiences",
    title: "Bring your table together again.",
    body: "After Sunday Table, book a Wine Walk, tasting or dinner - with people you met here, or with your own group.",
    cta: "Browse culinary experiences",
  },
  nextTable: {
    eyebrow: "Next step",
    title: "Who would you share the next table with?",
    body: "Met someone you’d happily make plans with again? Choose a Wine Walk, tasting or dinner together.",
    cta: "Browse culinary experiences",
    shareWhatsapp: "Share on WhatsApp",
    copyLink: "Copy link",
    copied: "Copied",
  },
  presaleSignup: {
    title: "Join the waitlist",
    subtitle:
      "Sunday Tables and premium experiences sell out fast. Sign up and hear first when spots open in your city.",
    nameLabel: "Name",
    namePlaceholder: "Your first name",
    citiesLabel: "Where do you want a table?",
    citiesHint: "Choose one or more cities",
    citiesRequired: "Choose at least one city",
    cities: listTopNlCityNames(),
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    cta: "Keep me posted",
    success: "You’re on the list. We’ll email you when spots open.",
    error: "Signup failed. Please try again later.",
  },
  testimonials: {
    eyebrow: "What guests say",
    title: "From new faces to real plans",
  },
  founderStory: {
    eyebrow: "The story behind MyTable",
    title: "Hi, I’m Elif",
    paragraphs: [
      "I’ve always been the one connecting people. Organising gatherings, bringing groups together, making sure everyone feels at ease.",
      "MyTable is where good taste and good company meet. Sunday Table helps you meet new people. Then you book the experiences that matter - together.",
      "Not a dating platform, not a networking night. Just tasting, laughing and making plans around the table.",
      "On the right is Siraadj, my boyfriend. He handles the tech and the camera work.",
    ],
    signOff: "Elif, host at MyTable",
    imageAlt: "Elif and Siraadj at the table during a lively evening",
  },
  finalCta: {
    title: "Haven’t chosen yet?",
    subtitle:
      "Tell us what you’re looking for - Sunday community, or culinary experiences. We’ll guide you well.",
    button: "Tell us what you want",
  },
  status: {
    available: "Available",
    almostFull: "Almost full",
    soldOut: "Sold out",
    closed: "Sold out",
    new: "New",
  },
  femaleOnlyBadge: "Girls only",
  reserveCta: "Reserve",
  viewTableCta: "Plan your table",
  joinIndividuallyCta: "Join individually",
  perPersonFrom: "€{price} per person",
};
