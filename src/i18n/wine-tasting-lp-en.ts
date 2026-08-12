import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const wineTastingLpEn: FormatLpLabels = {
  meta: {
    title: "Wine Tasting · MyTable",
    description:
      "Four wines and bite pairings, chosen by the wine bar. A fun afternoon at one table with new people. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Wine tasting · put together by the wine bar",
  headline: "Four wines. One table. New people.",
  line: "Wine Tasting gives you four wines with bite pairings, chosen by the wine bar. A fun afternoon at one table, without having to figure anything out yourself.",
  heroBenefits: [
    { bold: "Four wines with pairings", text: ", chosen by the wine bar" },
    { bold: "One table, new people", text: ", no dating agenda" },
    { bold: "Girls only or mixed", text: ", you choose" },
  ],
  cta: "Join the waitlist",
  ctaHint: "Free. No spam.",
  secondaryCta: "What you get",
  how: {
    eyebrow: "How it works",
    title: "From waitlist to glass in hand",
    body: "Join the waitlist, and as soon as a tasting forms that fits you, you'll hear from us.",
    steps: [
      {
        title: "Join the waitlist",
        body: "Tell us what you're looking for. Takes a minute, costs nothing.",
      },
      {
        title: "We form a table",
        body: "Once enough people are on board, we plan a date.",
      },
      {
        title: "Taste with us",
        body: "You'll get an email once your tasting is ready.",
      },
    ],
  },
  included: {
    eyebrow: "Included",
    title: "What you get",
    items: [
      {
        title: "Four wines",
        body: "Chosen by the wine bar, light to full-bodied.",
      },
      {
        title: "Bite pairings",
        body: "A bite with every wine that makes it click.",
      },
      {
        title: "One table",
        body: "Maximum ten seats, with new people.",
      },
      {
        title: "Girls only or mixed",
        body: "You choose which table fits you.",
      },
    ],
    note: "Drinks outside the tasting you pay for yourself on location.",
  },
  proof: {
    eyebrow: "From the table",
    title: "Wine as the excuse, conversation as the bonus",
    body: "Real moments from earlier tastings.",
    cta: "Join the waitlist",
  },
  pricing: {
    eyebrow: "Price",
    title: "What a tasting costs",
    body: "You only pay once you're invited to a real tasting.",
    price: "€49",
    priceHint: "per person, includes four wines and bites",
    justification:
      "You're not paying for loose glasses of wine. You're paying for an evening already put together for you, at a table with people who came for it too.",
  },
  faq: {
    eyebrow: "Questions",
    title: "Still on the fence?",
    items: [
      {
        question: "Do I need to know a lot about wine?",
        answer: "No. The wine bar chooses and explains. You just taste.",
      },
      {
        question: "Can I bring someone?",
        answer: "Yes, you can bring a +1.",
      },
      {
        question: "What if I can't make the planned date?",
        answer: "Let us know, and we'll find you a spot in the next round.",
      },
    ],
  },
  final: {
    title: "Ready to taste?",
    body: "Four wines. One table. You're in.",
    cta: "Join the waitlist",
  },
  waitlist: {
    eyebrow: "Waitlist",
    title: "Join the waitlist",
    body: "We'll let you know as soon as a tasting forms that fits you.",
    nameLabel: "Name",
    namePlaceholder: "First name",
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    cityLabel: "City",
    cityOther: "Other city",
    cityOtherPlaceholder: "Which city?",
    submit: "Join the waitlist",
    submitting: "Sending…",
    privacyNote: "No spam. Unsubscribe anytime.",
    error: "Something went wrong. Please try again.",
    questionsTitle: "3 quick questions",
    questionsBody: "Helps us find the right tasting for you. Totally optional.",
    skip: "Skip",
    back: "Back",
    continueCta: "Continue",
    progress: "Question {n} of {total}",
    why: {
      title: "Why a tasting?",
      options: [
        { id: "discover_wines", label: "Discover wine" },
        { id: "discover_flavours", label: "New flavors" },
        { id: "discover_places", label: "New places" },
        { id: "no_organise", label: "Not organizing it myself" },
        { id: "treat", label: "Treating myself" },
        { id: "new_city", label: "New to the city" },
      ],
    },
    company: {
      title: "Who do you like to come with?",
      options: [
        { id: "meet_new", label: "Meet new people" },
        { id: "bring_friends", label: "With friends" },
        { id: "bring_partner", label: "With a partner" },
        { id: "solo", label: "Solo" },
      ],
    },
    tableType: {
      title: "Which table?",
      options: [
        { id: "girls_only", label: "Girls only" },
        { id: "mixed", label: "Mixed" },
        { id: "no_preference", label: "No preference" },
      ],
    },
    successTitle: "You're on the list",
    successBody: "As soon as a tasting forms that fits you, you'll hear from us.",
    successNext:
      "In the meantime: join the WhatsApp group for discount codes and updates.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Mixed WhatsApp",
    close: "Close",
    dialogAria: "Join the waitlist",
  },
};
