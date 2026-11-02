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

/** The mail after a late cancel or a no-show, for each outcome. */
export function missedSundayMail(input: {
  locale: Locale;
  firstName?: string | null;
  kind: MissKind;
  outcome: MissOutcome;
  /** Months off now (block) or next time (warning). */
  months: number;
  member: boolean;
  sunday: Date;
}): MissedSundayMail {
  const { locale: l, kind, outcome } = input;
  const en = l === "en";
  const day = mailSunday(input.sunday, l);
  const hi = greeting(l, input.firstName);
  const moveLine = en
    ? "Can't make it next time? Email us at info@mytable.club up to 48 hours before, and we'll move your seat for free."
    : "Kun je een volgende keer niet? Mail ons tot 48 uur van tevoren op info@mytable.club, dan verplaatsen we je plek gratis.";
  const memberLine = input.member ? (en ? " Your membership continues as usual." : " Je lidmaatschap loopt gewoon door.") : "";

  if (outcome.kind === "warning") {
    return {
      subject: en ? "You cancelled your seat late" : "Je zegde je plek laat af",
      props: {
        locale: l,
        preview: en ? `Your seat for ${day} was cancelled less than 48 hours before.` : `Je plek voor ${day} is minder dan 48 uur van tevoren afgezegd.`,
        greeting: hi,
        headline: en ? "A shame you weren't there on Sunday" : "Jammer dat je er zondag niet bij was",
        body: en
          ? `You cancelled your seat for ${day} less than 48 hours before. That can happen, but your table was counting on you, and this late we couldn't give the seat to someone else.`
          : `Je zegde je plek voor ${day} minder dan 48 uur van tevoren af. Dat kan gebeuren, maar je tafel rekende op je, en zo laat konden we de plek niet meer aan iemand anders geven.`,
        warmLine: moveLine,
        note: en
          ? `If you cancel this late again, you can't book a Sunday Social for ${months(input.months, l)}.${memberLine}`
          : `Zeg je nog een keer zo laat af, dan kun je ${months(input.months, l)} geen Sunday Social boeken.${memberLine}`,
      },
    };
  }

  const until = mailDate(outcome.until, l);
  if (outcome.kind === "warning_block") {
    return {
      subject: en ? "We missed you at the table" : "We hebben je gemist aan tafel",
      props: {
        locale: l,
        preview: en ? `You can book again from ${until}.` : `Vanaf ${until} kun je weer boeken.`,
        greeting: hi,
        headline: en ? "We missed you" : "We hebben je gemist",
        body: en
          ? `You weren't at the table on ${day}, and you didn't let us know. Your table was counting on you. So you can't book a Sunday Social for a month. From ${until} you can again.`
          : `Je was er ${day} niet bij, zonder het ons te laten weten. Je tafel rekende op je. Daarom kun je een maand geen Sunday Social boeken. Vanaf ${until} kan het weer.`,
        warmLine: moveLine,
        note: en ? "If it happens again, you can't book for 6 months." : "Gebeurt het nog een keer, dan kun je 6 maanden niet boeken.",
      },
    };
  }

  return {
    subject: en ? `You can book again from ${until}` : `Vanaf ${until} kun je weer boeken`,
    props: {
      locale: l,
      preview: en ? `You can book again from ${until}.` : `Vanaf ${until} kun je weer boeken.`,
      greeting: hi,
      headline: en ? "A break from booking" : "Even geen Sunday Social",
      body:
        (kind === "late"
          ? en
            ? `You cancelled your seat for ${day} less than 48 hours before, and it wasn't the first time. `
            : `Je zegde je plek voor ${day} minder dan 48 uur van tevoren af, en het was niet de eerste keer. `
          : en
            ? `You weren't at the table on ${day}, and it wasn't the first time. `
            : `Je was er ${day} niet bij, en het was niet de eerste keer. `) +
        (en
          ? "At the table, people count on each other: they keep their Sunday afternoon free and look forward to meeting you. In our club we respect each other's time, and this doesn't fit with that."
          : "Aan tafel rekenen mensen op elkaar: ze houden hun zondagmiddag vrij en kijken ernaar uit om je te ontmoeten. In onze club respecteren we elkaars tijd, en daar past dit niet bij."),
      warmLine:
        (en
          ? `So you can't book a Sunday Social for the next ${months(input.months, l)}. From ${until} you're welcome to give it another try.`
          : `Daarom kun je de komende ${months(input.months, l)} geen Sunday Social boeken. Vanaf ${until} ben je van harte welkom om het nog een keer te proberen.`) + memberLine,
      note: moveLine,
    },
  };
}
