import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
} from "./types";

export const wineWalkFlowEn: ExperienceFlowStep[] = [
  {
    title: "Your first glass",
    description:
      "We start together at the first venue with a short intro and a welcome pour.",
  },
  {
    title: "Explore the city",
    description:
      "Between stops you walk at an easy pace through the neighbourhood.",
  },
  {
    title: "New conversations",
    description:
      "At every table new chats and connections naturally unfold.",
  },
  {
    title: "Close without rushing",
    description:
      "Often people stay a little longer for one last drink afterwards.",
  },
];

export const sharedDinnerFlowEn: ExperienceFlowStep[] = [
  {
    title: "Welcome at the table",
    description:
      "You begin with a drink and a short intro so everyone settles in quickly.",
  },
  {
    title: "Shared menu",
    description:
      "The restaurant serves a thoughtful menu while conversation flows on its own.",
  },
  {
    title: "Open table",
    description:
      "Everyone sits at one long table. No speeches, no forced small talk.",
  },
  {
    title: "Gentle finish",
    description:
      "After dessert you can linger and chat or head home on time.",
  },
];

export const tastingFlowEn: ExperienceFlowStep[] = [
  {
    title: "Welcome & intro",
    description:
      "You're greeted with a first glass and a brief overview of the tasting.",
  },
  {
    title: "Tasting in steps",
    description:
      "You sample several wines and bites at a calm pace, with room for questions.",
  },
  {
    title: "Table conversation",
    description:
      "The group is intimate enough to connect and varied enough to feel lively.",
  },
  {
    title: "Toast to close",
    description:
      "We end with a final glass. Those who want to stay often chat a bit longer.",
  },
];

export const sundayFlowEn: ExperienceFlowStep[] = [
  {
    title: "Sunday start",
    description:
      "Coffee, brunch, and a warm welcome before the table really fills up.",
  },
  {
    title: "Slow pace",
    description:
      "No rush: the afternoon is meant for unwinding and catching up.",
  },
  {
    title: "New faces",
    description:
      "At the table you meet people who also want a relaxed Sunday.",
  },
  {
    title: "Soft landing",
    description:
      "Often the table stays a little longer for one last coffee or glass.",
  },
];

export const mysteryFlowEn: ExperienceFlowStep[] = [
  {
    title: "Secret venue welcome",
    description:
      "After booking you receive the details. You know where to arrive, not always where you'll end up.",
  },
  {
    title: "Surprise menu",
    description:
      "The restaurant serves an evening that fits the mood of the mystery table.",
  },
  {
    title: "Shared table",
    description:
      "You join people who also want something beyond a standard night out.",
  },
  {
    title: "Reveal afterwards",
    description:
      "After the evening we often share where you were so you can return on your own.",
  },
];

export const wineWalkQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "I came alone and left with three new favourite spots in Rotterdam.",
    name: "Sophie",
    age: 34,
  },
  {
    quote:
      "It didn't feel awkward at all. Just a lovely Sunday with great conversation.",
    name: "Mark",
    age: 41,
  },
  {
    quote:
      "We wanted something different from a usual dinner out. This felt like a real experience.",
    name: "Elise & Tom",
    detail: "Couple",
  },
];

export const sharedDinnerQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "Like dining with friends you haven't met yet. Exactly the right atmosphere.",
    name: "Lisa",
    age: 29,
  },
  {
    quote:
      "I was nervous to come alone, but within ten minutes it felt completely normal.",
    name: "David",
    age: 36,
  },
  {
    quote:
      "The menu was surprisingly good and conversation kept going until late.",
    name: "Noor",
    age: 33,
  },
];

export const tastingQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "Not a boring wine class, but real tasting while you're happily at the table.",
    name: "Anna",
    age: 31,
  },
  {
    quote:
      "Perfect Sunday afternoon: not too long, not too short, and lovely people around you.",
    name: "Peter",
    age: 45,
  },
  {
    quote:
      "We came for the wine and stayed for the conversation. Would do it again.",
    name: "Kim & Sam",
    detail: "Couple",
  },
];

export const sundayQuotesEn: ExperienceGuestQuote[] = wineWalkQuotesEn;
export const mysteryQuotesEn: ExperienceGuestQuote[] = sharedDinnerQuotesEn;

export const rotterdamRouteStopsEn = [
  "Witte de With",
  "Western Harbour",
  "Old Harbour",
  "Meent",
];
