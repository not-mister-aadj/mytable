import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const wineWalkLpEn: FormatLpLabels = {
  meta: {
    title: "Wine Walk · MyTable",
    description:
      "Discover the city by trying several venues, each with wine and food. With new people. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Wine walk · multiple venues, one evening",
  headline: "One evening. Several places. New people.",
  line: "Wine Walk lets you discover the city by trying several venues, each with wine and food. With a group of new people, no planning hassle.",
  heroBenefits: [
    { bold: "Several venues", text: ", each with wine and food" },
    { bold: "One group, new people", text: ", no dating agenda" },
    { bold: "Girls only or mixed", text: ", you choose" },
  ],
  cta: "Join the waitlist",
  ctaHint: "Free. No spam.",
  secondaryCta: "What you get",
  how: {
    eyebrow: "How it works",
    title: "From waitlist to first glass on the way",
    body: "Join the waitlist, and as soon as a wine walk forms that fits you, you'll hear from us.",
    steps: [
      {
        title: "Join the waitlist",
        body: "Tell us what you're looking for. Takes a minute, costs nothing.",
      },
      {
        title: "We form a group",
        body: "Once enough people are on board, we plan a route and date.",
      },
      {
        title: "Walk with us",
        body: "You'll get an email once your wine walk is ready.",
      },
    ],
  },
  included: {
    eyebrow: "Included",
    title: "What you get",
    items: [
      {
        title: "Several venues",
        body: "Each stop with its own wine and food, picked by us.",
      },
      {
        title: "One route through the city",
        body: "Discover places you'd never have found yourself.",
      },
      {
        title: "One group",
        body: "Walk with new people, maximum ten spots.",
      },
      {
        title: "Girls only or mixed",
        body: "You choose which group fits you.",
      },
    ],
    note: "Extra drinks outside the route you pay for yourself on location.",
  },
  proof: {
    eyebrow: "Along the way",
    title: "Discovering the city, with company that sticks",
    body: "Real moments from earlier wine walks.",
    cta: "Join the waitlist",
  },
  pricing: {
    eyebrow: "Price",
    title: "What a wine walk costs",
    body: "You only pay once you're invited to a real wine walk.",
    price: "€60",
    priceHint: "per person, includes wine and food at every stop",
    justification:
      "You're not paying for loose drinks at separate places. You're paying for a route that's already mapped out, with company that chose it too.",
  },
  faq: {
    eyebrow: "Questions",
    title: "Still on the fence?",
    items: [
      {
        question: "How many venues do we visit?",
        answer: "It varies by route. Every stop includes wine and food.",
      },
      {
        question: "Can I bring someone?",
        answer: "Yes, you can bring a +1.",
      },
      {
        question: "Is it a long walk?",
        answer: "No, the venues are close together. Comfortable shoes are enough.",
      },
    ],
  },
  final: {
    title: "Ready to walk?",
    body: "Several places. One evening. You're in.",
    cta: "Join the waitlist",
  },
  waitlist: {
    eyebrow: "Waitlist",
    title: "Join the waitlist",
    body: "We'll let you know as soon as a wine walk forms that fits you.",
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
    questionsBody: "Helps us find the right wine walk for you. Totally optional.",
    skip: "Skip",
    back: "Back",
    continueCta: "Continue",
    progress: "Question {n} of {total}",
    why: {
      title: "Why a wine walk?",
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
      title: "Which group?",
      options: [
        { id: "girls_only", label: "Girls only" },
        { id: "mixed", label: "Mixed" },
        { id: "no_preference", label: "No preference" },
      ],
    },
    successTitle: "You're on the list",
    successBody: "As soon as a wine walk forms that fits you, you'll hear from us.",
    successNext:
      "In the meantime: join the WhatsApp group for discount codes and updates.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Mixed WhatsApp",
    close: "Close",
    dialogAria: "Join the waitlist",
  },
};
