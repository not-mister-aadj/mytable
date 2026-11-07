/** The "ging er iets mis?" mail for a booking that was started but not paid.
 * Pure, so it can be tested without a database. */

export type AbandonedCheckoutText = {
  locale: "nl" | "en";
  firstName: string | null;
  city: string;
  /** "zondag 6 december" / "Sunday 6 December". */
  dateLabel: string;
  /** Seats left on that Sunday. */
  open: boolean;
  /** The next Sunday in the city with room, when this one is full. */
  next: { dateLabel: string } | null;
  /** Where the button goes: the date page, the next date, or the city page. */
  url: string;
};

export function abandonedCheckoutSubject(p: Pick<AbandonedCheckoutText, "locale" | "dateLabel">): string {
  return p.locale === "en"
    ? `Did something go wrong with your booking for ${p.dateLabel}?`
    : `Ging er iets mis met je boeking voor ${p.dateLabel}?`;
}

export function abandonedCheckoutButton(p: Pick<AbandonedCheckoutText, "locale" | "open" | "next">): string {
  if (p.locale === "en") return p.open ? "Book your seat" : p.next ? "Book the next date" : "See the dates";
  return p.open ? "Boek je plek" : p.next ? "Boek de volgende datum" : "Bekijk de data";
}

export function abandonedCheckoutText(p: AbandonedCheckoutText): string {
  const en = p.locale === "en";
  const hi = en ? `Hi${p.firstName ? ` ${p.firstName}` : ""},` : `Hoi${p.firstName ? ` ${p.firstName}` : ""},`;
  const seat = p.open
    ? en
      ? "There are still seats. Would you like to try again?"
      : "Er is nog plek. Wil je het opnieuw proberen?"
    : p.next
      ? en
        ? `That Sunday is now full, but there are still seats on ${p.next.dateLabel}.`
        : `Deze zondag is inmiddels vol, maar op ${p.next.dateLabel} is er nog plek.`
      : en
        ? "That Sunday is now full. Have a look at the other dates in your city."
        : "Deze zondag is inmiddels vol. Kijk gerust naar de andere data in je stad.";
  const lines = en
    ? [
        hi,
        "",
        `We saw you tried to book a seat for the Sunday Social in ${p.city} on ${p.dateLabel}, but the payment wasn't completed.`,
        "",
        "Did something go wrong? Just reply to this email and we'll help you. We'd be sorry if a technical problem kept you from joining.",
        "",
        seat,
        "",
        p.url,
        "",
        "Simply changed your mind? That's fine, there's nothing you need to do.",
        "",
        "Warm regards,",
        "The MyTable team",
      ]
    : [
        hi,
        "",
        `We zagen dat je een plek probeerde te boeken voor de Sunday Social in ${p.city} op ${p.dateLabel}, maar de betaling is niet afgerond.`,
        "",
        "Ging er iets mis? Laat het ons gerust weten door op deze mail te antwoorden, dan helpen we je verder. We zouden het jammer vinden als je er niet bij kunt zijn door een technisch probleem.",
        "",
        seat,
        "",
        p.url,
        "",
        "Bedacht je je gewoon? Dan is alles goed, en hoef je niets te doen.",
        "",
        "Hartelijke groet,",
        "Het MyTable-team",
      ];
  return lines.join("\n");
}
