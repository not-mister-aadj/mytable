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
  { id: "vooraf", label: "Naar de zondag toe" },
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
  { kind: "Bevestiging", title: "Bevestiging", goal: "boeken", when: "Direct na betaling", auto: true, to: "Gast" },
  { kind: "Vragen", title: "Vragen vooraf", goal: "boeken", when: "15 min na de bevestiging", auto: true, to: "Gast zonder antwoorden" },
  { kind: "Betaling afgebroken", title: "Ging er iets mis?", goal: "boeken", when: "1 uur na een afgebroken betaling, 08:00 tot 22:00", auto: true, to: "Wie niet afrekende" },
  { kind: "Verplaatst", title: "Verplaatst", goal: "boeken", when: "Direct na verzetten", auto: true, to: "Gast" },
  { kind: "Plek doorgegeven", title: "Plek doorgegeven", goal: "boeken", when: "Direct na doorgeven", auto: true, to: "Nieuwe gast" },
  { kind: "Plek vrij", title: "Er is een plek vrij", goal: "boeken", when: "Direct na een late afmelding, 's nachts om 08:00", auto: true, to: "Wachtlijst van een volle zondag" },

  { kind: "Kom je zondag?", title: "Kom je zondag?", goal: "vooraf", when: "Vrijdag 10:00, 9 dagen vooraf", auto: true, to: "Gasten zonder ja, geen leden" },
  { kind: "Kom je zondag, herinnering", title: "Nog even: kom je zondag?", goal: "vooraf", when: "Zaterdag 10:00, 8 dagen vooraf", auto: true, to: "Wie niets koos" },
  { kind: "Locatie", title: "Locatie", goal: "vooraf", when: "7 dagen vooraf", auto: false, to: "Alle gasten" },
  { kind: "Groep", title: "Je groep", goal: "vooraf", when: "Zaterdag 14:00, de dag ervoor", auto: false, to: "Alle gasten" },
  { kind: "Vanmiddag", alsoKinds: ["Aanraders"], title: "Vanmiddag, met aanraders", goal: "vooraf", when: "Zondag 08:30", auto: false, to: "Alle gasten" },

  { kind: "Review", title: "Hoe was het?", goal: "achteraf", when: "Zondag 20:00", auto: true, to: "Wie er was" },
  { kind: "Niet gekomen", title: "Niet gekomen", goal: "achteraf", when: "Maandag 11:00, leden direct", auto: true, to: "Niet gekomen of laat afgemeld" },
  { kind: "Terugzien", title: "Wie wil je terugzien?", goal: "achteraf", when: "Dinsdag 08:00", auto: true, to: "Wie nog niet antwoordde" },
  { kind: "Gezellig", title: "Ze vonden je gezellig", goal: "achteraf", when: "Woensdag 19:00", auto: true, to: "Wie door een tafelgenoot gekozen is" },

  { kind: "Wachtlijst", title: "Je staat op de lijst", goal: "groei", when: "Direct na aanmelden", auto: true, to: "Wachtlijst" },
  { kind: "Welkom", title: "Welkom aan tafel", goal: "groei", when: "15 min na de quiz", auto: true, to: "Nieuw account zonder boeking" },
  { kind: "Uitnodiging", title: "Uitnodiging", goal: "groei", when: "Ongeveer 1 per maand, op het eigen aanmeldmoment", auto: true, to: "Wie een stad volgt", managePath: "/invites" },
  { kind: "Bekende gezichten", title: "Bekende gezichten", goal: "groei", when: "1 uur na de boeking van een bekende", auto: true, to: "Wie elkaar wil terugzien", managePath: "/invites" },
  { kind: "Nog uitnodigingen?", title: "Wil je nog uitnodigingen?", goal: "groei", when: "Na 5 genegeerde uitnodigingen", auto: true, to: "Wie niet reageert", managePath: "/invites" },
  { kind: "Boeken open", title: "Boeken is open", goal: "groei", when: "Zodra een zondag opengaat", auto: true, to: "Wie een seintje vroeg" },

  { kind: "Lid geworden", title: "Welkom als lid", goal: "lid", when: "Direct na betaling", auto: true, to: "Nieuw lid" },
  { kind: "Lidmaatschap", title: "Loopt straks per maand door", goal: "lid", when: "7 dagen voor het einde van de eerste periode", auto: true, to: "Lid met 4 of 12 maanden" },
  { kind: "Opzegging", title: "Opzegging bevestigd", goal: "lid", when: "Direct na opzeggen", auto: true, to: "Lid" },

  { kind: "Venue", title: "Reserveringsaanvraag", goal: "venues", when: "Per aanvraag", auto: false, to: "Bars", managePath: "/outreach/mails" },

  { kind: "Inlogcode", title: "Inlogcode", goal: "account", when: "Direct bij inloggen", auto: true, to: "Wie inlogt" },
  { kind: "Sollicitatie", title: "Sollicitatie ambassador", goal: "account", when: "Direct na aanmelden", auto: true, to: "Aanmelder" },

  { kind: "Intern", title: "Meldingen aan ons", goal: "intern", when: "Bij een afmelding, melding of limiet", auto: true, to: "info@mytable.club" },
];

/** The steps around one Sunday, in order, with the day they fall on (0 = the Sunday). */
export const SUNDAY_FLOW: Array<{ day: number; time: string; kind: string }> = [
  { day: -9, time: "vr 10:00", kind: "Kom je zondag?" },
  { day: -8, time: "za 10:00", kind: "Kom je zondag, herinnering" },
  { day: -7, time: "zo", kind: "Locatie" },
  { day: -1, time: "za 14:00", kind: "Groep" },
  { day: 0, time: "zo 08:30", kind: "Vanmiddag" },
  { day: 0, time: "zo 20:00", kind: "Review" },
  { day: 1, time: "ma 11:00", kind: "Niet gekomen" },
  { day: 2, time: "di 08:00", kind: "Terugzien" },
  { day: 3, time: "wo 19:00", kind: "Gezellig" },
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
