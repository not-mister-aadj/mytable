import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";

export const sundayTableLpEn: SundayTableLpLabels = {
  meta: {
    title: "Sunday Table · New people, new places",
    titleCity: "Sunday Table in {city} · New people, new places",
    description:
      "Meet new people and discover the city's best culinary spots, every first Sunday of the month. Girls only or mixed. Join the waitlist.",
    descriptionCity:
      "Meet new people and discover {city}'s best culinary spots, every first Sunday of the month. Girls only or mixed. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Live in Rotterdam & The Hague. More coming soon.",
  headline: "A social life you don't have to plan",
  headlineCity: "A social life you don't have to plan, in {city}",
  line: "Sunday Table gives you a table of new people every month, at the city's best culinary spots. No dating agenda. Coming solo is normal.",
  lineCity:
    "Sunday Table gives you a table of new people every month, at {city}'s best culinary spots. No dating agenda. Coming solo is normal.",
  cta: "Join the waitlist",
  ctaHint: "Free. No spam.",
  secondaryCta: "What you get",
  how: {
    eyebrow: "How it works",
    title: "For new flavors and new faces",
    body: "Sunday Table is where you meet new people and discover the city's best culinary spots. With your new tablemates you then book wine walks, tastings and dinners.",
    steps: [
      {
        title: "Join the waitlist",
        body: "Tell us what you're into, so we only invite you to what actually fits. No spam.",
      },
      {
        title: "We invite you",
        body: "As soon as we have a table that matches what you're looking for, you'll hear from us.",
      },
      {
        title: "Claim your seat",
        body: "You'll get an email once your table is ready. That's when you pay.",
      },
    ],
  },
  proof: {
    eyebrow: "From the table",
    title: "Came solo. Left with plans.",
    body: "Real moments from MyTable evenings.",
    cta: "Join the waitlist",
  },
  included: {
    eyebrow: "Included",
    title: "What you get",
    items: [
      {
        title: "A table full of new people",
        body: "Every first Sunday at a table with faces you don’t know yet.",
      },
      {
        title: "Your own table or matched",
        body: "Fill the table with your own group, or get matched with new people. You choose.",
      },
      {
        title: "MyTable picks",
        body: "The best cafes, restaurants and wine bars in the city, hand-picked by us.",
      },
    ],
    note: "Drinks and bites you pay for on location. Culinary experiences from the agenda are all-in.",
  },
  cities: {
    eyebrow: "Cities",
    title: "Open now",
    body: "We fill these two first. More cities follow.",
    comingSoon: "Coming soon",
    comingSoonCities: "Utrecht · Amsterdam · Eindhoven · Groningen",
  },
  final: {
    title: "Ready for your first Sunday Table?",
    titleCity: "Ready for Sunday Table in {city}?",
    body: "We'll email you once a table forms in your city.",
    cta: "Join the waitlist",
    earlyNote:
      "We're still small and personal. Your table helps shape how Sunday Table grows from here.",
  },
  faq: {
    eyebrow: "Questions",
    title: "Still on the fence? Here are the answers",
    items: [
      {
        question: "What if I don't click with anyone at the table?",
        answer:
          "Unlikely. But if it doesn't click, let us know within 48 hours of your first Sunday Table and we'll make it right.",
      },
      {
        question: "Do I have to come alone?",
        answer:
          "Nope, most people just come solo. You'll be in good company.",
      },
      {
        question: "What does it cost?",
        answer:
          "You'll hear the price as soon as a table is ready for you. Joining the waitlist is free and comes with zero commitment.",
      },
      {
        question: "Is this only for women?",
        answer:
          "No. You choose: girls only or mixed. Both are Sunday Table, new people, real conversation.",
      },
      {
        question: "How long until I hear back?",
        answer:
          "It varies by city and table type. We invite people by hand as soon as we have a table that fits you.",
      },
    ],
  },
  waitlist: {
    eyebrow: "Waitlist",
    title: "Join the waitlist",
    body: "We'll let you know as soon as a table forms in your city.",
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
    successBody: "As soon as a table forms in your city, you'll hear from us.",
    successNext:
      "Prefer updates over WhatsApp instead of email? Join the group, we post our announcements there too.",
    whatsappGirlsLabel: "Girls only WhatsApp",
    whatsappMixedLabel: "Mixed WhatsApp",
    close: "Close",
    dialogAria: "Join the waitlist",
  },
};
