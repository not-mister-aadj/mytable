// /ambassadors (landing) and /ambassadors/aanmelden (form) copy, Dutch and English.
// Built like the big student programmes (Bumble Honey, Red Bull Student Marketeers):
// a clear promise, concrete perks, what you do, a semester, and one button to apply.

/** For now only Rotterdam; add cities here when the programme grows. */
export const AMBASSADOR_CITIES = ["Rotterdam"] as const;
export const AMBASSADOR_ROLES = ["fill", "host", "build"] as const;
export type AmbassadorRole = (typeof AMBASSADOR_ROLES)[number];

type Item = { title: string; body: string };

export type AmbassadorCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  cta: string;
  facts: string[];
  imageAlt: string;
  perksTitle: string;
  perksIntro: string;
  perks: Item[];
  rolesTitle: string;
  rolesIntro: string;
  roles: Record<AmbassadorRole, Item>;
  semesterTitle: string;
  semester: Item[];
  whoTitle: string;
  who: string[];
  stepsTitle: string;
  steps: Item[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  closingTitle: string;
  closingBody: string;
  apply: {
    metaTitle: string;
    eyebrow: string;
    title: string;
    intro: string;
    back: string;
  };
  form: {
    sectionYou: string;
    sectionStudy: string;
    sectionWhy: string;
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
    doneBack: string;
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
  metaTitle: "MyTable Ambassadors Rotterdam | Bouw de Rotterdamse zondag",
  metaDescription:
    "Word MyTable Ambassador in Rotterdam, naast je studie. Zet de Sunday Socials in Rotterdam neer, doe echte ervaring op in events en marketing, en schuif zelf gratis aan.",
  eyebrow: "MyTable Ambassadors · Rotterdam",
  title: "Bouw de zondagmiddag van Rotterdam",
  intro:
    "Als MyTable Ambassador zet je samen met ons de Sunday Socials in Rotterdam neer. Je doet echte ervaring op in events, marketing en community, gewoon naast je studie.",
  cta: "Solliciteer als ambassador",
  facts: ["Rotterdam", "Een semester", "Een paar uur per maand"],
  imageAlt: "Een groep aan tafel in een wijnbar, glas in de hand, in gesprek",
  perksTitle: "Waarom ambassador",
  perksIntro: "Je krijgt er meer voor terug dan een regel op je cv.",
  perks: [
    { title: "Echte ervaring", body: "Je organiseert, promoot en host zelf. Geen meeloopstage, maar resultaat dat je kunt laten zien." },
    { title: "Jouw Rotterdam", body: "Jij bepaalt mee welke Rotterdamse wijnbars we kiezen en hoe de middagen eruitzien." },
    { title: "Gratis aan tafel", body: "Je schuift zelf aan bij de edities, wijn inbegrepen." },
    { title: "Een netwerk dat blijft", body: "Je werkt met Rotterdamse wijnbars, met de oprichters en met de andere ambassadors." },
    { title: "Een team om op te proosten", body: "Teamborrels, en een uitje als we samen een mijlpaal halen." },
    { title: "Sterk op je cv", body: "Een officiële titel, en een aanbeveling op LinkedIn als je semester erop zit." },
  ],
  rolesTitle: "Wat je doet",
  rolesIntro: "Kies wat bij je past. Je hoeft niet alles te doen.",
  roles: {
    fill: { title: "Vullen", body: "Je maakt Rotterdam enthousiast, via je netwerk, je vereniging en je socials." },
    host: { title: "Hosten", body: "Op zondag ontvang je de gasten en zorg je dat iedereen zich snel thuis voelt." },
    build: { title: "Bouwen", body: "Je scout nieuwe wijnbars en denkt mee over wat we hierna doen." },
  },
  semesterTitle: "Zo ziet een semester eruit",
  semester: [
    { title: "Kick-off", body: "Je leert het team en de aanpak kennen, en we maken samen een plan voor Rotterdam." },
    { title: "Zondagen neerzetten", body: "Je helpt de Rotterdamse edities vol te krijgen en bent erbij op de dag zelf." },
    { title: "Mijlpalen vieren", body: "Je eerste volle editie, drie op rij, een wachtlijst voor de volgende. Elke mijlpaal vieren we samen." },
  ],
  whoTitle: "Wie we zoeken",
  who: [
    "Je studeert en bent 18 jaar of ouder",
    "Je woont of studeert in Rotterdam",
    "Je brengt graag mensen samen en voelt je thuis in een volle zaak",
    "Je hebt een paar uur per maand, en af en toe een zondagmiddag",
    "Wijnkennis is niet nodig. Nieuwsgierigheid wel",
  ],
  stepsTitle: "Zo solliciteer je",
  steps: [
    { title: "Solliciteer", body: "Vertel wie je bent en waarom je dit wilt. Het duurt een paar minuten." },
    { title: "Kennismaken", body: "We plannen een kort gesprek met je in." },
    { title: "Start", body: "Je begint aan je eerste semester, met het team om je heen." },
  ],
  faqTitle: "Veelgestelde vragen",
  faq: [
    { q: "Is het betaald?", a: "Nee. Je krijgt ervaring, gratis edities en een team om op te proosten. In het gesprek vertellen we je precies wat er bij jouw rol hoort." },
    { q: "Hoeveel tijd kost het?", a: "Een paar uur per maand, en af en toe een zondagmiddag. We plannen het rond je studie." },
    { q: "Moet ik verstand hebben van wijn?", a: "Nee. Het gaat om de mensen en de sfeer. De wijn kiezen we samen met de zaak." },
    { q: "Wat als ik tentamens heb?", a: "Laat het weten, dan neemt iemand anders uit het team het over." },
    { q: "Hoe lang doe ik het?", a: "Een semester. Daarna kijken we samen of je doorgaat." },
  ],
  closingTitle: "Klaar om Rotterdam aan tafel te krijgen?",
  closingBody: "Solliciteer in een paar minuten. We nemen snel contact met je op.",
  apply: {
    metaTitle: "Solliciteer als MyTable Ambassador in Rotterdam",
    eyebrow: "MyTable Ambassadors",
    title: "Solliciteer als ambassador in Rotterdam",
    intro: "Een paar minuten. Daarna nemen we contact met je op voor een kennismaking.",
    back: "Terug naar het programma",
  },
  form: {
    sectionYou: "Over jou",
    sectionStudy: "Je studie",
    sectionWhy: "Waarom jij",
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
    privacy: "We gebruiken je gegevens alleen voor je sollicitatie.",
    submit: "Verstuur sollicitatie",
    sending: "Bezig met versturen",
    doneTitle: "Dank je wel",
    doneBody: "We hebben je sollicitatie ontvangen en nemen snel contact met je op om een kennismaking te plannen.",
    doneBack: "Terug naar het programma",
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
  metaTitle: "MyTable Ambassadors Rotterdam | Build Rotterdam's Sunday",
  metaDescription:
    "Become a MyTable Ambassador in Rotterdam, alongside your studies. Build the Sunday Socials in Rotterdam, gain real experience in events and marketing, and join for free.",
  eyebrow: "MyTable Ambassadors · Rotterdam",
  title: "Build Rotterdam's Sunday afternoon",
  intro:
    "As a MyTable Ambassador, you build the Sunday Socials in Rotterdam together with us. You gain real experience in events, marketing and community, alongside your studies.",
  cta: "Apply to be an ambassador",
  facts: ["Rotterdam", "One semester", "A few hours a month"],
  imageAlt: "A group at a table in a wine bar, glass in hand, talking",
  perksTitle: "Why become an ambassador",
  perksIntro: "You get more out of it than a line on your CV.",
  perks: [
    { title: "Real experience", body: "You organise, promote and host yourself. Not shadowing, but results you can show." },
    { title: "Your Rotterdam", body: "You help choose Rotterdam's wine bars and shape the afternoons." },
    { title: "A seat for free", body: "You join the editions yourself, wine included." },
    { title: "A network that lasts", body: "You work with Rotterdam wine bars, with the founders and with the other ambassadors." },
    { title: "A team to toast with", body: "Team drinks, and an outing when we reach a milestone together." },
    { title: "Strong on your CV", body: "An official title, and a LinkedIn recommendation when your semester is done." },
  ],
  rolesTitle: "What you do",
  rolesIntro: "Pick what suits you. You don't have to do it all.",
  roles: {
    fill: { title: "Fill", body: "You get Rotterdam excited, through your network, your student association and your socials." },
    host: { title: "Host", body: "On Sunday you welcome the guests and make sure everyone feels at home quickly." },
    build: { title: "Build", body: "You scout new wine bars and help think about what we do next." },
  },
  semesterTitle: "What a semester looks like",
  semester: [
    { title: "Kick-off", body: "You get to know the team and the approach, and we make a plan for Rotterdam together." },
    { title: "Running Sundays", body: "You help fill the Rotterdam editions and you're there on the day." },
    { title: "Celebrating milestones", body: "Your first sold-out edition, three in a row, a waiting list for the next. We celebrate each one together." },
  ],
  whoTitle: "Who we're looking for",
  who: [
    "You're a student, 18 or older",
    "You live or study in Rotterdam",
    "You love bringing people together and feel at home in a busy room",
    "You have a few hours a month, and a Sunday afternoon now and then",
    "No wine knowledge needed. Curiosity is",
  ],
  stepsTitle: "How to apply",
  steps: [
    { title: "Apply", body: "Tell us who you are and why you'd like to do this. It takes a few minutes." },
    { title: "Meet us", body: "We plan a short call with you." },
    { title: "Start", body: "You begin your first semester, with the team around you." },
  ],
  faqTitle: "Frequently asked questions",
  faq: [
    { q: "Is it paid?", a: "No. You get experience, free editions and a team to toast with. In the call we tell you exactly what comes with your role." },
    { q: "How much time does it take?", a: "A few hours a month, and a Sunday afternoon now and then. We plan around your studies." },
    { q: "Do I need to know about wine?", a: "No. It's about the people and the atmosphere. We choose the wine together with the venue." },
    { q: "What if I have exams?", a: "Let us know, and someone else on the team takes over." },
    { q: "How long is it?", a: "One semester. After that, we decide together whether you continue." },
  ],
  closingTitle: "Ready to bring Rotterdam to the table?",
  closingBody: "Apply in a few minutes. We'll be in touch soon.",
  apply: {
    metaTitle: "Apply to be a MyTable Ambassador in Rotterdam",
    eyebrow: "MyTable Ambassadors",
    title: "Apply to be an ambassador in Rotterdam",
    intro: "A few minutes. We'll then get in touch to plan a call.",
    back: "Back to the programme",
  },
  form: {
    sectionYou: "About you",
    sectionStudy: "Your studies",
    sectionWhy: "Why you",
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
    doneBack: "Back to the programme",
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
