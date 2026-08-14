import type { FormatLpLabels } from "@/i18n/format-lp.types";

export const wineTastingLpEn: FormatLpLabels = {
  meta: {
    title: "Wine Tasting · MyTable",
    description:
      "A selection of wines with bite pairings, chosen by the wine bar. A fun afternoon at one table. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Wine tasting · put together by the wine bar",
  headline: "Good wine. One table. Nothing to plan.",
  line: "Wine Tasting gives you a selection of wines with bite pairings, chosen by the wine bar. A fun afternoon at one table, without having to figure anything out yourself.",
  cta: "Join the waitlist",
  ctaHint: "Free. No spam.",
  secondaryCta: "What you get",
  how: {
    eyebrow: "How it works",
    title: "From waitlist to glass in hand",
    body: "Join the waitlist, and as soon as we have a tasting that fits you, you'll hear from us.",
    steps: [
      {
        title: "Join the waitlist",
        body: "Tell us what you're into, so we only invite you to what actually fits. No spam.",
      },
      {
        title: "We invite you",
        body: "As soon as we have a tasting that matches what you're looking for, you'll hear from us.",
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
        title: "A selection of wines",
        body: "Chosen by the wine bar, light to full-bodied.",
      },
      {
        title: "Bite pairings",
        body: "A bite with every wine that makes it click.",
      },
      {
        title: "One table",
        body: "A manageable group, not a big mass tasting.",
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
          "A few wines, selected by the wine bar, each with a matching bite. No decision fatigue, we already worked it out for you. You taste, talk, and discover what you like.",
      },
      {
        question: "Do I need to know a lot about wine?",
        answer: "No. The wine bar chooses and explains. You just taste.",
      },
      {
        question: "What does it cost?",
        answer:
          "You'll hear the price once you're invited to a tasting. Joining the waitlist is free and comes with zero commitment.",
      },
      {
        question: "What if I can't make the planned date?",
        answer: "Let us know, and we'll find you a spot in the next round.",
      },
    ],
  },
  final: {
    title: "Ready to taste?",
    body: "Good wine. One table. You're in.",
    cta: "Join the waitlist",
  },
  waitlist: {
    eyebrow: "Waitlist",
    title: "Join the waitlist",
    body: "We'll let you know as soon as a tasting forms in your city.",
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
    questionsBody: "Helps us find the right tasting for you. Totally optional.",
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
    successBody: "As soon as a tasting forms in your city, you'll hear from us.",
    successNext:
      "Prefer updates over WhatsApp instead of email? Join the group, we post our announcements there too.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Mixed WhatsApp",
    close: "Close",
    dialogAria: "Join the waitlist",
  },
};
