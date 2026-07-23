import { listTopNlCityNames } from "@/data/nl-top-cities";
import type { WaitlistPageLabels } from "./waitlist-page.types";

export const waitlistPageEn: WaitlistPageLabels = {
  meta: {
    title: "Your table · MyTable",
    description:
      "Tell us what you're looking for at the table. MyTable uses your answers to decide which experiences to open first.",
  },
  brand: "MyTable",
  progressLabel: "{current} / {total}",
  back: "Back",
  next: "Continue",
  start: "Begin",
  trustLine: "Short · no obligation · no spam",
  multiHint: "Multiple answers welcome",
  intro: {
    eyebrow: "MyTable",
    title: "Tell us what you're looking for",
    subtitle:
      "We're shaping MyTable further. These short questions help us decide which tables to open first.",
  },
  steps: {
    interests: {
      title: "Which experience appeals to you?",
      subtitle: "Choose what fits. Your first choice weighs most.",
      required: "Choose at least one option",
      options: [
        {
          id: "wine_tasting",
          title: "Wine tasting",
          description:
            "Sunday afternoon: four wines and bite pairings, chosen by the wine bar. A fun afternoon at your table.",
        },
        {
          id: "chefs_special",
          title: "Chef's Table",
          description:
            "Sunday evening: multiple starters, mains and dessert family style, so you taste the best of the restaurant.",
        },
        {
          id: "wine_walk",
          title: "Wine Walk",
          description:
            "Sunday afternoon: discover the city by trying several spots, each with wine and food.",
        },
        {
          id: "aperitivo",
          title: "Golden Hour Aperitivo",
          description: "Sunday morning: bubbles, bites and soft light.",
        },
      ],
    },
    why: {
      title: "What draws you in?",
      subtitle: "Choose what comes closest.",
      required: "Choose at least one option",
      options: [
        { id: "discover_wines", title: "Discover new wines" },
        { id: "discover_flavours", title: "Discover new flavours" },
        { id: "discover_places", title: "Discover new places" },
        { id: "no_organise", title: "No planning hassle" },
        { id: "treat", title: "Birthday or gift" },
        { id: "new_city", title: "New in town" },
      ],
    },
    company: {
      title: "How would you like to come?",
      subtitle: "Bringing people, or hoping to meet new faces?",
      required: "Choose at least one option",
      options: [
        { id: "meet_new", title: "Meet new people" },
        { id: "bring_friends", title: "With friends" },
        { id: "bring_partner", title: "With a partner" },
        { id: "solo", title: "Solo" },
      ],
    },
    tableType: {
      title: "Which table type?",
      subtitle: "Girls only or mixed.",
      required: "Choose at least one option",
      options: [
        { id: "girls_only", title: "Girls only" },
        { id: "mixed", title: "Mixed table" },
      ],
    },
    where: {
      title: "Where are you looking for a table?",
      subtitle: "Choose your cities. Optionally stay flexible in the region.",
      citiesHint: "Select one or more cities",
      citiesRequired: "Choose at least one city",
      cities: listTopNlCityNames(),
      flexibleLabel: "Flexible in the region",
      flexibleHint: "Open to a nearby city as well.",
    },
    contact: {
      title: "Almost done",
      subtitle:
        "Leave your name and email. We'll email you when your chosen experiences go live.",
      tease: "Your choices",
      choiceHint: "We'll keep you posted as soon as these experiences are online.",
      nameLabel: "First name",
      namePlaceholder: "First name",
      emailLabel: "Email",
      emailPlaceholder: "name@email.com",
      cta: "Keep me posted",
      submitting: "Saving…",
    },
  },
  outcomes: {
    wine_tasting: {
      id: "wine_tasting",
      eyebrow: "Your choice",
      title: "Wine tasting",
      body: "Four wines and bite pairings, chosen by the wine bar. You enjoy a fun afternoon with your table.",
      image: "/girls-only/table-wine-laughing.jpg",
      imageAlt: "Women laughing at the table during a wine tasting",
    },
    chefs_special: {
      id: "chefs_special",
      eyebrow: "Your choice",
      title: "Chef's Table",
      body: "Multiple starters, mains and dessert arrive family style. You taste the best of the restaurant, shared with your table. Less deciding, more discovering.",
      image: "/girls-only/table-group.jpg",
      imageAlt: "Guests at a table during a dinner evening",
    },
    wine_walk: {
      id: "wine_walk",
      eyebrow: "Your choice",
      title: "Wine Walk",
      body: "Discover the city by trying several venues, each with wine and food. Walk, taste, and get to know new places.",
      image: "/girls-only/crowd-evening.jpg",
      imageAlt: "A group of women out for an evening together",
    },
    aperitivo: {
      id: "aperitivo",
      eyebrow: "Your choice",
      title: "Golden Hour Aperitivo",
      body: "Start light. Bubbles, bites and soft light in the morning. Easy, clear and worth repeating.",
      image: "/girls-only/wine-moment.jpg",
      imageAlt: "Woman enjoying a glass of wine in warm light",
    },
  },
  success: {
    eyebrow: "Thank you",
    waitlistNote:
      "We'll email you when your chosen experiences go live.",
    whatsappTitle: "Want updates even faster?",
    whatsappBody:
      "Join the WhatsApp group for each experience you chose. Only updates when seats open, no spam.",
    whatsappCta: "Join WhatsApp",
    agendaLabel: "View the calendar",
  },
  error: "Something went wrong. Please try again later.",
  databaseUnavailable:
    "We can't save your signup right now. Please try again in a moment.",
  breadcrumbHome: "Home",
  breadcrumbWaitlist: "Your table",
};
