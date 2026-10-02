// All "Jouw tafel" copy, Dutch and English: the landing page and the
// account screens behind its buttons (sign up, log in, welcome). House
// rules: short, calm and warm, no em dashes, no exclamation marks, no
// emojis. Never name a venue (the wine bar is booked once the tables are
// known) and never suggest a drink is included. No prices on the landing
// page for now: they are changing.

import type { Locale } from "@/i18n/config";

export type FaqItem = { q: string; a: string };

export type AuthCopy = {
  signUp: { metaTitle: string; title: string; sub: string; switchPrompt: string; switchLink: string };
  logIn: { metaTitle: string; title: string; sub: string; switchPrompt: string; switchLink: string };
  google: string;
  googleFailed: string;
  or: string;
  emailLabel: string;
  emailPlaceholder: string;
  sendCode: string;
  sending: string;
  errors: {
    emailEmpty: string;
    emailInvalid: string;
    unknownEmail: string;
    createAccount: string;
    rateLimited: string;
    generic: string;
  };
  /** "Door je aan te melden ga je akkoord met de [terms] en het [privacy]." */
  legal: {
    before: string;
    beforeLogIn: string;
    terms: string;
    between: string;
    privacy: string;
    after: string;
  };
  code: {
    title: string;
    body: (email: string) => string;
    label: string;
    confirm: string;
    verifying: string;
    wrong: string;
    incomplete: string;
    noCode: string;
    resend: string;
    resendIn: (seconds: number) => string;
    resent: string;
    otherEmail: string;
  };
  welcome: {
    metaTitle: string;
    title: string;
    created: string;
    signedIn: string;
    next: string;
    back: string;
  };
};

export type LandingCopy = {
  meta: { title: string; description: string };
  signUp: string;
  logIn: string;
  hero: {
    title: string;
    body: string;
    note: string;
    proof: (count: number, city: string | null) => string;
    imageAlt: string;
    locationAria: string;
  };
  /** Lines ordered by the cost per lead of the ad angle they come from
   * (Sept 2026): weekend angle (NL_07, about 3.60 per lead), wine-list angle
   * (NL_03, about 4.50), then the untested one. */
  herkenning: { title: string; lines: string[]; closing: string };
  howItWorks: {
    eyebrow: string;
    title: string;
    steps: Array<{ title: string; body: string }>;
    reassurance: string;
    imageAlt: string;
  };
  tables: {
    eyebrow: string;
    title: (city: string | null) => string;
    cityTabsAria: string;
    comingSoon: string;
    /** Shown instead of a spot count while the count would say little. */
    open: string;
    englishOpen: string;
    dutchOnly: string | null;
    where: (city: string) => string;
    empty: (city: string) => string;
  };
  testimonials: { eyebrow: string; title: string; imageAlt: string };
  promise: { eyebrow: string; title: string; items: Array<{ title: string; body: string }> };
  faq: { eyebrow: string; title: string; items: FaqItem[] };
  closing: { title: string; note: string };
  footer: { terms: string; privacy: string };
  /** Account screens behind "Aanmelden" and "Inloggen", and the welcome
   * page after them. */
  auth: AuthCopy;
};

// ---------------------------------------------------------------------------
// Dutch
// ---------------------------------------------------------------------------

const landingNl: LandingCopy = {
  meta: {
    title: "Jouw zondag | MyTable",
    description:
      "Elke maand schuif je in jouw stad aan bij een tafel van 4 tot 6 mensen in een goede wijnbar.",
  },
  signUp: "Aanmelden",
  logIn: "Inloggen",
  hero: {
    title: "Een goede wijnbar. Een gezellige tafel. Jouw zondag.",
    body: "Elke maand een tafel van 4 tot 6 mensen in een goede wijnbar in jouw stad. Wij regelen alles, jij schuift aan.",
    note: "Aanmelden duurt een minuut. Daarna kies je je zondag.",
    proof: (count, city) =>
      city ? `Al ${count}+ mensen uit ${city} staan op de lijst` : `Al ${count}+ mensen staan op de lijst`,
    imageAlt: "Een volle tafel heft het glas tijdens een MyTable wijnmiddag",
    locationAria: "Jouw stad",
  },
  herkenning: {
    title: "Herken je jezelf?",
    lines: [
      "Je zondagmiddag mag best wat gezelliger.",
      "Je houdt van een lekker glas wijn.",
      "Je hebt zin in een goed gesprek, zonder dat je eerst iets hoeft te plannen.",
    ],
    closing: "Dan hoor je aan onze tafel.",
  },
  howItWorks: {
    eyebrow: "Zo werkt het",
    title: "Drie stappen naar jouw zondag",
    steps: [
      {
        title: "Kies je zondag.",
        body: "Elke maand een vaste datum in jouw stad, met een tafel voor jouw leeftijd.",
      },
      {
        title: "Wij kiezen de wijnbar.",
        body: "Zodra we weten met hoeveel jullie zijn, boeken we een plek die bij jullie tafel past. Een week van tevoren hoor je waar.",
      },
      {
        title: "Schuif aan.",
        body: "Om 14:00 neem je plaats. Kies een glas van de kaart, of een van onze aanraders. Je drankjes bestel je zelf.",
      },
    ],
    reassurance: "Het enige wat jij nog hoeft te doen: aanschuiven.",
    imageAlt: "Gesprek en gelach aan tafel, met wijnglazen op tafel",
  },
  tables: {
    eyebrow: "Sunday Table",
    title: (city) => (city ? `Eerstvolgende tafels in ${city}` : "Eerstvolgende tafels"),
    cityTabsAria: "Kies een stad",
    comingSoon: "Binnenkort",
    open: "Plekken vrij",
    englishOpen: "Ook Engels",
    dutchOnly: null,
    where: (city) => `In een wijnbar in ${city}. Een week van tevoren hoor je waar.`,
    empty: (city) =>
      `Nog geen tafel in ${city}. Meld je aan, dan hoor je het als eerste zodra er een is.`,
  },
  testimonials: {
    eyebrow: "Aan tafel",
    title: "Wat gasten zeggen",
    imageAlt: "Twee gasten lachen aan een tafel vol wijnglazen",
  },
  promise: {
    eyebrow: "Onze belofte",
    title: "Zonder zorgen aanschuiven",
    items: [
      {
        title: "Gratis verzetten",
        body: "Past de datum toch niet? Tot 7 dagen van tevoren kies je kosteloos een andere zondag.",
      },
      {
        title: "Een week vooraf zekerheid",
        body: "Dan hoor je waar je zit en dat je tafel doorgaat. Gaat hij niet door, dan krijg je je geld automatisch terug.",
      },
      {
        title: "Niet gezellig? Volgende op ons.",
        body: "Vond je je tafel niet leuk? Laat het ons binnen 2 dagen weten, dan is je volgende Sunday Table gratis.",
      },
    ],
  },
  faq: {
    eyebrow: "Goed om te weten",
    title: "Veelgestelde vragen",
    items: [
      {
        q: "Ik ken er niemand. Is dat raar?",
        a: "Helemaal niet. De meeste gasten komen alleen, dus je bent zeker niet de enige. Iedereen komt voor hetzelfde: een gezellige middag met een goed glas wijn. Het gesprek komt meestal vanzelf op gang.",
      },
      {
        q: "Mag ik iemand meenemen?",
        a: "Natuurlijk. Neem gerust een vriend of vriendin, je partner of iemand anders mee. Je boekt dan twee plekken en jullie zitten samen aan dezelfde tafel.",
      },
      {
        q: "Zit er drinken bij?",
        a: "Nee, je drankjes zijn niet inbegrepen. Aan tafel bestel je zelf wat je wilt drinken en dat reken je ook zelf af bij de wijnbar. Weet je niet goed wat je moet kiezen? Dan helpen onze wijnaanraders je op weg.",
      },
      {
        q: "Waar is het?",
        a: "Altijd in een goede wijnbar in jouw stad. Welke zaak het wordt, kiezen we zodra we weten met hoeveel jullie zijn, zodat de plek goed bij jullie tafel past. Een week van tevoren krijg je het adres in je mail.",
      },
      {
        q: "Gaat het altijd door?",
        a: "Een tafel gaat door vanaf 4 gasten. Een week van tevoren laten we je weten of dat gelukt is. Lukt het niet, dan krijg je je geld automatisch terug en stellen we je een andere datum voor.",
      },
      {
        q: "Kan ik mijn datum wijzigen?",
        a: "Ja. Tot 7 dagen voor je tafel kies je kosteloos een andere zondag: laat het ons weten en we zetten je over. Daarna kan het niet meer, omdat we dan de wijnbar voor jullie tafel reserveren.",
      },
      {
        q: "Wat als ik het niet gezellig vond?",
        a: "Dat horen we graag van je. Laat het ons binnen 2 dagen na je tafel weten, dan is je volgende Sunday Table op ons. Zo kun je het nog een keer proberen, aan een andere tafel.",
      },
      {
        q: "Is het een datingevent?",
        a: "Nee. Sunday Table is een gezellige middag aan tafel, met goede wijn en goede gesprekken. Er zitten mannen en vrouwen aan tafel, en iedereen komt voor de gezelligheid.",
      },
      {
        q: "In welke taal?",
        a: "Meestal in het Nederlands. Bij sommige tafels is Engels ook welkom; dat zie je bij de datum staan. Zo weet je van tevoren wat je kunt verwachten.",
      },
    ],
  },
  closing: {
    title: "Zin in een gezellige zondag?",
    note: "Aanmelden duurt een minuut. Daarna kies je je zondag.",
  },
  footer: { terms: "Algemene voorwaarden", privacy: "Privacy" },
  auth: {
    signUp: {
      metaTitle: "Aanmelden | MyTable",
      title: "Maak je account",
      sub: "Met je e-mailadres, zonder wachtwoord. Daarna kies je je zondag.",
      switchPrompt: "Heb je al een account?",
      switchLink: "Inloggen",
    },
    logIn: {
      metaTitle: "Inloggen | MyTable",
      title: "Welkom terug",
      sub: "Log in met je e-mailadres, zonder wachtwoord.",
      switchPrompt: "Nog geen account?",
      switchLink: "Maak een account",
    },
    google: "Doorgaan met Google",
    googleFailed: "Inloggen met Google lukte niet. Probeer het opnieuw of gebruik je e-mailadres.",
    or: "of",
    emailLabel: "E-mailadres",
    emailPlaceholder: "naam@voorbeeld.nl",
    sendCode: "Stuur mij een code",
    sending: "Code wordt verstuurd",
    errors: {
      emailEmpty: "Vul je e-mailadres in.",
      emailInvalid: "Dit e-mailadres lijkt niet te kloppen. Kijk het nog even na.",
      unknownEmail: "We kennen dit e-mailadres nog niet.",
      createAccount: "Maak een account",
      rateLimited: "Er zijn net een paar codes verstuurd. Wacht even en probeer het dan opnieuw.",
      generic: "Dat lukte even niet. Probeer het opnieuw.",
    },
    legal: {
      before: "Door je aan te melden ga je akkoord met de ",
      beforeLogIn: "Door in te loggen ga je akkoord met de ",
      terms: "algemene voorwaarden",
      between: " en het ",
      privacy: "privacybeleid",
      after: ".",
    },
    code: {
      title: "Check je mail",
      body: (email) => `We hebben een code van 6 cijfers gestuurd naar ${email}.`,
      label: "Code van 6 cijfers",
      confirm: "Bevestig",
      verifying: "Even controleren",
      wrong: "Deze code klopt niet of is verlopen. Probeer het opnieuw of vraag een nieuwe code aan.",
      incomplete: "Vul alle 6 cijfers in.",
      noCode: "Geen code ontvangen? Kijk ook even in je spam of reclame.",
      resend: "Stuur opnieuw",
      resendIn: (seconds) => `Stuur opnieuw (${seconds} s)`,
      resent: "We hebben je een nieuwe code gestuurd.",
      otherEmail: "Ander e-mailadres",
    },
    welcome: {
      metaTitle: "Welkom | MyTable",
      title: "Welkom bij MyTable",
      created: "Je account is aangemaakt.",
      signedIn: "Je bent ingelogd.",
      next: "Binnenkort kies je hier je zondag.",
      back: "Terug naar de tafels",
    },
  },
};

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const landingEn: LandingCopy = {
  meta: {
    title: "Your Sunday | MyTable",
    description:
      "Every month, join a table of 4 to 6 people in a good wine bar in your city.",
  },
  signUp: "Sign up",
  logIn: "Log in",
  hero: {
    title: "A good wine bar. A convivial table. Your Sunday.",
    body: "Every month, a table of 4 to 6 people in a good wine bar in your city. We arrange everything, you take your seat.",
    note: "Signing up takes a minute. Then you choose your Sunday.",
    proof: (count, city) =>
      city ? `${count}+ people from ${city} are already on the list` : `${count}+ people are already on the list`,
    imageAlt: "A full table raises a glass during a MyTable wine afternoon",
    locationAria: "Your city",
  },
  herkenning: {
    title: "Sound familiar?",
    lines: [
      "Your Sunday afternoon could be a little cosier.",
      "You love a good glass of wine.",
      "You'd like a good conversation, without having to plan anything first.",
    ],
    closing: "Then you belong at our table.",
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "Three steps to your Sunday",
    steps: [
      {
        title: "Choose your Sunday.",
        body: "A fixed date in your city every month, with a table for your age.",
      },
      {
        title: "We choose the wine bar.",
        body: "Once we know how many of you there are, we book a place that suits your table. You'll hear where a week ahead.",
      },
      {
        title: "Take your seat.",
        body: "At 2:00 PM you sit down. Choose a glass from the list, or one of our recommendations. You order your own drinks.",
      },
    ],
    reassurance: "All you need to do is take your seat.",
    imageAlt: "Conversation and laughter at a table with wine glasses",
  },
  tables: {
    eyebrow: "Sunday Table",
    title: (city) => (city ? `Upcoming tables in ${city}` : "Upcoming tables"),
    cityTabsAria: "Choose a city",
    comingSoon: "Coming soon",
    open: "Seats available",
    englishOpen: "English welcome",
    dutchOnly: "In Dutch",
    where: (city) => `In a wine bar in ${city}. You'll hear where a week ahead.`,
    empty: (city) =>
      `No table in ${city} yet. Sign up and you'll be the first to hear when there is one.`,
  },
  testimonials: {
    eyebrow: "At the table",
    title: "What guests say",
    imageAlt: "Two guests laughing at a table full of wine glasses",
  },
  promise: {
    eyebrow: "Our promise",
    title: "Join without worries",
    items: [
      {
        title: "Free to reschedule",
        body: "Date does not suit you after all? Up to 7 days before, you choose another Sunday at no cost.",
      },
      {
        title: "Certainty a week ahead",
        body: "That is when you hear where you will sit and that your table is going ahead. If it is not, you automatically get your money back.",
      },
      {
        title: "Not your kind of table? The next one is on us.",
        body: "Did not enjoy your table? Let us know within 2 days and your next Sunday Table is free.",
      },
    ],
  },
  faq: {
    eyebrow: "Good to know",
    title: "Questions",
    items: [
      {
        q: "I won't know anyone. Is that strange?",
        a: "Not at all. Most guests come alone, so you certainly won't be the only one. Everyone comes for the same thing: a convivial afternoon with a good glass of wine. The conversation usually gets going by itself.",
      },
      {
        q: "Can I bring someone?",
        a: "Of course. Feel free to bring a friend, your partner or anyone else. You book two seats and you'll sit together at the same table.",
      },
      {
        q: "Are drinks included?",
        a: "No, drinks are not included. At the table you order whatever you'd like to drink and you pay for it yourself at the wine bar. Not sure what to choose? Our wine recommendations will help you on your way.",
      },
      {
        q: "Where is it?",
        a: "Always in a good wine bar in your city. We choose the place once we know how many of you there are, so it suits your table. You'll get the address by email a week ahead.",
      },
      {
        q: "Does it always go ahead?",
        a: "A table goes ahead from 4 guests. A week ahead we let you know whether that worked out. If it didn't, you automatically get your money back and we suggest another date.",
      },
      {
        q: "Can I change my date?",
        a: "Yes. Up to 7 days before your table you can choose another Sunday at no cost: just let us know and we'll move you. After that it's no longer possible, because that's when we reserve the wine bar for your table.",
      },
      {
        q: "What if I didn't enjoy it?",
        a: "We'd like to hear that. Let us know within 2 days after your table and your next Sunday Table is on us. That way you can give it another try, at a different table.",
      },
      {
        q: "Is it a dating event?",
        a: "No. Sunday Table is a convivial afternoon at the table, with good wine and good conversation. Men and women sit together, and everyone comes for the company.",
      },
      {
        q: "In which language?",
        a: "Mostly Dutch. At some tables English is welcome too; you'll see that next to the date. So you know what to expect beforehand.",
      },
    ],
  },
  closing: {
    title: "Fancy a convivial Sunday?",
    note: "Signing up takes a minute. Then you choose your Sunday.",
  },
  footer: { terms: "Terms", privacy: "Privacy" },
  auth: {
    signUp: {
      metaTitle: "Sign up | MyTable",
      title: "Create your account",
      sub: "With your email address, no password. Then you choose your Sunday.",
      switchPrompt: "Already have an account?",
      switchLink: "Log in",
    },
    logIn: {
      metaTitle: "Log in | MyTable",
      title: "Welcome back",
      sub: "Log in with your email address, no password.",
      switchPrompt: "No account yet?",
      switchLink: "Create an account",
    },
    google: "Continue with Google",
    googleFailed: "Signing in with Google didn't work. Try again or use your email address.",
    or: "or",
    emailLabel: "Email address",
    emailPlaceholder: "name@example.com",
    sendCode: "Send me a code",
    sending: "Sending your code",
    errors: {
      emailEmpty: "Fill in your email address.",
      emailInvalid: "This email address doesn't look right. Please check it.",
      unknownEmail: "We don't know this email address yet.",
      createAccount: "Create an account",
      rateLimited: "A few codes were just sent. Wait a moment and try again.",
      generic: "That didn't work. Please try again.",
    },
    legal: {
      before: "By signing up you agree to the ",
      beforeLogIn: "By logging in you agree to the ",
      terms: "terms and conditions",
      between: " and the ",
      privacy: "privacy policy",
      after: ".",
    },
    code: {
      title: "Check your email",
      body: (email) => `We sent a 6-digit code to ${email}.`,
      label: "6-digit code",
      confirm: "Confirm",
      verifying: "Checking",
      wrong: "This code is incorrect or has expired. Try again or request a new code.",
      incomplete: "Fill in all 6 digits.",
      noCode: "No code? Please check your spam or promotions folder too.",
      resend: "Send again",
      resendIn: (seconds) => `Send again (${seconds} s)`,
      resent: "We sent you a new code.",
      otherEmail: "Different email address",
    },
    welcome: {
      metaTitle: "Welcome | MyTable",
      title: "Welcome to MyTable",
      created: "Your account has been created.",
      signedIn: "You're logged in.",
      next: "Soon you'll choose your Sunday here.",
      back: "Back to the tables",
    },
  },
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return locale === "en" ? landingEn : landingNl;
}

/** 1000 -> "10", 1250 -> "12,50" (Dutch decimal comma on both pages, as
 * the rest of the site shows euro amounts). */
export function formatEuros(cents: number): string {
  const value = cents / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(".", ",");
}
