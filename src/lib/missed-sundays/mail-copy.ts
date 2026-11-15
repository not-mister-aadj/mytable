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

const euros = (cents: number) => (cents % 100 === 0 ? `€${cents / 100}` : `€${(cents / 100).toFixed(2).replace(".", ",")}`);

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
  const why = en
    ? "We make every table around who is coming. To give everyone a good Sunday, and to keep cancelling from being misused,"
    : "We delen elke tafel in op wie er komt. Om iedereen een fijne zondag te geven, en om misbruik van afmelden te voorkomen,";
  const props = (warmLine: string, note: string) => ({
    subject,
    props: { locale: l, preview: first, greeting: greeting(l, input.firstName), headline: subject, body: first, warmLine, note },
  });
  if (outcome.kind === "warning") {
    const who = late ? (en ? "cancels late more often" : "vaker kort van tevoren afzegt") : en ? "stays away more often without a word" : "vaker wegblijft zonder iets te laten weten";
    return props(
      en ? "Nothing changes for now. You're welcome at a next Sunday as always." : "Voor nu verandert er niets. Je bent gewoon welkom op een volgende zondag.",
      en ? `${why} we charge a higher price to who ${who}. ${tip}` : `${why} rekenen we een hogere prijs voor wie ${who}. ${tip}`,
    );
  }
  const normal = euros(input.normalCents);
  const more = euros(input.missCents);
  return props(
    en
      ? `It wasn't the first time. That's why your next seat is ${more} instead of ${normal}. Once you've joined a Sunday, it's ${normal} again.`
      : `Het was niet de eerste keer. Daarom kost je volgende plek ${more} in plaats van ${normal}. Kom je, dan is het daarna weer ${normal}.`,
    en ? `${why} we charge a higher price after a second time. ${tip}` : `${why} rekenen we na een tweede keer een hogere prijs. ${tip}`,
  );
}
