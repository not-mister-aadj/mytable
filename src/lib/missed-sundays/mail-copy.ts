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
  // Names the Sunday, so it reads as about their booking, not a newsletter.
  const subject = late
    ? en
      ? `Late cancellation for ${day}`
      : `Late afmelding op ${day}`
    : en
      ? `We missed you on ${day}`
      : `We hebben je gemist op ${day}`;
  // Warm first: we missed them, and if they were ill there's nothing to worry about.
  const first = late
    ? en
      ? `You let us know shortly before ${day} that you couldn't come. A shame, we'd have loved to have you there.`
      : `Je liet kort voor ${day} weten dat je niet kon. Jammer, we hadden je er graag bij gehad.`
    : en
      ? `We missed you on ${day}. A shame, we'd have loved to have you there.`
      : `We hebben je gemist op ${day}. Jammer, we hadden je er graag bij gehad.`;
  const reassure = en
    ? "Were you ill, or was it something you couldn't help? No worries, we completely understand."
    : "Was je ziek of kon je er echt niets aan doen? Geen zorgen, dat snappen we helemaal.";
  // Why it matters, then what we may do, then the free way out.
  const why = en
    ? "Good to know: most bars are small and keep only a few seats free for us. An empty seat is a shame for your table and awkward for the bar, and next time they may not want to anymore."
    : "Goed om te weten: de meeste bars zijn klein en houden maar een paar plekken voor ons vrij. Een lege plek is jammer voor je tafel en lastig voor de bar, en dan willen ze een volgende keer misschien niet meer.";
  const plans = en
    ? "Plans change, of course: until 7 days before, you move your ticket for free."
    : "Plannen veranderen natuurlijk: tot 7 dagen vooraf verzet je je ticket kosteloos.";
  const props = (rule: string) => ({
    subject,
    props: { locale: l, preview: first, greeting: greeting(l, input.firstName), headline: subject, body: `${first} ${reassure}`, warmLine: `${why} ${rule} ${plans}` },
  });
  if (outcome.kind === "warning") {
    return props(
      en
        ? "If someone cancels at the last minute more often, we may raise the price or not offer a seat anymore."
        : "Zegt iemand vaker op het laatste moment af, dan kunnen we de prijs verhogen of geen plek meer geven.",
    );
  }
  return props(
    en
      ? "As it wasn't the first time, we ask a little more for your next seat. After that Sunday, it's the usual price again."
      : "Omdat het niet de eerste keer was, vragen we voor je volgende plek iets meer. Na die zondag is het weer de gewone prijs.",
  );
}
