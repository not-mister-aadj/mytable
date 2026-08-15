import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const chefsSpecialLpEn: FormatLpLabels = {
  meta: {
    title: "Chef's Table · MyTable",
    description:
      "Sunday evening with the best dishes on the menu, pre-selected: starters, mains and dessert. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Chef's Table · best dishes, pre-selected",
  headline: "The best dishes. One table. Nothing to plan.",
  line: "Chef's Table is a Sunday evening with the best dishes on the menu, pre-selected: starters, mains and dessert.",
  cta: "Join the waitlist",
  ctaHint: "Free. No spam.",
  secondaryCta: "What you get",
  how: {
    eyebrow: "How it works",
    title: "From waitlist to a full table",
    body: "Join the waitlist, and as soon as we have a Chef's Table that fits you, you'll hear from us.",
    steps: [
      {
        title: "Join the waitlist",
        body: "Tell us what you're into, so we only invite you to what actually fits. No spam.",
      },
      {
        title: "We invite you",
        body: "As soon as we have a Chef's Table that matches what you're looking for, you'll hear from us.",
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
        title: "The best dishes",
        body: "Pre-selected from the menu: starters, mains and dessert.",
      },
      {
        title: "A chosen restaurant",
        body: "We arrange the venue, you don't need to book anything.",
      },
      {
        title: "One table",
        body: "Everyone at the same table, no separate tables.",
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
          "The best dishes on the menu, pre-selected: starters, mains, and dessert. No decision fatigue, you taste the best of the restaurant in one evening.",
      },
      {
        question: "Can I flag things I don't eat?",
        answer: "Yes, allergies and preferences you share once you're invited.",
      },
      {
        question: "What does it cost?",
        answer:
          "The price depends on the restaurant and menu, and you'll hear it once you're invited. Joining the waitlist is free and comes with zero commitment.",
      },
      {
        question: "What if I can't make the planned date?",
        answer: "Let us know, and we'll find you a spot in the next round.",
      },
    ],
  },
  final: {
    title: "Ready to pull up a chair?",
    body: "The best dishes. One table. You're in.",
    cta: "Join the waitlist",
  },
  waitlist: {
    eyebrow: "Waitlist",
    title: "Join the waitlist",
    body: "We'll let you know as soon as a Chef's Table forms in your city.",
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
    questionsBody: "Helps us find the right table for you. Totally optional.",
    skip: "Skip",
    back: "Back",
    continueCta: "Continue",
    progress: "Question {n} of {total}",
    language: {
      title: "Which language do you want your events in?",
      options: [
        { id: "english", label: "English-speaking events" },
        { id: "dutch", label: "Dutch-speaking events" },
        { id: "both", label: "Both are fine" },
      ],
    },
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
      title: "Which table?",
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
    successBody: "As soon as a Chef's Table forms in your city, you'll hear from us.",
    successNext:
      "Prefer updates over WhatsApp instead of email? Join the group, we post our announcements there too.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Mixed WhatsApp",
    close: "Close",
    dialogAria: "Join the waitlist",
  },
};
