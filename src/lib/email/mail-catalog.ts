/**
 * Every kind of mail MyTable sends, by what it is for: when it goes, to whom,
 * and whether it goes by itself. `kind` is the name emailKind() reads from a
 * sent mail's subject, so the catalog and the log speak about the same mails.
 * The times are the rules in the code (defaultScheduleAt, the crons); change
 * one there and change it here.
 */

export type MailGoalId = "boeken" | "vooraf" | "achteraf" | "groei" | "lid" | "venues" | "account" | "intern";

export const MAIL_GOALS: Array<{ id: MailGoalId; label: string }> = [
  { id: "boeken", label: "Boeken" },
  { id: "vooraf", label: "Voor de zondag" },
  { id: "achteraf", label: "Na de zondag" },
  { id: "groei", label: "Nieuwe gasten" },
  { id: "lid", label: "Lidmaatschap" },
  { id: "venues", label: "Venues" },
  { id: "account", label: "Account" },
  { id: "intern", label: "Intern" },
];

export type CatalogMail = {
  kind: string;
  /** Other names in the log that are this same mail (older wording). */
  alsoKinds?: string[];
  title: string;
  goal: MailGoalId;
  when: string;
  auto: boolean;
  to: string;
  /** Where its settings or send button live in admin. */
  managePath?: string;
};

export const MAIL_CATALOG: CatalogMail[] = [
  { kind: "Bevestiging", title: "Boeking bevestigd", goal: "boeken", when: "Direct na betaling", auto: true, to: "Gast" },
  { kind: "Vragen", title: "Vragen voor je tafel", goal: "boeken", when: "15 min na de bevestiging", auto: true, to: "Gast zonder antwoorden" },
  { kind: "Betaling afgebroken", title: "Betaling niet afgemaakt", goal: "boeken", when: "1 uur na een afgebroken betaling, 08:00 tot 22:00", auto: true, to: "Wie niet afrekende" },
  { kind: "Verplaatst", title: "Boeking verzet", goal: "boeken", when: "Direct na verzetten", auto: true, to: "Gast" },
  { kind: "Plek doorgegeven", title: "Plek gekregen van een ander", goal: "boeken", when: "Direct na doorgeven", auto: true, to: "Nieuwe gast" },
  { kind: "Plek vrij", title: "Plek vrijgekomen", goal: "boeken", when: "Direct na een late afmelding, 's nachts om 08:00", auto: true, to: "Wachtlijst van een volle zondag" },

  { kind: "Kom je zondag?", title: "Kom je zondag? (9 dagen vooraf)", goal: "vooraf", when: "Vrijdag 10:00, 9 dagen vooraf", auto: true, to: "Gasten zonder ja, geen leden" },
  { kind: "Kom je zondag, herinnering", title: "Kom je zondag? Herinnering", goal: "vooraf", when: "Zaterdag 10:00, 8 dagen vooraf", auto: true, to: "Wie niets koos" },
  { kind: "Locatie", title: "Locatie bekend (week vooraf)", goal: "vooraf", when: "7 dagen vooraf", auto: false, to: "Alle gasten" },
  { kind: "Groep", title: "Je groep en tafel (zaterdag)", goal: "vooraf", when: "Zaterdag 14:00, de dag ervoor", auto: false, to: "Alle gasten" },
  { kind: "Vanmiddag", alsoKinds: ["Aanraders"], title: "Vanmiddag, met onze aanraders", goal: "vooraf", when: "Zondag 08:30", auto: false, to: "Alle gasten" },

  { kind: "Review", title: "Feedback: hoe was het?", goal: "achteraf", when: "Zondag 20:00", auto: true, to: "Wie er was" },
  { kind: "Niet gekomen", title: "Gemist: niet gekomen of laat afgemeld", goal: "achteraf", when: "Maandag 11:00, leden direct", auto: true, to: "Niet gekomen of laat afgemeld" },
  { kind: "Terugzien", title: "Feedback herinnering: wie wil je terugzien?", goal: "achteraf", when: "Dinsdag 08:00", auto: true, to: "Wie nog niet antwoordde" },
  { kind: "Gezellig", title: "Je tafel wil je terugzien", goal: "achteraf", when: "Woensdag 19:00", auto: true, to: "Wie door een tafelgenoot gekozen is" },

  { kind: "Wachtlijst", title: "Welkom op de wachtlijst", goal: "groei", when: "Direct na aanmelden", auto: true, to: "Wachtlijst" },
  { kind: "Welkom", title: "Welkom na de quiz", goal: "groei", when: "15 min na de quiz", auto: true, to: "Nieuw account zonder boeking" },
  { kind: "Uitnodiging", title: "Uitnodiging voor een zondag", goal: "groei", when: "Ongeveer 1 per maand, op het eigen aanmeldmoment", auto: true, to: "Wie een stad volgt", managePath: "/invites" },
  { kind: "Bekende gezichten", title: "Uitnodiging: bekenden komen ook", goal: "groei", when: "1 uur na de boeking van een bekende", auto: true, to: "Wie elkaar wil terugzien", managePath: "/invites" },
  { kind: "Nog uitnodigingen?", title: "Wil je uitnodigingen blijven krijgen?", goal: "groei", when: "Na 5 genegeerde uitnodigingen", auto: true, to: "Wie niet reageert", managePath: "/invites" },
  { kind: "Boeken open", title: "Boeken is open", goal: "groei", when: "Zodra een zondag opengaat", auto: true, to: "Wie een seintje vroeg" },

  { kind: "Lid geworden", title: "Welkom als lid", goal: "lid", when: "Direct na betaling", auto: true, to: "Nieuw lid" },
  { kind: "Lidmaatschap", title: "Lidmaatschap loopt door per maand", goal: "lid", when: "7 dagen voor het einde van de eerste periode", auto: true, to: "Lid met 4 of 12 maanden" },
  { kind: "Opzegging", title: "Opzegging bevestigd", goal: "lid", when: "Direct na opzeggen", auto: true, to: "Lid" },

  { kind: "Venue", title: "Aanvraag aan een bar", goal: "venues", when: "Per aanvraag", auto: false, to: "Bars", managePath: "/outreach/mails" },

  { kind: "Inlogcode", title: "Inlogcode", goal: "account", when: "Direct bij inloggen", auto: true, to: "Wie inlogt" },
  { kind: "Sollicitatie", title: "Sollicitatie ontvangen", goal: "account", when: "Direct na aanmelden", auto: true, to: "Aanmelder" },

  { kind: "Intern", title: "Melding aan ons", goal: "intern", when: "Bij een afmelding, melding of limiet", auto: true, to: "info@mytable.club" },
];

const BY_KIND = new Map<string, CatalogMail>();
for (const mail of MAIL_CATALOG) {
  BY_KIND.set(mail.kind, mail);
  for (const other of mail.alsoKinds ?? []) BY_KIND.set(other, mail);
}

export function catalogMail(kind: string): CatalogMail | null {
  return BY_KIND.get(kind) ?? null;
}

/** The goal a sent mail belongs to; null for mails outside the catalog (campaigns, one-offs). */
export function mailGoal(kind: string): MailGoalId | null {
  return BY_KIND.get(kind)?.goal ?? null;
}

/** The name we show for a kind of mail; the kind itself for mails outside the catalog. */
export function mailTitle(kind: string): string {
  return BY_KIND.get(kind)?.title ?? kind;
}
