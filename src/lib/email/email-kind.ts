/** A short name for an email, read from its subject, for the admin list
 * ("Bevestiging 30 sep · Locatie 18 okt"). Works for mails imported from
 * Resend too, since it needs nothing but the subject. */

/** Notices to ourselves: read before the "[...]" prefix is dropped. */
const INTERNAL = /^(\[(afmelding|doorgegeven)\]|Melding na Sunday Social|Nieuwe ambassador-aanmelding|Mail-limiet|Uitnodigingen gepauzeerd|Terugbetaald in Stripe|Betaling betwist)/i;

const RULES: Array<[RegExp, string]> = [
  [/^(Nog even: kom je|Quick reminder: are you coming)/i, "Kom je zondag, herinnering"],
  [/^(Kom je |Are you coming on )/i, "Kom je zondag?"],
  [/^(Ging er iets mis met je boeking|Did something go wrong with your booking)/i, "Betaling afgebroken"],
  [/(Er is een plek vrij|A seat has come free)/i, "Plek vrij"],
  [/(heeft je een plek gegeven|has given you a seat)/i, "Plek doorgegeven"],
  [/^(Vanmiddag bij|This afternoon at)/i, "Vanmiddag"],
  [/^(Wie wil je terugzien|Who would you like to see again)/i, "Terugzien"],
  [/^(Ze vonden je gezellig|They enjoyed your company)/i, "Gezellig"],
  [/^(Bekende gezichten|Familiar faces)/i, "Bekende gezichten"],
  [/^(Wil je nog uitnodigingen|Do you still want our invites)/i, "Nog uitnodigingen?"],
  [/^(Over afgelopen zondag|About last Sunday|We hebben je gemist zondag)/i, "Niet gekomen"],
  [/(sollicitatie als MyTable Ambassador|application as a MyTable Ambassador)/i, "Sollicitatie"],
  [/^(Bevestigd|Confirmed):/i, "Bevestiging"],
  [/^Sunday (Social|Table) (bevestigd|confirmed)/i, "Bevestiging"],
  [/(geannuleerd|cancelled)/i, "Annulering"],
  [/^(Verplaatst|Verzet|Moved):/i, "Verplaatst"],
  [/(\+1 toegevoegd|\+1 added)/i, "+1 erbij"],
  [/(\+1 verwijderd|\+1 removed)/i, "+1 eraf"],
  [/(je zit in groep|you're in group)/i, "Groep"],
  [/^(Volgende week zondag|Aanstaande zondag|Next Sunday|This Sunday) (bij|at) /i, "Locatie"],
  [/(Locatie|location|je Sunday Social bij|your Sunday Social at)/i, "Locatie"],
  [/(tafelindeling|Your table for)/i, "Vragen"],
  [/(aanraders|our picks)/i, "Aanraders"],
  [/(Aanmelden is open|Tickets are open|Je kunt nu boeken|You can book now|kun je weer boeken|you can book again)/i, "Boeken open"],
  [/(Er vormt zich een tafel|A table is forming)/i, "Uitnodiging"],
  [/^(Je uitnodiging|Your invitation)/i, "Uitnodiging"],
  [/(een tafel voor je bij|a table for you at)/i, "Uitnodiging"],
  // The nudge after a click without a booking: just the date, "Zondag 22 november, 14:00".
  [/^(Zondag|Sunday) \d{1,2} [a-z]+, /i, "Uitnodiging"],
  [/(inlogcode|login code|sign-in code|Je code voor MyTable)/i, "Inlogcode"],
  [/^(tafels? reserveren|Reservering zondag)/i, "Venue"],
  [/(Je staat op de lijst|You're on the list)/i, "Wachtlijst"],
  [/(Welkom aan tafel|Welcome to the table)/i, "Welkom"],
  [/(Welkom bij MyTable|Welcome to MyTable)/i, "Welkom"],
  [/(Welkom als (club member|lid)|you are a (club )?member)/i, "Lid geworden"],
  [/(lidmaatschap|membership)/i, "Lidmaatschap"],
  [/(Opzegging|Cancellation confirmed)/i, "Opzegging"],
  [/(gemist aan tafel|missed you)/i, "Niet gekomen"],
  [/(review|beoordeel|hoe was|how was)/i, "Review"],
];

export function emailKind(subject: string): string {
  if (INTERNAL.test(subject)) return "Intern";
  const clean = subject.replace(/^\[[^\]]*\]\s*/, "");
  if (INTERNAL.test(clean)) return "Intern";
  for (const [pattern, label] of RULES) {
    if (pattern.test(clean)) return label;
  }
  return "E-mail";
}
