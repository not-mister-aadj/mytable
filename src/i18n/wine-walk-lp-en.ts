import type { FormatLpLabels } from "@/i18n/format-lp.types";
import { buildWaitlistLabelsEn } from "@/i18n/build-waitlist-labels";

export const wineWalkLpEn: FormatLpLabels = {
  meta: {
    title: "Wine Walk · MyTable",
    description:
      "Discover the city by trying several venues, each with wine and food. Join the waitlist.",
    titleCity: "Wine Walk in {city} · MyTable",
    descriptionCity:
      "Discover {city} by trying several venues, each with wine and food. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Wine walk · multiple venues, one evening",
  headline: "One evening. Several places. No planning hassle.",
  headlineCity: "One evening in {city}. Several places. No planning hassle.",
  line: "Wine Walk lets you discover the city by trying several venues, each with wine and food. We map out the route for you.",
  lineCity:
    "Wine Walk lets you discover {city} by trying several venues, each with wine and food. We map out the route for you.",
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
    titleCity: "Ready to walk in {city}?",
    body: "Several places. One evening. You're in.",
    cta: "Join the waitlist",
  },
  cities: {
    eyebrow: "Cities",
    title: "In your city too?",
    body: "We're expanding. Join the waitlist for the city where you want to walk.",
  },
  waitlist: buildWaitlistLabelsEn({
    body: "We'll let you know as soon as a wine walk forms in your city.",
    questionsBody: "Helps us find the right wine walk for you. Totally optional.",
    successBody: "As soon as a wine walk forms in your city, you'll hear from us.",
    tableTypeTitle: "Which group?",
  }),
};
