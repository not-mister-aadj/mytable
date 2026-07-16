import type {
  ExperienceFlowStep,
  ExperienceGuestQuote,
} from "./types";

export const wineWalkFlowEn: ExperienceFlowStep[] = [
  {
    title: "Start at the first venue",
    description:
      "We begin at the first stop with a short introduction so everyone can settle in.",
  },
  {
    title: "Taste along the way",
    description:
      "At each stop something is ready to try: wine, bites, or a small pairing.",
  },
  {
    title: "Walk at a relaxed pace",
    description:
      "Between venues you walk through the city together. No rush, no tight schedule.",
  },
  {
    title: "Meet new people",
    description:
      "As you change spots and conversations along the way, meeting people feels natural and easy.",
  },
];

export const chefsSpecialFlowEn: ExperienceFlowStep[] = [
  {
    title: "Take your seat",
    description:
      "You arrive at the restaurant and are welcomed at the MyTable table.",
  },
  {
    title: "Let yourself be surprised",
    description:
      "The chef or restaurant serves a special menu or multiple courses.",
  },
  {
    title: "Eat together",
    description:
      "The table is set up for relaxed conversation, without a networking vibe.",
  },
  {
    title: "Stay a while",
    description:
      "Afterwards you can often linger for another drink or keep chatting.",
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
      "You're greeted with a first glass. The host briefly explains what the chef has planned for the table.",
  },
  {
    title: "Chef's special at the table",
    description:
      "The restaurant serves specials for the whole group, wine and bites that match, at your own pace.",
  },
  {
    title: "Table conversation",
    description:
      "The group is intimate enough to connect and varied enough to feel lively.",
  },
  {
    title: "Close without rushing",
    description:
      "Plan for the whole afternoon. Many groups keep the vibe going afterward, more wine, drinks, or dinner out.",
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

export const tastingQuotesEn: ExperienceGuestQuote[] = [
  {
    quote:
      "I thought it might feel awkward, but within ten minutes it felt normal. Four wines, great bites, no hassle.",
    name: "Anna",
    age: 31,
  },
  {
    quote:
      "Okay wait… way more fun than I expected. Well over two hours of tasting and chatting, at our own pace. Why didn't I do this sooner?",
    name: "Petra",
    age: 45,
  },
  {
    quote:
      "We came for the wine and stayed for the conversation. Just cozy, without anyone testing your wine knowledge.",
    name: "Kim & Sam",
    detail: "Couple",
  },
];

export const wineWalkQuotesEn: ExperienceGuestQuote[] = tastingQuotesEn;

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
      "The chef's specials were surprisingly good and conversation kept going until late.",
    name: "Noor",
    age: 33,
  },
];

export const sundayQuotesEn: ExperienceGuestQuote[] = tastingQuotesEn;
export const mysteryQuotesEn: ExperienceGuestQuote[] = sharedDinnerQuotesEn;

export const rotterdamRouteStopsEn = [
  "Witte de With",
  "Western Harbour",
  "Old Harbour",
  "Meent",
];
