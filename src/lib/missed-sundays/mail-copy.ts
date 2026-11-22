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
  // Why it matters, the free way out, then what happens if it keeps happening.
  const why = en
    ? "Good to know: our bars are often small and keep a few seats free for us. When a chair stays empty, the whole table notices, and so does the bar. Can't make it one time? Move your ticket up to 7 days before, that's free."
    : "Goed om te weten: onze bars zijn vaak klein en houden een paar plekken voor ons vrij. Blijft een stoel leeg, dan merkt de hele tafel dat, en de bar ook. Kun je een keer niet? Verzet je ticket dan uiterlijk 7 dagen van tevoren, dat is gratis.";
  const props = (rule: string) => ({
    subject,
    props: { locale: l, preview: first, greeting: greeting(l, input.firstName), headline: subject, body: `${first} ${reassure}`, warmLine: `${why} ${rule}` },
  });
  if (outcome.kind === "warning") {
    return props(
      en
        ? "If you cancel at the last minute more often, your next ticket may cost a little more."
        : "Zeg je vaker op het laatste moment af, dan kan je volgende ticket iets duurder worden.",
    );
  }
  return props(
    en
      ? "As it wasn't the first time, your next ticket costs a little more. After that, it's the usual price again."
      : "Omdat het niet de eerste keer was, is je volgende ticket iets duurder. Daarna is het weer de gewone prijs.",
  );
}
