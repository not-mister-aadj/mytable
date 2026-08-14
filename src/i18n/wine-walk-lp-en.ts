import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const wineWalkLpEn: FormatLpLabels = {
  meta: {
    title: "Wine Walk · MyTable",
    description:
      "Discover the city by trying several venues, each with wine and food. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Wine walk · multiple venues, one evening",
  headline: "One evening. Several places. No planning hassle.",
  line: "Wine Walk lets you discover the city by trying several venues, each with wine and food. We map out the route for you.",
  cta: "Join the waitlist",
  ctaHint: "Free. No spam.",
  secondaryCta: "What you get",
  how: {
    eyebrow: "How it works",
    title: "From waitlist to first glass on the way",
    body: "Join the waitlist, and as soon as we have a wine walk that fits you, you'll hear from us.",
    steps: [
      {
        title: "Join the waitlist",
        body: "Tell us what you're into, so we only invite you to what actually fits. No spam.",
      },
      {
        title: "We invite you",
        body: "As soon as we have a wine walk that matches what you're looking for, you'll hear from us.",
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
        body: "A manageable group, not a big mass tour.",
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
    body: "Real moments from MyTable evenings.",
    cta: "Join the waitlist",
  },
  faq: {
    eyebrow: "Questions",
    title: "Still on the fence?",
    items: [
      {
        question: "What can I expect from an evening?",
        answer:
          "We walk together to several venues we've picked out. Wine and food at every stop, no searching or planning, we've already mapped the route.",
      },
      {
        question: "How many venues do we visit?",
        answer: "It varies by route. Every stop includes wine and food.",
      },
      {
        question: "Is it a long walk?",
        answer: "No, the venues are close together. Comfortable shoes are enough.",
      },
      {
        question: "What does it cost?",
        answer:
          "You'll hear the price once you're invited to a wine walk. Joining the waitlist is free and comes with zero commitment.",
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
    body: "We'll let you know as soon as a wine walk forms in your city.",
    nameLabel: "Name",
    namePlaceholder: "First name",
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    cityLabel: "In the following cities",
    cityOther: "Other city",
    cityOtherPlaceholder: "Which city?",
    formatLabel: "Interested in the following formats",
    submit: "Join the waitlist",
    submitting: "Sending…",
    privacyNote: "No spam. Unsubscribe anytime.",
    error: "Something went wrong. Please try again.",
    questionsTitle: "A few quick questions",
    questionsBody: "Helps us find the right wine walk for you. Totally optional.",
    skip: "Skip",
    back: "Back",
    continueCta: "Continue",
    progress: "Question {n} of {total}",
    why: {
      title: "Why are you joining the waitlist?",
      options: [
        { id: "discover_wines", label: "Discover wine" },
        { id: "discover_flavours", label: "New flavors" },
        { id: "discover_places", label: "New places" },
        { id: "no_organise", label: "Not organizing it myself" },
        { id: "treat", label: "Treating myself" },
        { id: "new_city", label: "New to the city" },
        { id: "just_fun", label: "Just a nice Sunday, no particular reason" },
        { id: "other", label: "Something else" },
      ],
      otherPlaceholder: "Tell us...",
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
    gender: {
      title: "Gender",
      options: [
        { id: "female", label: "Woman" },
        { id: "male", label: "Man" },
        { id: "other", label: "Other" },
        { id: "unspecified", label: "Prefer not to say" },
      ],
    },
    ageRange: {
      title: "Age",
      options: [
        { id: "18_24", label: "18-24" },
        { id: "25_34", label: "25-34" },
        { id: "35_44", label: "35-44" },
        { id: "45_plus", label: "45+" },
      ],
    },
    vibe: {
      title: "What makes an evening for you?",
      options: [
        { id: "people", label: "The people at the table" },
        { id: "experience", label: "The food and wine" },
        { id: "both", label: "Both equally" },
      ],
    },
    budget: {
      title: "What matters most to you on price?",
      options: [
        { id: "budget", label: "I keep it affordable" },
        { id: "premium", label: "Best experience, budget is secondary" },
        { id: "flexible", label: "Somewhere in between" },
      ],
    },
    experience: {
      title: "How would you describe yourself?",
      options: [
        {
          id: "curious",
          label: "I like trying new things, no need to be an expert",
        },
        {
          id: "experienced",
          label: "I already know a lot, I'm after the better stuff",
        },
      ],
    },
    successTitle: "You're on the list",
    successBody: "As soon as a wine walk forms in your city, you'll hear from us.",
    successNext:
      "Prefer updates over WhatsApp instead of email? Join the group, we post our announcements there too.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Mixed WhatsApp",
    close: "Close",
    dialogAria: "Join the waitlist",
  },
};
