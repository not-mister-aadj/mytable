import type { FormatLpLabels } from "@/i18n/format-lp.types";
import { buildWaitlistLabelsEn } from "@/i18n/build-waitlist-labels";

export const wineTastingLpEn: FormatLpLabels = {
  meta: {
    title: "Wine Tasting · MyTable",
    description:
      "A selection of wines with bite pairings, chosen by the wine bar. A fun afternoon at one table. Join the waitlist.",
    titleCity: "Wine Tasting in {city} · MyTable",
    descriptionCity:
      "A selection of wines with bite pairings in {city}, chosen by the wine bar. A fun afternoon at one table. Join the waitlist.",
  },
  brand: "MyTable",
  socialProof: "Wine tasting · put together by the wine bar",
  headline: "Good wine. One table. Nothing to plan.",
  headlineCity: "Good wine in {city}. One table. Nothing to plan.",
  line: "Wine Tasting gives you a selection of wines with bite pairings, chosen by the wine bar. A fun afternoon at one table, without having to figure anything out yourself.",
  lineCity:
    "Wine Tasting gives you a selection of wines with bite pairings in {city}, chosen by the wine bar. A fun afternoon at one table, without having to figure anything out yourself.",
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
    titleCity: "Ready to taste in {city}?",
    body: "Good wine. One table. You're in.",
    cta: "Join the waitlist",
  },
  cities: {
    eyebrow: "Cities",
    title: "In your city too?",
    body: "We're expanding. Join the waitlist for the city where you want to taste.",
  },
  waitlist: buildWaitlistLabelsEn({
    body: "We'll let you know as soon as a tasting forms in your city.",
    questionsBody: "Helps us find the right tasting for you. Totally optional.",
    successBody: "As soon as a tasting forms in your city, you'll hear from us.",
    tableTypeTitle: "Which table?",
  }),
};
