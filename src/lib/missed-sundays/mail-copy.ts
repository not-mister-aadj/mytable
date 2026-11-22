import type { MembershipEmailProps } from "@/emails/MembershipEmail";
import { mailSunday } from "@/lib/membership/mail-copy";
import type { MissKind, MissOutcome } from "@/lib/missed-sundays/logic";

type Locale = "nl" | "en";

export type MissedSundayMail = { subject: string; props: MembershipEmailProps };

function greeting(locale: Locale, firstName?: string | null): string {
  const name = firstName?.trim();
  if (locale === "en") return name ? `Hi ${name},` : "Hi,";
  return name ? `Hoi ${name},` : "Hoi,";
}

/**
 * The mail after a seat given up late or a no-show. Understanding first. The
 * first time nothing changes; from the second the next seat costs more, and
 * it is the usual price again once they have come. Short, and about the
 * table, not about them.
 */
export function missedSundayMail(input: {
  locale: Locale;
  firstName?: string | null;
  kind: MissKind;
  outcome: MissOutcome;
  /** The usual seat price and the higher one. */
  normalCents: number;
  missCents: number;
  sunday: Date;
}): MissedSundayMail {
  const { locale: l, kind, outcome } = input;
  const en = l === "en";
  const day = mailSunday(input.sunday, l);
  const late = kind === "late";
  const subject = late ? (en ? "About last Sunday" : "Over afgelopen zondag") : en ? "We missed you on Sunday" : "We hebben je gemist zondag";
  const first = late
    ? en
      ? `You let us know shortly before ${day} that you couldn't come. Of course something can come up, we understand that.`
      : `Je liet kort voor ${day} weten dat je niet kon. Natuurlijk kan er iets tussen komen, dat snappen we.`
    : en
      ? `We missed you on ${day}. Of course something can come up, we understand that.`
      : `We hebben je gemist op ${day}. Natuurlijk kan er iets tussen komen, dat snappen we.`;
  const tip = late
    ? en
      ? "Until 7 days before, you move your seat for free."
      : "Tot 7 dagen vooraf verzet je kosteloos."
    : en
      ? "Was it something you couldn't help? Reply to this mail."
      : "Kon je er niets aan doen? Antwoord gerust op deze mail.";
  // Why it matters, in the main text: an empty seat is a shame for the
  // table and for the bar, which often keeps only a few seats for us.
  const why = en
    ? "We make every table around who is coming. An empty seat is a shame for your table, and for the bar, which often keeps only a few seats free for us."
    : "We delen elke tafel in op wie er komt. Een lege plek is jammer voor je tafel, en voor de bar, die vaak maar een paar plekken voor ons vrijhoudt.";
  const props = (warmLine: string) => ({
    subject,
    props: { locale: l, preview: first, greeting: greeting(l, input.firstName), headline: subject, body: `${first} ${why}`, warmLine, note: tip },
  });
  if (outcome.kind === "warning") {
    return props(
      en
        ? "This time nothing changes. If it happens more often, a somewhat higher price applies to your next seat."
        : "Deze keer verandert er niets. Gebeurt het vaker, dan geldt voor je volgende plek een iets hogere prijs.",
    );
  }
  return props(
    en
      ? "It wasn't the first time, so a somewhat higher price applies to your next seat. Once you've joined a Sunday again, it's the usual price."
      : "Het was niet de eerste keer, dus voor je volgende plek geldt een iets hogere prijs. Ben je er daarna weer bij, dan is het weer de gewone prijs.",
  );
}
