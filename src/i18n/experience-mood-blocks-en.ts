import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
} from "./types";

export const wineWalkFlowEn: ExperienceFlowStep[] = [
  {
    title: "Tickets in advance",
    description:
      "You book on this page. After payment you receive confirmation by email. Free exchange up to 48 hours before start.",
  },
  {
    title: "Start at the first restaurant",
    description:
      "Arrive on time at the first stop on your route. Show your ticket and enjoy the first wine and food pairing.",
  },
  {
    title: "On to the next stop",
    description:
      "When you're ready, walk with your own party to the next restaurant. No guide, a clear route at your own pace.",
  },
  {
    title: "Taste at every venue",
    description:
      "Each stop has a pairing ready. You discover several restaurants in one afternoon, without planning it yourself.",
  },
];

export const chefsSpecialFlowEn: ExperienceFlowStep[] = [
  {
    title: "Reserve your tickets",
    description:
      "Book ahead for yourself or your party. Everything is paid before you arrive.",
  },
  {
    title: "Arrive at the restaurant",
    description:
      "You're welcomed to your reserved seats. The chef has put the evening together for you.",
  },
  {
    title: "Family style at the table",
    description:
      "Multiple starters, mains and desserts arrive in the middle. You share and taste the best of the house.",
  },
  {
    title: "At your own pace",
    description:
      "No tight schedule. Enjoy the evening; afterwards you can often stay for another drink.",
  },
];

export const sharedDinnerFlowEn: ExperienceFlowStep[] = [
  {
    title: "Book your seats",
    description:
      "Reserve tickets for your own party. Payment is upfront.",
  },
  {
    title: "Welcome at the restaurant",
    description:
      "You're received and briefly walk through the evening's menu.",
  },
  {
    title: "Shared menu",
    description:
      "The restaurant serves a thoughtful menu. Dishes are shared so you taste more.",
  },
  {
    title: "Gentle finish",
    description:
      "After dessert you can linger or head on when you're ready.",
  },
];

export const tastingFlowEn: ExperienceFlowStep[] = [
  {
    title: "Book ahead",
    description:
      "Buy tickets for yourself or your group. After payment, everything is in your confirmation.",
  },
  {
    title: "Welcome with a first glass",
    description:
      "You're welcomed at the restaurant. The host or wine bar briefly explains what's coming to the table.",
  },
  {
    title: "Four wines with bites",
    description:
      "You taste four wines with matching bites, in one place, at your own pace.",
  },
  {
    title: "Finish without rushing",
    description:
      "Plan for the afternoon. Extra orders are often possible at the table; staff will explain what's available.",
  },
];

export const sundayFlowEn: ExperienceFlowStep[] = tastingFlowEn;

export const mysteryFlowEn: ExperienceFlowStep[] = [
  {
    title: "Book your evening",
    description:
      "After booking you receive the practical details. You know where to be.",
  },
  {
    title: "Surprise menu",
    description:
      "The restaurant serves an evening that fits the venue's character.",
  },
  {
    title: "Your party, one table",
    description:
      "You sit with the people you booked for. We arrange the restaurant and the menu.",
  },
  {
    title: "Details afterwards",
    description:
      "After the evening you can find the venue again via your confirmation or our follow-up.",
  },
];

export const tastingQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "Four wines, great bites, no fuss. We didn't have to think about a thing.",
    name: "Anna",
    age: 31,
  },
  {
    quote:
      "Over two hours of tasting at our pace. The pairings were spot on for a Sunday afternoon.",
    name: "Petra",
    age: 45,
  },
  {
    quote:
      "We came for the wine and stayed for the atmosphere. No exam, just good taste.",
    name: "Kim & Sam",
    detail: "Duo",
  },
];

export const wineWalkQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "Several restaurants in one afternoon without planning it ourselves. A strong pairing at every stop.",
    name: "Mark",
    age: 34,
  },
  {
    quote:
      "Relaxed pace, clear route. Perfect with friends: walk, taste, move on.",
    name: "Sanne",
    age: 29,
  },
  {
    quote:
      "We discovered three places we would never have booked ourselves. Everything arranged upfront.",
    name: "Tom & Eva",
    detail: "Duo",
  },
];

export const sharedDinnerQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "Family style was exactly right: more of the kitchen without decision fatigue.",
    name: "Lisa",
    age: 29,
  },
  {
    quote:
      "The menu worked from starter to dessert. Clear on drinks and dietary needs.",
    name: "David",
    age: 36,
  },
  {
    quote:
      "Felt like a private evening in the restaurant, without the organising stress.",
    name: "Noor",
    age: 33,
  },
];

export const sundayQuotesEn: ExperienceGuestQuote[] = tastingQuotesEn;
export const mysteryQuotesEn: ExperienceGuestQuote[] = sharedDinnerQuotesEn;

export const rotterdamRouteStopsEn = [
  "Witte de With",
  "Westelijk Handelsterrein",
  "Oude Haven",
  "Meent",
];
