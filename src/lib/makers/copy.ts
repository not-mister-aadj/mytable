// /makers copy, Dutch and English. Reached only from the footer (noindex).

type Item = { title: string; body: string };

export type MakerCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  cta: string;
  ctaSecondary: string;
  stats: { value: string; label: string }[];
  forWhoTitle: string;
  forWho: string[];
  giftTitle: string;
  giftIntro: string;
  gifts: (Item & { tag: string })[];
  exampleTitle: string;
  exampleLabel: string;
  exampleLines: [string, string][];
  exampleTotalLabel: string;
  exampleTotal: string;
  exampleNote: string;
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
  metaTitle: "Makers · MyTable",
  metaDescription: "Voor wie de mooiste tafels vastlegt. Deel Sunday Social met je eigen link en verdien mee, twee jaar lang.",
  eyebrow: "MyTable Makers",
  title: "Voor wie de mooiste tafels vastlegt.",
  intro:
    "Foto's en video's van eten, wijn, mooie plekken en een community met een verhaal. Deel Sunday Social met je eigen link en verdien mee, twee jaar lang.",
  cta: "Plan een kennismaking",
  ctaSecondary: "Zo werkt het",
  stats: [
    { value: "€7", label: "per betaalde plek" },
    { value: "2 jaar", label: "verdien je mee aan wie via jou komt" },
    { value: "Elk kanaal", label: "Instagram, TikTok, Facebook, LinkedIn" },
  ],
  forWhoTitle: "Voor",
  forWho: ["Foodfotografen", "Wijnliefhebbers", "Stadsgidsen", "Bloggers", "Communitybouwers"],
  giftTitle: "Een reden om jouw link te gebruiken",
  giftIntro: "Wie via jou boekt, kiest een cadeau.",
  gifts: [
    { tag: "Optie 1", title: "Neem gratis iemand mee", body: "Twee plekken voor de prijs van één. Samen aanschuiven is makkelijker dan alleen." },
    { tag: "Optie 2", title: "De tweede keer half geld", body: "Kom de eerste keer alleen en betaal de tweede keer de helft voor je plek." },
  ],
  exampleTitle: "Een voorbeeld",
  exampleLabel: "Je deelt je link een paar keer per maand. In een jaar boeken 40 mensen via jou.",
  exampleLines: [
    ["Ze komen elk 4 keer in twee jaar: 160 plekken × €7", "€1.120"],
    ["5 van hen worden club member, 12 maanden × €7", "€420"],
  ],
  exampleTotalLabel: "Voor jou, in twee jaar",
  exampleTotal: "€1.540",
  exampleNote: "Kiezen ze de halve prijs, dan krijg je voor die plek €3,50.",
  stepsTitle: "Zo werkt het",
  steps: [
    { title: "Maak kennis", body: "Eerst een kort online gesprek. Je zit nergens aan vast." },
    { title: "Krijg je link", body: "Klikt het, dan krijg je je eigen link. Die werkt op elk kanaal." },
    { title: "Deel en verdien", body: "Wie via jouw link boekt, telt twee jaar lang voor jou. Eens per maand betalen we uit." },
  ],
  waysTitle: "Hoe je wilt werken",
  waysIntro:
    "Je kiest zelf waar en hoe je post. Op Instagram doen we het het liefst als collab: dan verschijnt de post bij allebei, en vaak ook bij de plek zelf.",
  ways: [
    { title: "Jij post", body: "Je maakt en plaatst je eigen content en nodigt ons uit als collaborator." },
    { title: "Wij posten", body: "Je stuurt ons je beelden, wij plaatsen ze en nodigen jou uit." },
    { title: "De plek doet mee", body: "Bij een post over een plek vragen we de plek ook als collab. Zo bereik je ook hun volgers." },
  ],
  faqTitle: "Vragen",
  faq: [
    { q: "Welke social media tellen?", a: "Allemaal. Instagram, TikTok, Facebook, LinkedIn, YouTube of je eigen blog. Je link werkt overal." },
    {
      q: "Waar zet ik mijn link?",
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
  metaTitle: "Makers · MyTable",
  metaDescription: "For those who capture the best tables. Share Sunday Social with your own link and earn with us, for two years.",
  eyebrow: "MyTable Makers",
  title: "For those who capture the best tables.",
  intro:
    "Photos and videos of food, wine, beautiful places and a community with a story. Share Sunday Social with your own link and earn with us, for two years.",
  cta: "Plan a quick call",
  ctaSecondary: "How it works",
  stats: [
    { value: "€7", label: "per paid seat" },
    { value: "2 years", label: "you earn on everyone who comes through you" },
    { value: "Any channel", label: "Instagram, TikTok, Facebook, LinkedIn" },
  ],
  forWhoTitle: "For",
  forWho: ["Food photographers", "Wine lovers", "City guides", "Bloggers", "Community builders"],
  giftTitle: "A reason to use your link",
  giftIntro: "Whoever books through you picks a gift.",
  gifts: [
    { tag: "Option 1", title: "Bring someone along free", body: "Two seats for the price of one. Joining together is easier than alone." },
    { tag: "Option 2", title: "Half price the second time", body: "Come alone the first time and pay half for your seat the second time." },
  ],
  exampleTitle: "An example",
  exampleLabel: "You share your link a few times a month. In a year, 40 people book through you.",
  exampleLines: [
    ["They each come 4 times in two years: 160 seats × €7", "€1,120"],
    ["5 of them become club members, 12 months × €7", "€420"],
  ],
  exampleTotalLabel: "For you, in two years",
  exampleTotal: "€1,540",
  exampleNote: "If they pick half price, you get €3.50 for that seat.",
  stepsTitle: "How it works",
  steps: [
    { title: "Meet us", body: "First a short online call. No strings attached." },
    { title: "Get your link", body: "If it clicks, you get your own link. It works on any channel." },
    { title: "Share and earn", body: "Whoever books through your link counts for you for two years. We pay out once a month." },
  ],
  waysTitle: "How you want to work",
  waysIntro:
    "You choose where and how you post. On Instagram we like to post as a collab: the post shows up for both of us, and often for the venue too.",
  ways: [
    { title: "You post", body: "You make and post your own content and invite us as a collaborator." },
    { title: "We post", body: "You send us your images, we post them and invite you." },
    { title: "The venue joins", body: "For a post about a venue we ask the venue to join the collab too. You reach their followers as well." },
  ],
  faqTitle: "Questions",
  faq: [
    { q: "Which social media count?", a: "All of them. Instagram, TikTok, Facebook, LinkedIn, YouTube or your own blog. Your link works everywhere." },
    {
      q: "Where do I put my link?",
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
