import type { MembershipEmailProps } from "@/emails/MembershipEmail";
import { mailDate, mailSunday } from "@/lib/membership/mail-copy";
import type { MissKind, MissOutcome } from "@/lib/missed-sundays/logic";

type Locale = "nl" | "en";

export type MissedSundayMail = { subject: string; props: MembershipEmailProps };

function greeting(locale: Locale, firstName?: string | null): string {
  const name = firstName?.trim();
  if (locale === "en") return name ? `Hi ${name},` : "Hi,";
  return name ? `Hoi ${name},` : "Hoi,";
}

function months(n: number, locale: Locale): string {
  if (locale === "en") return n === 1 ? "a month" : `${n} months`;
  return n === 1 ? "een maand" : `${n} maanden`;
}

/**
 * The mail after a seat given up late or a no-show. The first time it is let
 * go, and the mail says what a next time means; after that it names the date
 * they can book again. Short, and about the table, not about them.
 */
export function missedSundayMail(input: {
  locale: Locale;
  firstName?: string | null;
  kind: MissKind;
  outcome: MissOutcome;
  /** Months off now (block) or next time (warning). */
  months: number;
  sunday: Date;
}): MissedSundayMail {
  const { locale: l, kind, outcome } = input;
  const en = l === "en";
  const day = mailSunday(input.sunday, l);
  const late = kind === "late";
  const subject = late ? (en ? "About last Sunday" : "Over afgelopen zondag") : en ? "We missed you on Sunday" : "We hebben je gemist zondag";
  const what = late
    ? en
      ? `You let us know shortly before ${day} that you couldn't come. Your table was already made around you, and sat with an empty seat.`
      : `Je liet kort voor ${day} weten dat je niet kon. Je tafel was toen al ingedeeld en zat daardoor met een lege plek.`
    : en
      ? `On ${day} a seat was ready for you, but you weren't there and we didn't hear from you. Your table sat with an empty seat.`
      : `Op ${day} stond er een plek voor je klaar, maar je was er niet en we hoorden niets. Je tafel zat daardoor met een lege plek.`;
  const consequence =
    outcome.kind === "warning"
      ? en
        ? `We're letting it go this time. If it happens again, you can't book for ${months(input.months, l)}.`
        : `Deze keer laten we het hierbij. Gebeurt het nog een keer, dan kun je ${months(input.months, l)} niet boeken.`
      : en
        ? `It wasn't the first time, so you can't book until ${mailDate(outcome.until, l)}. After that you're welcome again.`
        : `Het was niet de eerste keer. Daarom kun je tot ${mailDate(outcome.until, l)} niet boeken. Daarna ben je weer welkom.`;
  const next = late
    ? en
      ? "See earlier next time that it won't work? Until 7 days before, you move your seat for free."
      : "Zie je een volgende keer eerder dat het niet lukt? Tot 7 dagen vooraf verzet je kosteloos."
    : en
      ? "Did something come up that you couldn't help? Reply to this mail and we'll look at it."
      : "Kwam er iets tussen waar je niets aan kon doen? Antwoord op deze mail, dan kijken we ernaar.";
  return {
    subject,
    props: { locale: l, preview: consequence, greeting: greeting(l, input.firstName), headline: subject, body: what, warmLine: consequence, note: next },
  };
}
