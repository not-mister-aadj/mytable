import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const chefsSpecialLpEn: FormatLpLabels = {
  meta: {
    title: "Chef's Table · MyTable",
    description:
      "Sunday evening family style: multiple starters, mains and dessert, with new people at the table. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Chef's Table · family style, Sunday evening",
  headline: "The whole menu. One table. New people.",
  line: "Chef's Table is a Sunday evening family style: multiple starters, mains and dessert, so you taste the best of the restaurant with your table.",
  heroBenefits: [
    { bold: "Family style menu", text: ", starters, mains and dessert" },
    { bold: "One table, new people", text: ", no dating agenda" },
    { bold: "Girls only or mixed", text: ", you choose" },
  ],
  cta: "Join the waitlist",
  ctaHint: "Free. No spam.",
  secondaryCta: "What you get",
  how: {
    eyebrow: "How it works",
    title: "From waitlist to a full table",
    body: "Join the waitlist, and as soon as a Chef's Table forms that fits you, you'll hear from us.",
    steps: [
      {
        title: "Join the waitlist",
        body: "Tell us what you're looking for. Takes a minute, costs nothing.",
      },
      {
        title: "We form a table",
        body: "Once enough people are on board, we plan a restaurant and date.",
      },
      {
        title: "Pull up a chair",
        body: "You'll get an email once your Chef's Table is ready.",
      },
    ],
  },
  included: {
    eyebrow: "Included",
    title: "What you get",
    items: [
      {
        title: "Family style menu",
        body: "Multiple starters, mains and dessert, shared at the table.",
      },
      {
        title: "A chosen restaurant",
        body: "We arrange the venue, you don't need to book anything.",
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
    note: "Drinks you pay for yourself on location.",
  },
  proof: {
    eyebrow: "From the table",
    title: "Sunday evening, full plate, new company",
    body: "Real moments from earlier Chef's Tables.",
    cta: "Join the waitlist",
  },
  pricing: {
    eyebrow: "Price",
    title: "What a Chef's Table costs",
    body: "The price depends on the restaurant and menu. You'll see the exact amount once you're invited, and you only pay then.",
    price: "Priced per evening",
    priceHint: "depends on restaurant and menu",
    justification:
      "You're not paying for separate dishes. You're paying for an evening already put together, at a table with people who came for it too.",
  },
  faq: {
    eyebrow: "Questions",
    title: "Still on the fence?",
    items: [
      {
        question: "Can I flag things I don't eat?",
        answer: "Yes, allergies and preferences you share once you're invited.",
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
    title: "Ready to pull up a chair?",
    body: "The whole menu. One table. You're in.",
    cta: "Join the waitlist",
  },
  waitlist: {
    eyebrow: "Waitlist",
    title: "Join the waitlist",
    body: "We'll let you know as soon as a Chef's Table forms that fits you.",
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
    questionsBody: "Helps us find the right table for you. Totally optional.",
    skip: "Skip",
    back: "Back",
    continueCta: "Continue",
    progress: "Question {n} of {total}",
    why: {
      title: "Why a Chef's Table?",
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
    successBody: "As soon as a Chef's Table forms that fits you, you'll hear from us.",
    successNext:
      "In the meantime: join the WhatsApp group for discount codes and updates.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Mixed WhatsApp",
    close: "Close",
    dialogAria: "Join the waitlist",
  },
};
