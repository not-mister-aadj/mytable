// /ambassadors (landing) and /ambassadors/aanmelden (form) copy, Dutch and English.
// Built like the big student programmes (Bumble Honey, Red Bull Student Marketeers):
// a clear promise, concrete perks, what you do, a path to grow, and one button to apply.

/** For now only Rotterdam; add cities here when the programme grows. */
export const AMBASSADOR_CITIES = ["Rotterdam"] as const;
/** The roles applicants can pick now (11 Nov 2026: two, "Verbinden" and "Content"). */
export const AMBASSADOR_ROLES = ["fill", "social"] as const;
/** Every role an application can carry: "host" and "build" were on the page
 * until 11 Nov 2026 and stay readable in the admin. */
export type AmbassadorRole = (typeof AMBASSADOR_ROLES)[number] | "host" | "build";

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
  semesterIntro: string;
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
    phoneHelp: string;
    city: string;
    cityPlaceholder: string;
    study: string;
    institution: string;
    studyYear: string;
    roles: string;
    rolesHelp: string;
    instagram: string;
    linkedin: string;
    optional: string;
    motivation: string;
    motivationHelp: string;
    motivationFile: string;
    motivationFileHelp: string;
    motivationText: string;
    motivationTextPlaceholder: string;
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
      study: string;
      motivation: string;
      file: string;
      fileSize: string;
      adult: string;
      roles: string;
      generic: string;
      tooMany: string;
    };
  };
};

const nl: AmbassadorCopy = {
  metaTitle: "MyTable Ambassadors Rotterdam | Organiseer de wijnavonden waar Rotterdam over praat",
  metaDescription:
    "Word MyTable Ambassador in Rotterdam, naast je studie. Organiseer wijnevenementen, van Sunday Socials tot een proeverij op een boot, en doe echte ervaring op.",
  eyebrow: "MyTable Ambassadors · Rotterdam",
  title: "Organiseer de wijnavonden waar Rotterdam over praat",
  intro:
    "Van Sunday Socials tot een proeverij op een boot. Jij bedenkt het, wij helpen je het neer te zetten. Gewoon naast je studie.",
  cta: "Solliciteer als ambassador",
  facts: ["Rotterdam", "Een paar uur per maand", "Vrij in tentamenperiodes"],
  imageAlt: "Een groep aan tafel in een wijnbar, glas in de hand, in gesprek",
  perksTitle: "Waarom ambassador",
  perksIntro: "Je krijgt er meer voor terug dan een regel op je cv.",
  perks: [
    { title: "Je eigen event", body: "Een idee of een bijzondere plek? Dan zetten we het samen neer." },
    { title: "Wijn van ons", body: "Je schuift gratis aan bij de evenementen, wijn inbegrepen." },
    { title: "Een team en een netwerk", body: "Teamborrels, wijnbars, wijnmakers en de oprichters." },
    { title: "Sterk op je cv", body: "Echte resultaten, een officiële titel en een aanbeveling op LinkedIn." },
  ],
  rolesTitle: "Wat je doet",
  rolesIntro: "Kies wat bij je past. Eén rol is genoeg, allebei mag ook.",
  roles: {
    fill: { title: "Verbinden", body: "Je zorgt dat de evenementen vol zitten via studieverenigingen, sportclubs en je eigen netwerk. Ken je een plek die bij ons past? Dan leg jij het eerste contact." },
    host: { title: "Ontvangen", body: "Je heet de gasten welkom en zorgt voor een goede start. Daarna neemt de sommelier het over." },
    build: { title: "Bedenken", body: "Je verzint nieuwe formats en zet ze mee neer. Een proeverij op het water, een wijnkelder, een plek die nog niemand kent." },
    social: { title: "Content", body: "Je maakt foto's en korte video's op de avond, en laat Rotterdam op Instagram en TikTok zien wat ze missen." },
  },
  semesterTitle: "Zo groei je bij MyTable",
  semesterIntro: "Iedereen begint als Ambassador. Laat je zien wat je kunt, dan groei je door.",
  semester: [
    { title: "Ambassador", body: "Hier begin je. Je leert het team kennen en schuift gratis aan bij de evenementen, wijn inbegrepen." },
    { title: "Senior Ambassador", body: "Je volgende stap. Je verdient per ticket dat via jou verkocht wordt en per eigen event dat je neerzet, en je sluit samen met ons samenwerkingen met nieuwe zaken." },
    { title: "City Lead Rotterdam", body: "De laatste stap: een betaalde rol in ons team. Je beheert de zaken in Rotterdam." },
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
    { title: "Kennismaken", body: "We sturen je een WhatsApp-bericht en leren je kennen." },
    { title: "Start", body: "Je begint aan je eerste semester, met het team om je heen." },
  ],
  faqTitle: "Veelgestelde vragen",
  faq: [
    {
      q: "Is het betaald?",
      a: "Je begint onbetaald, met gratis evenementen en echte ervaring. Laat je zien wat je kunt, dan verdien je commissie per ticket en per eigen event. De beste ambassadors groeien door naar een betaalde rol in ons team.",
    },
    { q: "Hoeveel tijd kost het?", a: "Een paar uur per maand, en af en toe een avond of zondagmiddag. Op die avond zelf geniet je vooral mee." },
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
    intro: "Een paar minuten. Daarna sturen we je een WhatsApp-bericht om kennis te maken.",
    back: "Terug naar het programma",
  },
  form: {
    sectionYou: "Over jou",
    sectionStudy: "Je studie",
    sectionWhy: "Waarom jij",
    name: "Naam",
    email: "E-mail",
    phone: "Telefoonnummer",
    phoneHelp: "We nemen contact met je op via WhatsApp.",
    city: "Stad",
    cityPlaceholder: "Kies je stad",
    study: "Studie",
    institution: "Universiteit of hogeschool",
    studyYear: "Studiejaar",
    roles: "Welke rol spreekt je aan?",
    rolesHelp: "Kies er één of allebei.",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    optional: "optioneel",
    motivation: "Je motivatie",
    motivationHelp: "Upload een document, of schrijf het hieronder. Eén van de twee is genoeg.",
    motivationFile: "Document",
    motivationFileHelp: "PDF, maximaal 5 MB",
    motivationText: "Of schrijf het hier",
    motivationTextPlaceholder: "Wie ben je, en waarom wil je dit doen? Heb je al een idee voor een event? Vertel het ons.",
    heardFrom: "Hoe heb je ons gevonden?",
    adult: "Ik ben 18 jaar of ouder",
    privacy: "We gebruiken je gegevens alleen voor je sollicitatie.",
    submit: "Verstuur sollicitatie",
    sending: "Bezig met versturen",
    doneTitle: "Dank je wel",
    doneBody: "We hebben je sollicitatie ontvangen en sturen je snel een WhatsApp-bericht om kennis te maken.",
    doneBack: "Terug naar het programma",
    errors: {
      required: "Vul je naam, e-mail en telefoonnummer in.",
      study: "Vul je studie, universiteit of hogeschool en studiejaar in.",
      motivation: "Upload een document of schrijf je motivatie.",
      file: "Upload een PDF.",
      fileSize: "Je document is te groot. Maximaal 5 MB.",
      adult: "Je moet 18 jaar of ouder zijn.",
      roles: "Kies minstens één rol.",
      generic: "Dat lukte niet. Probeer het later opnieuw, of mail ons op info@mytable.club.",
      tooMany: "Te veel pogingen. Probeer het over een minuut opnieuw.",
    },
  },
};

const en: AmbassadorCopy = {
  metaTitle: "MyTable Ambassadors Rotterdam | Run the wine nights Rotterdam talks about",
  metaDescription:
    "Become a MyTable Ambassador in Rotterdam, alongside your studies. Organise wine events, from Sunday Socials to a tasting on a boat, and gain real experience.",
  eyebrow: "MyTable Ambassadors · Rotterdam",
  title: "Run the wine nights Rotterdam talks about",
  intro:
    "From Sunday Socials to a tasting on a boat. You come up with it, we help you make it happen. Alongside your studies.",
  cta: "Apply to be an ambassador",
  facts: ["Rotterdam", "A few hours a month", "Free during exam periods"],
  imageAlt: "A group at a table in a wine bar, glass in hand, talking",
  perksTitle: "Why become an ambassador",
  perksIntro: "You get more out of it than a line on your CV.",
  perks: [
    { title: "Your own event", body: "Got an idea or a special place? We make it happen together." },
    { title: "Wine on us", body: "You join the events for free, wine included." },
    { title: "A team and a network", body: "Team drinks, wine bars, winemakers and the founders." },
    { title: "Strong on your CV", body: "Real results, an official title and a LinkedIn recommendation." },
  ],
  rolesTitle: "What you do",
  rolesIntro: "Pick what suits you. One role is enough, both is welcome.",
  roles: {
    fill: { title: "Connect", body: "You make sure the events fill up through student associations, sports clubs and your own network. Know a place that suits us? Then you make the first contact." },
    host: { title: "Welcome", body: "You greet the guests and get things off to a good start. Then the sommelier takes over." },
    build: { title: "Create", body: "You come up with new formats and help run them. A tasting on the water, a wine cellar, a place nobody knows yet." },
    social: { title: "Content", body: "You shoot photos and short videos on the night, and show Rotterdam on Instagram and TikTok what they're missing." },
  },
  semesterTitle: "How you grow with MyTable",
  semesterIntro: "Everyone starts as an Ambassador. Show what you can do, and you grow from there.",
  semester: [
    { title: "Ambassador", body: "This is where you start. You get to know the team and join the events for free, wine included." },
    { title: "Senior Ambassador", body: "Your next step. You earn for every ticket sold through you and for every event of your own you run, and you close partnerships with new venues, together with us." },
    { title: "City Lead Rotterdam", body: "The last step: a paid role on our team. You run the venues in Rotterdam." },
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
    { title: "Meet us", body: "We send you a WhatsApp message and get to know you." },
    { title: "Start", body: "You begin your first semester, with the team around you." },
  ],
  faqTitle: "Frequently asked questions",
  faq: [
    {
      q: "Is it paid?",
      a: "You start unpaid, with free events and real experience. Show what you can do, and you earn commission per ticket and per event of your own. The best ambassadors grow into a paid role on our team.",
    },
    { q: "How much time does it take?", a: "A few hours a month, and an evening or Sunday afternoon now and then. On the night itself, you mostly get to enjoy it." },
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
    intro: "A few minutes. We'll then send you a WhatsApp message to get to know you.",
    back: "Back to the programme",
  },
  form: {
    sectionYou: "About you",
    sectionStudy: "Your studies",
    sectionWhy: "Why you",
    name: "Name",
    email: "Email",
    phone: "Phone number",
    phoneHelp: "We'll get in touch via WhatsApp.",
    city: "City",
    cityPlaceholder: "Choose your city",
    study: "Study programme",
    institution: "University",
    studyYear: "Year of study",
    roles: "Which role appeals to you?",
    rolesHelp: "Pick one or both.",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    optional: "optional",
    motivation: "Your motivation",
    motivationHelp: "Upload a document, or write it below. One of the two is enough.",
    motivationFile: "Document",
    motivationFileHelp: "PDF, up to 5 MB",
    motivationText: "Or write it here",
    motivationTextPlaceholder: "Who are you, and why would you like to do this? Already have an idea for an event? Tell us.",
    heardFrom: "How did you find us?",
    adult: "I'm 18 or older",
    privacy: "We only use your details for your application.",
    submit: "Send application",
    sending: "Sending",
    doneTitle: "Thank you",
    doneBody: "We've received your application and will send you a WhatsApp message soon to get to know you.",
    doneBack: "Back to the programme",
    errors: {
      required: "Fill in your name, email and phone number.",
      study: "Fill in your study programme, university and year of study.",
      motivation: "Upload a document or write your motivation.",
      file: "Upload a PDF.",
      fileSize: "Your document is too large. Up to 5 MB.",
      adult: "You need to be 18 or older.",
      roles: "Pick at least one role.",
      generic: "That didn't work. Please try again later, or email us at info@mytable.club.",
      tooMany: "Too many attempts. Try again in a minute.",
    },
  },
};

export function ambassadorCopy(locale: string): AmbassadorCopy {
  return locale === "en" ? en : nl;
}
