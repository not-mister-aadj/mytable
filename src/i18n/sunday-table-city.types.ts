/** Copy for the Sunday Table city landing pages (/sunday-table/rotterdam,
 * /sunday-table/den-haag). "{city}" is filled in with fillCity(). */
export type SundayTableCityLabels = {
  hero: {
    eyebrow: string;
    headline: string;
    line: string;
    facts: string[];
    /** "Meld je aan · {bracket} jaar" */
    bookCta: string;
    /** Used when the event name carries no age bracket. */
    bookCtaNoBracket: string;
    /** "{date} · €{price}" */
    bookHint: string;
    waitlistCta: string;
    noDatesTitle: string;
    noDatesBody: string;
  };
  how: {
    eyebrow: string;
    title: string;
    steps: { title: string; body: string }[];
  };
  dates: {
    eyebrow: string;
    title: string;
    body: string;
    /** "{bracket} jaar" */
    ageLabel: string;
    mixedLabel: string;
    spotsLeft: string;
    available: string;
    soldOut: string;
    comingSoon: string;
    bookCta: string;
    viewCta: string;
    missingTitle: string;
    missingBody: string;
    waitlistCta: string;
    emptyTitle: string;
    emptyBody: string;
  };
  what: {
    eyebrow: string;
    title: string;
    body: string;
    items: { title: string; body: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { question: string; answer: string }[];
  };
  final: {
    title: string;
    body: string;
    datesCta: string;
  };
  stickyCta: string;
};
