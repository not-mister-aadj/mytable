// /ambassadors page and form copy, Dutch and English. Short and calm, like the rest of the site.

export const AMBASSADOR_CITIES = ["Rotterdam", "Den Haag", "Utrecht", "Amsterdam", "Eindhoven"] as const;
export const AMBASSADOR_ROLES = ["fill", "host", "build"] as const;
export type AmbassadorRole = (typeof AMBASSADOR_ROLES)[number];

export type AmbassadorCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  cta: string;
  imageAlt: string;
  whatTitle: string;
  whatBody: string;
  rolesTitle: string;
  roles: Record<AmbassadorRole, { title: string; body: string }>;
  getTitle: string;
  get: { title: string; body: string }[];
  milestonesTitle: string;
  milestonesBody: string;
  milestones: string[];
  whoTitle: string;
  who: string[];
  stepsTitle: string;
  steps: { title: string; body: string }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  form: {
    title: string;
    intro: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    cityPlaceholder: string;
    study: string;
    institution: string;
    studyYear: string;
    roles: string;
    instagram: string;
    linkedin: string;
    optional: string;
    motivation: string;
    motivationHelp: string;
    motivationFile: string;
    motivationFileHelp: string;
    motivationText: string;
    motivationTextPlaceholder: string;
    availability: string;
    availabilityPlaceholder: string;
    heardFrom: string;
    adult: string;
    privacy: string;
    submit: string;
    sending: string;
    doneTitle: string;
    doneBody: string;
    errors: {
      required: string;
      motivation: string;
      file: string;
      fileSize: string;
      adult: string;
      generic: string;
      tooMany: string;
    };
  };
};

const nl: AmbassadorCopy = {
  metaTitle: "Word MyTable Ambassador",
  metaDescription:
    "Student en goed in mensen samenbrengen? Bouw mee aan de Sunday Socials in jouw stad, met een leuk team om je heen.",
  eyebrow: "MyTable · Ambassadors",
  title: "Breng mensen samen aan tafel in jouw stad",
  intro:
    "Word MyTable Ambassador. Je bouwt mee aan de Sunday Socials in jouw stad, met een leuk team om je heen.",
  cta: "Meld je aan",
  imageAlt: "Een groep aan tafel in een wijnbar, glas in de hand, in gesprek",
  whatTitle: "Wat is MyTable",
  whatBody:
    "Op zondagmiddag schuiven mensen die elkaar nog niet kennen aan bij een wijnbar, in groepjes van 4 tot 6. Rustig, gezellig en zonder gedoe. We zijn er in Rotterdam, Den Haag, Utrecht, Amsterdam en Eindhoven.",
  rolesTitle: "Wat je doet",
  roles: {
    fill: {
      title: "Vullen",
      body: "Je maakt mensen in je stad enthousiast, via je netwerk, je vereniging en je socials.",
    },
    host: {
      title: "Hosten",
      body: "Op zondag ontvang je de gasten en help je de groepjes op weg.",
    },
    build: {
      title: "Bouwen",
      body: "Je denkt mee over nieuwe wijnbars en ideeën. Als je dat leuk vindt.",
    },
  },
  getTitle: "Wat je ervoor terugkrijgt",
  get: [
    { title: "Ervaring", body: "In events, marketing en community. Mooi voor je cv, en een aanbeveling op LinkedIn." },
    { title: "Gratis mee", body: "Je schuift zelf aan bij de edities, wijn inbegrepen." },
    { title: "Een leuk team", body: "Teamborrels en uitjes met de andere ambassadors." },
  ],
  milestonesTitle: "Samen naar mijlpalen",
  milestonesBody: "Haal je ze met je stad, of met alle steden samen, dan vieren we dat.",
  milestones: ["De eerste volle editie in jouw stad", "Drie volle edities op rij", "Alle steden vol in één maand"],
  whoTitle: "Wie we zoeken",
  who: [
    "Je studeert en bent 18 jaar of ouder",
    "Je woont of studeert in een van onze vijf steden",
    "Je houdt van mensen samenbrengen. Wijnkennis is niet nodig",
    "Je hebt een paar uur per maand, en af en toe een zondagmiddag",
  ],
  stepsTitle: "Zo werkt het",
  steps: [
    { title: "Meld je aan", body: "Vertel kort wie je bent en waarom je dit wilt." },
    { title: "Kennismaken", body: "We plannen een kort gesprek met je in." },
    { title: "Aan de slag", body: "Je begint voor een semester. Daarna kijken we samen verder." },
  ],
  faqTitle: "Vragen",
  faq: [
    { q: "Is het betaald?", a: "Nee. Je krijgt ervaring, gratis edities en een leuk team. In het gesprek vertellen we je precies wat er bij jouw rol hoort." },
    { q: "Hoeveel tijd kost het?", a: "Een paar uur per maand, en af en toe een zondagmiddag. Jij bepaalt mee wat past naast je studie." },
    { q: "Moet ik verstand hebben van wijn?", a: "Nee. Het gaat om de mensen. De wijn kiezen we samen met de zaak." },
    { q: "En als ik tentamens heb?", a: "Geef het aan, dan neemt iemand anders uit het team het over." },
  ],
  form: {
    title: "Meld je aan",
    intro: "Daarna nemen we contact met je op voor een kennismaking.",
    name: "Naam",
    email: "E-mail",
    phone: "Telefoon",
    city: "Stad",
    cityPlaceholder: "Kies je stad",
    study: "Studie",
    institution: "Universiteit of hogeschool",
    studyYear: "Studiejaar",
    roles: "Wat spreekt je aan?",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    optional: "optioneel",
    motivation: "Je motivatie",
    motivationHelp: "Upload een document, of schrijf het hieronder. Eén van de twee is genoeg.",
    motivationFile: "Document",
    motivationFileHelp: "PDF of Word, maximaal 5 MB",
    motivationText: "Of schrijf het hier",
    motivationTextPlaceholder: "Wie ben je, en waarom wil je dit doen?",
    availability: "Wanneer kun je voor een kennismaking?",
    availabilityPlaceholder: "Bijvoorbeeld: doordeweeks na 16:00",
    heardFrom: "Hoe heb je ons gevonden?",
    adult: "Ik ben 18 jaar of ouder",
    privacy: "We gebruiken je gegevens alleen voor je aanmelding.",
    submit: "Verstuur aanmelding",
    sending: "Bezig met versturen",
    doneTitle: "Dank je wel",
    doneBody: "We hebben je aanmelding ontvangen en nemen snel contact met je op om een kennismaking te plannen.",
    errors: {
      required: "Vul je naam, e-mail en stad in.",
      motivation: "Upload een document of schrijf je motivatie.",
      file: "Upload een PDF of Word-bestand.",
      fileSize: "Je document is te groot. Maximaal 5 MB.",
      adult: "Je moet 18 jaar of ouder zijn.",
      generic: "Dat lukte niet. Probeer het later opnieuw, of mail ons op info@mytable.club.",
      tooMany: "Te veel pogingen. Probeer het over een minuut opnieuw.",
    },
  },
};

const en: AmbassadorCopy = {
  metaTitle: "Become a MyTable Ambassador",
  metaDescription:
    "A student who's good at bringing people together? Help build the Sunday Socials in your city, with a fun team around you.",
  eyebrow: "MyTable · Ambassadors",
  title: "Bring people together at the table in your city",
  intro: "Become a MyTable Ambassador. You help build the Sunday Socials in your city, with a fun team around you.",
  cta: "Apply",
  imageAlt: "A group at a table in a wine bar, glass in hand, talking",
  whatTitle: "What is MyTable",
  whatBody:
    "On Sunday afternoons, people who don't know each other yet sit down at a wine bar in groups of 4 to 6. Relaxed, sociable and easy. We're in Rotterdam, The Hague, Utrecht, Amsterdam and Eindhoven.",
  rolesTitle: "What you do",
  roles: {
    fill: { title: "Fill", body: "You get people in your city excited, through your network, your student association and your socials." },
    host: { title: "Host", body: "On Sunday you welcome the guests and help the groups get going." },
    build: { title: "Build", body: "You help think about new wine bars and ideas. If you enjoy that." },
  },
  getTitle: "What you get",
  get: [
    { title: "Experience", body: "In events, marketing and community. Great for your CV, plus a LinkedIn recommendation." },
    { title: "Join for free", body: "You join the editions yourself, wine included." },
    { title: "A fun team", body: "Team drinks and outings with the other ambassadors." },
  ],
  milestonesTitle: "Milestones together",
  milestonesBody: "Reach them with your city, or with all cities together, and we celebrate.",
  milestones: ["The first sold-out edition in your city", "Three sold-out editions in a row", "Every city sold out in one month"],
  whoTitle: "Who we're looking for",
  who: [
    "You're a student, 18 or older",
    "You live or study in one of our five cities",
    "You love bringing people together. No wine knowledge needed",
    "You have a few hours a month, and a Sunday afternoon now and then",
  ],
  stepsTitle: "How it works",
  steps: [
    { title: "Apply", body: "Tell us briefly who you are and why you'd like to do this." },
    { title: "Meet us", body: "We plan a short call with you." },
    { title: "Get started", body: "You start for one semester. After that, we look ahead together." },
  ],
  faqTitle: "Questions",
  faq: [
    { q: "Is it paid?", a: "No. You get experience, free editions and a fun team. In the call we tell you exactly what comes with your role." },
    { q: "How much time does it take?", a: "A few hours a month, and a Sunday afternoon now and then. You help decide what fits next to your studies." },
    { q: "Do I need to know about wine?", a: "No. It's about the people. We choose the wine together with the venue." },
    { q: "What if I have exams?", a: "Let us know, and someone else on the team takes over." },
  ],
  form: {
    title: "Apply",
    intro: "We'll then get in touch to plan a call.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    city: "City",
    cityPlaceholder: "Choose your city",
    study: "Study programme",
    institution: "University",
    studyYear: "Year of study",
    roles: "What appeals to you?",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    optional: "optional",
    motivation: "Your motivation",
    motivationHelp: "Upload a document, or write it below. One of the two is enough.",
    motivationFile: "Document",
    motivationFileHelp: "PDF or Word, up to 5 MB",
    motivationText: "Or write it here",
    motivationTextPlaceholder: "Who are you, and why would you like to do this?",
    availability: "When are you free for a call?",
    availabilityPlaceholder: "For example: weekdays after 4 pm",
    heardFrom: "How did you find us?",
    adult: "I'm 18 or older",
    privacy: "We only use your details for your application.",
    submit: "Send application",
    sending: "Sending",
    doneTitle: "Thank you",
    doneBody: "We've received your application and will get in touch soon to plan a call.",
    errors: {
      required: "Fill in your name, email and city.",
      motivation: "Upload a document or write your motivation.",
      file: "Upload a PDF or Word file.",
      fileSize: "Your document is too large. Up to 5 MB.",
      adult: "You need to be 18 or older.",
      generic: "That didn't work. Please try again later, or email us at info@mytable.club.",
      tooMany: "Too many attempts. Try again in a minute.",
    },
  },
};

export function ambassadorCopy(locale: string): AmbassadorCopy {
  return locale === "en" ? en : nl;
}
