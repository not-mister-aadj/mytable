/**
 * "Twee vragen voor zondag 6 december": the venue's questions (diet, live
 * music) with the answers as taps. Never names the venue, it can go out
 * before the location mail. Pure.
 */

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function venueQuestionsLinks(questionsUrl: string, music: boolean) {
  return {
    diet: [
      { key: "nee", href: `${questionsUrl}?dieet=nee` },
      { key: "ja", href: `${questionsUrl}?dieet=ja` },
    ],
    music: music
      ? [
          { key: "ja", href: `${questionsUrl}?muziek=ja` },
          { key: "misschien", href: `${questionsUrl}?muziek=misschien` },
          { key: "nee", href: `${questionsUrl}?muziek=nee` },
        ]
      : [],
  };
}

export function venueQuestionsMail(p: {
  locale: "nl" | "en";
  firstName: string | null;
  /** "zondag 6 december" / "Sunday 6 December". */
  sunday: string;
  /** "14:00" / "2pm". */
  time: string;
  /** The day the location is told: "zondag 29 november" / "Sunday 29 November". */
  locationDay: string;
  city: string;
  /** The page /aan-tafel/{token}/vragen (with the locale prefix). */
  questionsUrl: string;
  /** "16:00" when the venue asks about live music. */
  musicFrom: string | null;
  /** Shown as "meer dan 30 gasten". */
  guestsOver: number;
}): { subject: string; text: string; html: string } {
  const nl = p.locale === "nl";
  const links = venueQuestionsLinks(p.questionsUrl, Boolean(p.musicFrom));
  const dietLabels = nl ? ["Nee", "Ja, ik vul het in"] : ["No", "Yes, I'll fill it in"];
  const musicLabels = nl ? ["Ja, leuk", "Misschien", "Nee"] : ["Yes, sounds fun", "Maybe", "No"];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const city = !nl && p.city === "Den Haag" ? "The Hague" : p.city;
  const subject = nl ? `Twee vragen voor ${p.sunday}` : `Two questions for ${p.sunday}`;
  const hi = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const intro = nl
    ? `${cap(p.sunday)} om ${p.time} zit je aan tafel in ${city}. Waar precies, houden we nog even geheim: dat hoor je ${p.locationDay}. Een tipje van de sluier: met meer dan ${p.guestsOver} gasten nemen we een groot deel van de zaak over.`
    : `On ${p.sunday} at ${p.time} you'll be at the table in ${city}. Where exactly is still a secret: you'll hear on ${p.locationDay}. A little hint: with more than ${p.guestsOver} guests, we're taking over a big part of the place.`;
  const why = nl
    ? "De zaak wil alles goed voorbereiden en heeft daarom twee vragen voor je."
    : "The venue wants to prepare everything well, so they have two questions for you.";
  const q1 = nl ? "1. Heb je een dieetwens of allergie?" : "1. Do you have a dietary wish or allergy?";
  const q1why = nl
    ? "De keuken stemt de hapjes en de inkoop af op onze groep, zodat er voor iedereen iets lekkers klaarstaat."
    : "The kitchen plans the bites and the shopping around our group, so there's something tasty for everyone.";
  const q2 = p.musicFrom
    ? nl
      ? `2. Vanaf ${p.musicFrom} speelt er live jazz. Lijkt het je leuk om daarvoor te blijven?`
      : `2. From ${p.musicFrom} there's live jazz. Would you like to stay for it?`
    : null;
  const outro = nl ? "Tik wat past, dan geven wij het door. Graag voor vrijdag 4 december." : "Tap what fits and we'll pass it on. Please before Friday 4 December.";
  const bye = nl ? ["Tot zondag,", "Het MyTable-team"] : ["See you Sunday,", "The MyTable team"];

  const textLinks = (labels: string[], list: { href: string }[]) => list.map((l, i) => `${labels[i]}: ${l.href}`);
  const text = [
    hi,
    "",
    intro,
    "",
    why,
    "",
    q1,
    q1why,
    ...textLinks(dietLabels, links.diet),
    ...(q2 ? ["", q2, ...textLinks(musicLabels, links.music)] : []),
    "",
    outro,
    "",
    ...bye,
  ].join("\n");

  const chips = (labels: string[], list: { href: string }[]) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px"><tr>${list
      .map(
        (l, i) =>
          `<td style="padding:0 8px 0 0"><a href="${esc(l.href)}" style="display:block;border:1px solid #e3d6cf;border-radius:14px;padding:9px 14px;text-align:center;text-decoration:none;color:#2b0d12;font-size:13px;font-weight:600;background:#ffffff">${esc(labels[i]!)}</a></td>`,
      )
      .join("")}</tr></table>`;
  const para = (s: string) => `<p style="margin:0 0 16px">${esc(s)}</p>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px">${para(hi)}${para(intro)}${para(why)}<p style="margin:0 0 4px;font-weight:600">${esc(q1)}</p><p style="margin:0 0 4px;color:#6b4c52">${esc(q1why)}</p>${chips(dietLabels, links.diet)}${
    q2 ? `<p style="margin:0 0 4px;font-weight:600">${esc(q2)}</p>${chips(musicLabels, links.music)}` : ""
  }${para(outro)}<p style="margin:0">${esc(bye[0]!)}<br>${esc(bye[1]!)}</p></div>`;
  return { subject, text, html };
}
