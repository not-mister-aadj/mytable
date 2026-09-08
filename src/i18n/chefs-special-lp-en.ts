import type { FormatLpLabels } from "@/i18n/format-lp.types";
import { buildWaitlistLabelsEn } from "@/i18n/build-waitlist-labels";

export const chefsSpecialLpEn: FormatLpLabels = {
  meta: {
    title: "Chef's Table · MyTable",
    description:
      "Sunday evening with the best dishes on the menu, pre-selected: starters, mains and dessert. Join the waitlist.",
    titleCity: "Chef's Table in {city} · MyTable",
    descriptionCity:
      "Sunday evening in {city} with the best dishes on the menu, pre-selected: starters, mains and dessert. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Chef's Table · best dishes, pre-selected",
  headline: "The best dishes. One table. Nothing to plan.",
  headlineCity: "The best dishes in {city}. One table. Nothing to plan.",
  line: "Chef's Table is a Sunday evening with the best dishes on the menu, pre-selected: starters, mains and dessert.",
  lineCity:
    "Chef's Table is a Sunday evening in {city} with the best dishes on the menu, pre-selected: starters, mains and dessert.",
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
    titleCity: "Ready to pull up a chair in {city}?",
    body: "The best dishes. One table. You're in.",
    cta: "Join the waitlist",
  },
  cities: {
    eyebrow: "Cities",
    title: "In your city too?",
    body: "We're expanding. Join the waitlist for the city where you want a seat.",
  },
  waitlist: buildWaitlistLabelsEn({
    body: "We'll let you know as soon as a Chef's Table forms in your city.",
    questionsBody: "Helps us find the right table for you. Totally optional.",
    successBody: "As soon as a Chef's Table forms in your city, you'll hear from us.",
    tableTypeTitle: "Which table?",
  }),
};
