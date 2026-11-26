// /makers copy, Dutch and English. Reached only from the footer (noindex).

type Item = { title: string; body: string };

export type MakerCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  cta: string;
  stepsTitle: string;
  steps: Item[];
  waysTitle: string;
  waysIntro: string;
  ways: Item[];
  getTitle: string;
  get: Item[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  form: {
    title: string;
    intro: string;
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
  metaDescription: "Maak je graag foto's en video's van eten en de mooiste plekken? Deel Sunday Social en verdien mee.",
  eyebrow: "Makers",
  title: "Jij vindt de mooiste plekken. Deel ze, en verdien mee.",
  intro:
    "Maak je graag foto's en video's van eten, wijn, de leukste plekken van je stad en een community met een verhaal? Werk met ons samen en verdien aan iedereen die via jou aanschuift. Instagram, TikTok, Facebook, LinkedIn: alle social media telt.",
  cta: "Plan een kennismaking",
  stepsTitle: "Zo werkt het",
  steps: [
    { title: "Maak kennis", body: "Eerst een kort online gesprek. Je zit nergens aan vast. Klikt het, dan krijg je je eigen link." },
    { title: "Deel Sunday Social", body: "Waar je ook post: zelf, met ons als collab, of samen met de plek." },
    {
      title: "Verdien mee",
      body: "Wie via jouw link boekt, neemt de eerste keer gratis iemand mee. Jij verdient mee, twee jaar lang.",
    },
  ],
  waysTitle: "Hoe je wilt werken",
  waysIntro:
    "Je kiest zelf waar en hoe je post. Op Instagram doen we het het liefst als collab: dan verschijnt de post bij allebei, en vaak ook bij de plek zelf. Zo zien meer mensen jouw link.",
  ways: [
    { title: "Jij post", body: "Je maakt en plaatst je eigen content en nodigt ons uit als collaborator." },
    { title: "Wij posten", body: "Je stuurt ons je beelden, wij plaatsen ze en nodigen jou uit." },
    {
      title: "De plek doet mee",
      body: "Bij een post over een plek vragen we de plek ook als collab. Zo komt hij bij hun volgers terecht, met jouw link erbij.",
    },
  ],
  getTitle: "Wat je krijgt",
  get: [
    { title: "€7 per plek", body: "Voor iedere betaalde plek via jouw link." },
    {
      title: "Twee jaar lang",
      body: "Boekt iemand via jou, dan verdien je ook aan alles wat diegene de twee jaar daarna boekt. Ook €7 per maand van een club membership.",
    },
    {
      title: "Een cadeau voor je volgers",
      body: "Wie nieuw is en via jouw link boekt, neemt de eerste keer gratis iemand mee.",
    },
  ],
  faqTitle: "Vragen",
  faq: [
    {
      q: "Welke social media tellen?",
      a: "Allemaal. Instagram, TikTok, Facebook, LinkedIn, YouTube of je eigen blog. Je link werkt overal.",
    },
    {
      q: "Waar zet ik mijn link?",
      a: "Op Instagram en TikTok in je bio of in een story met een linksticker. Op Facebook en LinkedIn gewoon in je post.",
    },
    { q: "Wanneer krijg ik betaald?", a: "Eens per maand, voor de zondagen die al geweest zijn." },
    { q: "Moet ik veel volgers hebben?", a: "Nee. We kijken naar je beelden." },
    {
      q: "Wat is Sunday Social?",
      a: "Een zondagmiddag aan tafel met nieuwe mensen, in een wijnbar of restaurant dat wij uitkiezen. Een plek kost €10.",
    },
  ],
  form: {
    title: "Plan een online kennismaking",
    intro: "Laat weten wie je bent, dan mailen we je voor een kort online gesprek. Je zit nergens aan vast.",
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
  metaDescription: "Love taking photos and videos of food and the best places? Share Sunday Social and earn with us.",
  eyebrow: "Makers",
  title: "You find the best places. Share them, and earn with us.",
  intro:
    "Love taking photos and videos of food, wine, the best spots in your city and a community with a story? Work with us and earn on everyone who joins a table through you. Instagram, TikTok, Facebook, LinkedIn: all social media counts.",
  cta: "Plan a quick call",
  stepsTitle: "How it works",
  steps: [
    { title: "Meet us", body: "First a short online call. No strings attached. If it clicks, you get your own link." },
    { title: "Share Sunday Social", body: "Wherever you post: on your own, with us as a collab, or together with the venue." },
    {
      title: "Earn with us",
      body: "Anyone who books through your link brings someone along free the first time. You earn, for two years.",
    },
  ],
  waysTitle: "How you want to work",
  waysIntro:
    "You choose where and how you post. On Instagram we like to post as a collab: the post shows up for both of us, and often for the venue too. More people see your link.",
  ways: [
    { title: "You post", body: "You make and post your own content and invite us as a collaborator." },
    { title: "We post", body: "You send us your images, we post them and invite you." },
    {
      title: "The venue joins",
      body: "For a post about a venue we ask the venue to join the collab too. It reaches their followers, with your link.",
    },
  ],
  getTitle: "What you get",
  get: [
    { title: "€7 per seat", body: "For every paid seat through your link." },
    {
      title: "For two years",
      body: "When someone books through you, you also earn on everything they book in the two years after. Also €7 per month of a club membership.",
    },
    {
      title: "A gift for your followers",
      body: "Anyone new who books through your link brings someone along free the first time.",
    },
  ],
  faqTitle: "Questions",
  faq: [
    {
      q: "Which social media count?",
      a: "All of them. Instagram, TikTok, Facebook, LinkedIn, YouTube or your own blog. Your link works everywhere.",
    },
    {
      q: "Where do I put my link?",
      a: "On Instagram and TikTok in your bio or in a story with a link sticker. On Facebook and LinkedIn simply in your post.",
    },
    { q: "When do I get paid?", a: "Once a month, for the Sundays that have taken place." },
    { q: "Do I need a lot of followers?", a: "No. We look at your images." },
    {
      q: "What is Sunday Social?",
      a: "A Sunday afternoon at a table with new people, in a wine bar or restaurant we pick. A seat costs €10.",
    },
  ],
  form: {
    title: "Plan a quick online call",
    intro: "Tell us who you are and we will email you to plan a short online call. No strings attached.",
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
