/** A short name for an email, read from its subject, for the admin list
 * ("Bevestiging 30 sep · Locatie 18 okt"). Works for mails imported from
 * Resend too, since it needs nothing but the subject. */
const RULES: Array<[RegExp, string]> = [
  [/^(Bevestigd|Confirmed):/i, "Bevestiging"],
  [/^Sunday (Social|Table) (bevestigd|confirmed)/i, "Bevestiging"],
  [/(geannuleerd|cancelled)/i, "Annulering"],
  [/^(Verplaatst|Moved):/i, "Verplaatst"],
  [/(\+1 toegevoegd|\+1 added)/i, "+1 erbij"],
  [/(\+1 verwijderd|\+1 removed)/i, "+1 eraf"],
  [/(je zit in groep|you're in group)/i, "Groep"],
  [/(Locatie|location|je Sunday Social bij|your Sunday Social at)/i, "Locatie"],
  [/(tafelindeling|Your table for)/i, "Vragen"],
  [/(aanraders|our picks)/i, "Aanraders"],
  [/(Aanmelden is open|Tickets are open|Je kunt nu boeken|You can book now|kun je weer boeken|you can book again)/i, "Boeken open"],
  [/(Er vormt zich een tafel|A table is forming)/i, "Uitnodiging"],
  [/^(Je uitnodiging|Your invitation)/i, "Uitnodiging"],
  [/(een tafel voor je bij|a table for you at)/i, "Uitnodiging"],
  [/(inlogcode|login code|sign-in code)/i, "Inlogcode"],
  [/^tafel reserveren/i, "Venue"],
  [/(Je staat op de lijst|You're on the list)/i, "Wachtlijst"],
  [/(Welkom aan tafel|Welcome to the table)/i, "Welkom"],
  [/(Welkom bij MyTable|Welcome to MyTable)/i, "Welkom"],
  [/(Welkom als lid|you are a member)/i, "Lid geworden"],
  [/(lidmaatschap|membership)/i, "Lidmaatschap"],
  [/(Opzegging|Cancellation confirmed)/i, "Opzegging"],
  [/(gemist aan tafel|missed you)/i, "Niet gekomen"],
  [/(review|beoordeel|hoe was)/i, "Review"],
];

export function emailKind(subject: string): string {
  const clean = subject.replace(/^\[[^\]]*\]\s*/, "");
  for (const [pattern, label] of RULES) {
    if (pattern.test(clean)) return label;
  }
  return "E-mail";
}
