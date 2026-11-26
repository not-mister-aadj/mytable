// /creators copy, Dutch and English. Reached only from the footer (noindex).

type Item = { title: string; body: string };

export type MakerCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  cta: string;
  ctaSecondary: string;
  heroMeta: string;
  badge: string;
  quickFacts: string[];
  communityEyebrow: string;
  stepsEyebrow: string;
  waysEyebrow: string;
  faqEyebrow: string;
  giftTitle: string;
  giftIntro: string;
  gifts: (Item & { tag: string })[];
  calc: {
    title: string;
    lead: string;
    label: string;
    perMonth: (n: number) => string;
    people: (n: number) => string;
    seats: (n: number) => string;
    members: (n: number) => string;
    totalLabel: string;
    note: string;
  };
  communityTitle: string;
  communityIntro: string;
  community: Item[];
  stepsTitle: string;
  steps: Item[];
  waysTitle: string;
  waysIntro: string;
  ways: Item[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  meetTitle: string;
  meetIntro: string;
  meetPoints: string[];
  form: {
    name: string;
    email: string;
    city: string;
    instagram: string;
    tiktok: string;
    otherSocials: string;
    otherPlaceholder: string;
    handleHelp: string;
    portfolio: string;
    workStyle: string;
    styles: { self: string; us: string; either: string };
    note: string;
    optional: string;
    privacy: [string, string, string];
    submit: string;
    sending: string;
    doneTitle: string;
    doneBody: string;
    errors: Record<"name" | "email" | "city" | "handle" | "privacy" | "tooMany" | "generic", string>;
  };
};

const nl: MakerCopy = {
  metaTitle: "Creators · MyTable",
  metaDescription: "Maak content voor de mooiste tafels van je stad. Bouw je portfolio en doe ervaring op in een leuk team van creators.",
  eyebrow: "MyTable Creators",
  title: "Maak content voor de mooiste tafels van je stad.",
  intro:
    "Fotografeer of film eten, wijn, mooie plekken en momenten, of juist een community met een verhaal. Alles kan, zolang het bij MyTable past. Je bouwt je portfolio in een leuk team van creators. En aan iedereen die via jouw affiliate link boekt, verdien je twee jaar lang mee.",
  cta: "Plan een kennismaking",
  ctaSecondary: "Zo werkt het",
  heroMeta: "Eerst online kennismaken · daarna je eigen affiliate link",
  badge: "Creators gezocht",
  quickFacts: ["Een leuk team", "Bouw je portfolio", "2 jaar meeverdienen"],
  communityEyebrow: "Wat je krijgt",
  stepsEyebrow: "Zo werkt het",
  waysEyebrow: "Hoe je wilt werken",
  faqEyebrow: "Vragen",
  giftTitle: "Een reden om jouw affiliate link te gebruiken",
  giftIntro: "Wie via jouw affiliate link boekt, kiest een cadeau. Zo deel je iets waar je volgers zelf ook wat aan hebben.",
  gifts: [
    { tag: "Optie 1", title: "Neem gratis iemand mee", body: "Twee plekken voor de prijs van één. Samen aanschuiven is makkelijker dan alleen." },
    { tag: "Optie 2", title: "De tweede keer half geld", body: "Kom de eerste keer alleen en betaal de tweede keer de helft voor je plek." },
  ],
  calc: {
    title: "Twee jaar meeverdienen",
    lead: "Boekt iemand via jouw affiliate link? Dan verdien je twee jaar lang mee aan elke plek die diegene boekt.",
    label: "Mensen per maand via jou",
    perMonth: (n) => (n === 1 ? "1 persoon" : `${n} mensen`),
    people: (n) => `${n} mensen in een jaar`,
    seats: (n) => `${n} plekken × €7`,
    members: (n) => `${n} club members × 12 maanden × €7`,
    totalLabel: "Voor jou, in twee jaar",
    note: "Een schatting: iedereen komt 4 keer in twee jaar en 1 op de 8 wordt club member.",
  },
  communityTitle: "Een team dat samen beter wordt",
  communityIntro: "Meer dan een affiliate link: je maakt deel uit van een groep creators.",
  community: [
    {
      title: "Een leuk team",
      body: "Creators die net als jij van eten, wijn en goede plekken houden. Je staat er niet alleen voor.",
    },
    {
      title: "Bouw je portfolio",
      body: "Je maakt echte content voor een merk dat groeit, op de mooiste plekken van je stad. Goed voor je portfolio en je cv.",
    },
    {
      title: "Elke twee weken samen",
      body: "Een korte online call met alle creators. We delen wat werkt, wat niet, en leren van elkaar.",
    },
    {
      title: "Creator van de maand",
      body: "Elke maand winnen de creators met de beste post en de meeste boekingen een leuke prijs.",
    },
  ],
  stepsTitle: "In drie stappen aan de slag",
  steps: [
    { title: "Maak kennis", body: "Eerst een kort online gesprek. Je zit nergens aan vast." },
    { title: "Krijg je affiliate link", body: "Klikt het, dan krijg je je eigen affiliate link. Die werkt op elk kanaal." },
    { title: "Maak, deel en leer", body: "Je maakt content, schuift aan bij de calls en deelt je link. Wie via jou boekt, levert je ook nog wat op." },
  ],
  waysTitle: "Jij kiest waar en hoe je post",
  waysIntro:
    "Op Instagram doen we het het liefst als collab: dan verschijnt de post bij allebei, en vaak ook bij de plek zelf.",
  ways: [
    { title: "Jij post", body: "Je maakt en plaatst je eigen content en nodigt ons uit als collaborator." },
    { title: "Wij posten", body: "Je stuurt ons je beelden, wij plaatsen ze en nodigen jou uit." },
    { title: "De plek doet mee", body: "Bij een post over een plek vragen we de plek ook als collab. Zo bereik je ook hun volgers." },
  ],
  faqTitle: "Goed om te weten",
  faq: [
    { q: "Welke social media tellen?", a: "Allemaal. Instagram, TikTok, Facebook, LinkedIn, YouTube of je eigen blog. Je link werkt overal." },
    {
      q: "Waar zet ik mijn affiliate link?",
      a: "Op Instagram en TikTok in je bio of in een story met een linksticker. Op Facebook en LinkedIn gewoon in je post.",
    },
    {
      q: "Wanneer telt iemand voor mij?",
      a: "Als diegene binnen 30 dagen na een klik op je link boekt en nog niet eerder bij ons betaalde. Daarna telt alles wat diegene twee jaar lang boekt, ook een club membership: €7 per maand.",
    },
    { q: "Wat telt niet?", a: "Je eigen boekingen, de gratis plek en plekken die we terugbetalen." },
    { q: "Wanneer krijg ik betaald?", a: "Eens per maand, voor de zondagen die al geweest zijn." },
    { q: "Moet ik veel volgers hebben?", a: "Nee. We kijken naar je beelden en je verhaal." },
    {
      q: "Wat is Sunday Social?",
      a: "Een zondagmiddag aan tafel met nieuwe mensen, in een wijnbar of restaurant dat wij uitkiezen. Een plek kost €10.",
    },
  ],
  meetTitle: "Eerst kennismaken",
  meetIntro: "Laat weten wie je bent. We mailen je voor een kort online gesprek.",
  meetPoints: ["Wie je bent en wat je maakt", "Welke plekken je mooi vindt", "Hoe je het liefst werkt"],
  form: {
    name: "Naam",
    email: "E-mailadres",
    city: "Stad",
    instagram: "Instagram",
    tiktok: "TikTok",
    otherSocials: "Facebook, LinkedIn of anders",
    otherPlaceholder: "Link of naam",
    handleHelp: "Vul in waar je post. Eén is genoeg.",
    portfolio: "Link naar je werk",
    workStyle: "Hoe wil je werken?",
    styles: { self: "Ik post zelf", us: "Jullie posten", either: "Maakt me niet uit" },
    note: "Nog iets wat we moeten weten?",
    optional: "optioneel",
    privacy: ["Ik ga akkoord met de ", "privacyverklaring", "."],
    submit: "Plan een kennismaking",
    sending: "Versturen…",
    doneTitle: "Dank je.",
    doneBody: "We mailen je binnen een paar dagen om een moment te plannen.",
    errors: {
      name: "Vul je naam in.",
      email: "Vul een geldig e-mailadres in.",
      city: "Vul je stad in.",
      handle: "Vul in waar je post.",
      privacy: "Ga akkoord met de privacyverklaring.",
      tooMany: "Even te vaak geprobeerd. Probeer het zo nog eens.",
      generic: "Dat lukte niet. Probeer het nog een keer.",
    },
  },
};

const en: MakerCopy = {
  metaTitle: "Creators · MyTable",
  metaDescription: "Create content for the best tables in your city. Build your portfolio and gain experience in a fun team of creators.",
  eyebrow: "MyTable Creators",
  title: "Create content for the best tables in your city.",
  intro:
    "Shoot food, wine, beautiful places and moments, or a community with a story. Anything goes, as long as it fits MyTable. You build your portfolio in a fun team of creators. And you earn on everyone who books through your affiliate link, for two years.",
  cta: "Plan a quick call",
  ctaSecondary: "How it works",
  heroMeta: "First a short online call · then your own affiliate link",
  badge: "Creators wanted",
  quickFacts: ["A fun team", "Build your portfolio", "Earn for 2 years"],
  communityEyebrow: "What you get",
  stepsEyebrow: "How it works",
  waysEyebrow: "How you want to work",
  faqEyebrow: "Questions",
  giftTitle: "A reason to use your affiliate link",
  giftIntro: "Whoever books through your affiliate link picks a gift. So you share something your audience gets something out of too.",
  gifts: [
    { tag: "Option 1", title: "Bring someone along free", body: "Two seats for the price of one. Joining together is easier than alone." },
    { tag: "Option 2", title: "Half price the second time", body: "Come alone the first time and pay half for your seat the second time." },
  ],
  calc: {
    title: "Two years of earning",
    lead: "Someone books through your affiliate link? Then you earn on every seat they book, for two years.",
    label: "People per month through you",
    perMonth: (n) => (n === 1 ? "1 person" : `${n} people`),
    people: (n) => `${n} people in a year`,
    seats: (n) => `${n} seats × €7`,
    members: (n) => `${n} club members × 12 months × €7`,
    totalLabel: "For you, in two years",
    note: "An estimate: everyone comes 4 times in two years and 1 in 8 becomes a club member.",
  },
  communityTitle: "A team that gets better together",
  communityIntro: "More than an affiliate link: you become part of a group of creators.",
  community: [
    {
      title: "A fun team",
      body: "Creators who love food, wine and good places as much as you do. You're never on your own.",
    },
    {
      title: "Build your portfolio",
      body: "You make real content for a growing brand, in the best places of your city. Good for your portfolio and your CV.",
    },
    {
      title: "Together every two weeks",
      body: "A short online call with all creators. We share what works, what doesn't, and learn from each other.",
    },
    {
      title: "Creator of the month",
      body: "Every month, the creators with the best post and the most bookings win a nice prize.",
    },
  ],
  stepsTitle: "Get started in three steps",
  steps: [
    { title: "Meet us", body: "First a short online call. No strings attached." },
    { title: "Get your affiliate link", body: "If it clicks, you get your own affiliate link. It works on any channel." },
    { title: "Make, share and learn", body: "You make content, join the calls and share your link. Whoever books through you earns you something too." },
  ],
  waysTitle: "You choose where and how you post",
  waysIntro:
    "On Instagram we like to post as a collab: the post shows up for both of us, and often for the venue too.",
  ways: [
    { title: "You post", body: "You make and post your own content and invite us as a collaborator." },
    { title: "We post", body: "You send us your images, we post them and invite you." },
    { title: "The venue joins", body: "For a post about a venue we ask the venue to join the collab too. You reach their followers as well." },
  ],
  faqTitle: "Good to know",
  faq: [
    { q: "Which social media count?", a: "All of them. Instagram, TikTok, Facebook, LinkedIn, YouTube or your own blog. Your link works everywhere." },
    {
      q: "Where do I put my affiliate link?",
      a: "On Instagram and TikTok in your bio or in a story with a link sticker. On Facebook and LinkedIn simply in your post.",
    },
    {
      q: "When does someone count for me?",
      a: "When they book within 30 days of clicking your link and never paid with us before. After that, everything they book for two years counts, a club membership too: €7 per month.",
    },
    { q: "What doesn't count?", a: "Your own bookings, the free seat and seats we refund." },
    { q: "When do I get paid?", a: "Once a month, for the Sundays that have taken place." },
    { q: "Do I need a lot of followers?", a: "No. We look at your images and your story." },
    {
      q: "What is Sunday Social?",
      a: "A Sunday afternoon at a table with new people, in a wine bar or restaurant we pick. A seat costs €10.",
    },
  ],
  meetTitle: "First, let's meet",
  meetIntro: "Tell us who you are. We will email you to plan a short online call.",
  meetPoints: ["Who you are and what you make", "Which places you love", "How you like to work"],
  form: {
    name: "Name",
    email: "Email",
    city: "City",
    instagram: "Instagram",
    tiktok: "TikTok",
    otherSocials: "Facebook, LinkedIn or other",
    otherPlaceholder: "Link or name",
    handleHelp: "Fill in where you post. One is enough.",
    portfolio: "Link to your work",
    workStyle: "How do you want to work?",
    styles: { self: "I post myself", us: "You post", either: "Either is fine" },
    note: "Anything else we should know?",
    optional: "optional",
    privacy: ["I agree to the ", "privacy statement", "."],
    submit: "Plan a call",
    sending: "Sending…",
    doneTitle: "Thank you.",
    doneBody: "We will email you within a few days to plan a moment.",
    errors: {
      name: "Fill in your name.",
      email: "Fill in a valid email address.",
      city: "Fill in your city.",
      handle: "Fill in where you post.",
      privacy: "Please agree to the privacy statement.",
      tooMany: "Too many tries. Try again in a moment.",
      generic: "That didn't work. Please try again.",
    },
  },
};

export function makerCopy(locale: string): MakerCopy {
  return locale === "en" ? en : nl;
}
