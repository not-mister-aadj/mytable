// /ambassadors (landing) and /ambassadors/aanmelden (form) copy, Dutch and English.
// Built like the big student programmes (Bumble Honey, Red Bull Student Marketeers):
// a clear promise, concrete perks, what you do, a path to grow, and one button to apply.

/** For now only Rotterdam; add cities here when the programme grows. */
export const AMBASSADOR_CITIES = ["Rotterdam"] as const;
/** "build" is shown as Bedenken (new formats), "taste" as Proeven (hidden guest). */
export const AMBASSADOR_ROLES = ["fill", "host", "build", "taste"] as const;
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
  metaTitle: "MyTable Ambassadors Rotterdam | Maak van Rotterdam een wijnstad",
  metaDescription:
    "Word MyTable Ambassador in Rotterdam, naast je studie. Organiseer wijnevenementen, van onze Sunday Socials tot een proeverij op een boot, en doe echte ervaring op.",
  eyebrow: "MyTable Ambassadors · Rotterdam",
  title: "Maak van Rotterdam een wijnstad",
  intro:
    "Als MyTable Ambassador organiseer je wijnevenementen in Rotterdam. Van onze Sunday Socials tot nieuwe ideeën: een proeverij op een boot, een avond bij een wijnmaker in de kelder. Gewoon naast je studie.",
  cta: "Solliciteer als ambassador",
  facts: ["Rotterdam", "Een paar uur per maand", "Vrij in tentamenperiodes"],
  imageAlt: "Een groep aan tafel in een wijnbar, glas in de hand, in gesprek",
  perksTitle: "Waarom ambassador",
  perksIntro: "Je krijgt er meer voor terug dan een regel op je cv.",
  perks: [
    { title: "Echte ervaring", body: "Je organiseert, promoot en host zelf. Geen meeloopstage, maar resultaat dat je kunt laten zien." },
    { title: "Je eigen event", body: "Heb je een idee, een bijzondere plek of een wijnmaker die je kent? Dan zetten we het samen neer." },
    { title: "Gratis aan tafel", body: "Je schuift zelf aan bij de evenementen, wijn inbegrepen." },
    { title: "Een netwerk dat blijft", body: "Je werkt met Rotterdamse wijnbars, wijnmakers, de oprichters en de andere ambassadors." },
    { title: "Een team om op te proosten", body: "Teamborrels, en elke maand zetten we de Ambassador van de maand in het zonnetje." },
    { title: "Sterk op je cv", body: "Een officiële titel, en een aanbeveling op LinkedIn als je semester erop zit." },
  ],
  rolesTitle: "Wat je doet",
  rolesIntro: "Kies wat bij je past. Je hoeft niet alles te doen.",
  roles: {
    fill: { title: "Vullen", body: "Je maakt Rotterdam enthousiast, via je netwerk, je vereniging en je socials." },
    host: { title: "Hosten", body: "Op de dag zelf ontvang je de gasten en zorg je dat iedereen zich snel thuis voelt." },
    build: { title: "Bedenken", body: "Je verzint nieuwe formats en zet ze mee neer. Een proeverij op het water, een wijnkelder, een plek die nog niemand kent." },
    taste: { title: "Proeven", body: "Je schuift aan als gewone gast en vertelt ons daarna eerlijk hoe het was." },
  },
  semesterTitle: "Zo groei je bij MyTable",
  semester: [
    { title: "Kick-off", body: "Je leert het team en de aanpak kennen, en we maken samen een plan voor Rotterdam." },
    { title: "Evenementen neerzetten", body: "Je helpt de Rotterdamse evenementen vol te krijgen en bent erbij op de dag zelf." },
    { title: "Je eigen event", body: "Je bedenkt een eigen format en zet het met ons neer, van idee tot volle zaal." },
    { title: "Doorgroeien", body: "Vind je het leuk en blink je uit? Dan kun je doorgroeien naar een betaalde rol in ons team." },
  ],
  whoTitle: "Wie we zoeken",
  who: [
    "Je studeert in Rotterdam en bent 18 jaar of ouder",
    "Je bent nieuwsgierig en brengt graag mensen samen",
    "Je bent eerlijk en benaderbaar, en je voelt je thuis in een volle zaak",
    "Je weet wat van wijn of wilt het graag leren, maar snobistisch ben je nooit",
    "Je hebt een paar uur per maand, en af en toe een avond of zondagmiddag",
  ],
  stepsTitle: "Zo solliciteer je",
  steps: [
    { title: "Solliciteer", body: "Vertel wie je bent en waarom je dit wilt. Het duurt een paar minuten." },
    { title: "Kennismaken", body: "We plannen een kort gesprek met je in." },
    { title: "Start", body: "Je begint aan je eerste semester, met het team om je heen." },
  ],
  faqTitle: "Veelgestelde vragen",
  faq: [
    {
      q: "Is het betaald?",
      a: "Het ambassadorschap is onbetaald. Je krijgt ervaring, gratis evenementen en een team om op te proosten. Vind je het leuk en blink je uit, dan kun je doorgroeien naar een betaalde rol.",
    },
    { q: "Hoeveel tijd kost het?", a: "Een paar uur per maand, en af en toe een avond of zondagmiddag. We plannen het rond je studie." },
    { q: "En in mijn tentamenperiode?", a: "Dan organiseren we geen evenementen. Je hebt gewoon vrij." },
    { q: "Moet ik verstand hebben van wijn?", a: "Nee. Nieuwsgierigheid is genoeg. De rest leer je onderweg, van ons en van de wijnmakers." },
    { q: "Hoe lang doe ik het?", a: "We beginnen met een semester. Daarna kijken we samen hoe je verder wilt." },
  ],
  closingTitle: "Klaar om Rotterdam aan de wijn te krijgen?",
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
    motivationTextPlaceholder: "Wie ben je, en waarom wil je dit doen? Heb je al een idee voor een event? Vertel het ons.",
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
      required: "Vul je naam en e-mail in.",
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
  metaTitle: "MyTable Ambassadors Rotterdam | Make Rotterdam a wine city",
  metaDescription:
    "Become a MyTable Ambassador in Rotterdam, alongside your studies. Organise wine events, from our Sunday Socials to a tasting on a boat, and gain real experience.",
  eyebrow: "MyTable Ambassadors · Rotterdam",
  title: "Make Rotterdam a wine city",
  intro:
    "As a MyTable Ambassador, you organise wine events in Rotterdam. From our Sunday Socials to new ideas: a tasting on a boat, an evening with a winemaker in the cellar. Alongside your studies.",
  cta: "Apply to be an ambassador",
  facts: ["Rotterdam", "A few hours a month", "Free during exam periods"],
  imageAlt: "A group at a table in a wine bar, glass in hand, talking",
  perksTitle: "Why become an ambassador",
  perksIntro: "You get more out of it than a line on your CV.",
  perks: [
    { title: "Real experience", body: "You organise, promote and host yourself. Not shadowing, but results you can show." },
    { title: "Your own event", body: "Got an idea, a special place or a winemaker you know? We'll make it happen together." },
    { title: "A seat for free", body: "You join the events yourself, wine included." },
    { title: "A network that lasts", body: "You work with Rotterdam wine bars, winemakers, the founders and the other ambassadors." },
    { title: "A team to toast with", body: "Team drinks, and every month we put the Ambassador of the Month in the spotlight." },
    { title: "Strong on your CV", body: "An official title, and a LinkedIn recommendation when your semester is done." },
  ],
  rolesTitle: "What you do",
  rolesIntro: "Pick what suits you. You don't have to do it all.",
  roles: {
    fill: { title: "Fill", body: "You get Rotterdam excited, through your network, your student association and your socials." },
    host: { title: "Host", body: "On the day you welcome the guests and make sure everyone feels at home quickly." },
    build: { title: "Create", body: "You come up with new formats and help run them. A tasting on the water, a wine cellar, a place nobody knows yet." },
    taste: { title: "Taste", body: "You join as a regular guest and tell us honestly how it was." },
  },
  semesterTitle: "How you grow with MyTable",
  semester: [
    { title: "Kick-off", body: "You get to know the team and the approach, and we make a plan for Rotterdam together." },
    { title: "Running events", body: "You help fill the Rotterdam events and you're there on the day." },
    { title: "Your own event", body: "You come up with your own format and run it with us, from idea to full room." },
    { title: "Growing further", body: "Enjoying it and doing great? Then you can grow into a paid role on our team." },
  ],
  whoTitle: "Who we're looking for",
  who: [
    "You study in Rotterdam and you're 18 or older",
    "You're curious and love bringing people together",
    "You're honest and approachable, and feel at home in a busy room",
    "You know a bit about wine or want to learn, but you're never a snob",
    "You have a few hours a month, and an evening or Sunday afternoon now and then",
  ],
  stepsTitle: "How to apply",
  steps: [
    { title: "Apply", body: "Tell us who you are and why you'd like to do this. It takes a few minutes." },
    { title: "Meet us", body: "We plan a short call with you." },
    { title: "Start", body: "You begin your first semester, with the team around you." },
  ],
  faqTitle: "Frequently asked questions",
  faq: [
    {
      q: "Is it paid?",
      a: "Being an ambassador is unpaid. You get experience, free events and a team to toast with. Enjoying it and doing great? Then you can grow into a paid role.",
    },
    { q: "How much time does it take?", a: "A few hours a month, and an evening or Sunday afternoon now and then. We plan around your studies." },
    { q: "What about my exam period?", a: "We don't organise events then. You simply have time off." },
    { q: "Do I need to know about wine?", a: "No. Curiosity is enough. You'll learn the rest along the way, from us and from the winemakers." },
    { q: "How long is it?", a: "We start with one semester. After that, we look together at how you'd like to continue." },
  ],
  closingTitle: "Ready to get Rotterdam into wine?",
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
    motivationTextPlaceholder: "Who are you, and why would you like to do this? Already have an idea for an event? Tell us.",
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
      required: "Fill in your name and email.",
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
