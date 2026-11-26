import type { MakerInput } from "@/lib/makers/validate";

export type PlainMail = { subject: string; text: string; html: string };

const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const para = (s: string) => `<p style="margin:0 0 16px">${escapeHtml(s).replace(/\n/g, "<br>")}</p>`;
const wrap = (inner: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px">${inner}</div>`;

const STYLE_LABEL: Record<MakerInput["workStyle"], string> = {
  self: "Post zelf",
  us: "Wij posten",
  either: "Maakt niet uit",
};

/** To info@: a new maker applied, with a link to approve them in the admin. */
export function makerNoticeMail(input: MakerInput, adminLink: string): PlainMail {
  const rows: [string, string][] = [
    ["Naam", input.name],
    ["E-mail", input.email],
    ["Stad", input.city],
    ["Instagram", input.instagram ?? "-"],
    ["TikTok", input.tiktok ?? "-"],
    ["Andere socials", input.otherSocials ?? "-"],
    ["Werk", input.portfolioUrl ?? "-"],
    ["Hoe", STYLE_LABEL[input.workStyle]],
  ];
  if (input.note) rows.push(["Bericht", input.note]);
  const text = `${rows.map(([l, v]) => `${l}: ${v}`).join("\n")}\n\nGoedkeuren: ${adminLink}`;
  const cell = "padding:4px 16px 4px 0;vertical-align:top";
  const table = `<table style="border-collapse:collapse;margin:0 0 16px">${rows
    .map(([l, v]) => `<tr><td style="${cell};color:#7a5a60">${escapeHtml(l)}</td><td style="${cell}">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table>`;
  return {
    subject: `Creator wil kennismaken: ${input.name} (${input.city})`,
    text,
    html: wrap(`${table}<p style="margin:0"><a href="${escapeHtml(adminLink)}" style="color:#5a0f1b">Goedkeuren in admin</a></p>`),
  };
}

/** To the maker once approved: their link and what it gives. */
export function makerWelcomeMail(input: { name: string; locale: string; link: string }): PlainMail {
  const en = input.locale === "en";
  const first = input.name.trim().split(/\s+/)[0] || input.name;
  const lines = en
    ? [
        `Hi ${first},`,
        "Welcome as a MyTable creator. This is your own affiliate link:",
        input.link,
        "Anyone new who books through it brings someone along free the first time. You earn €7 for every paid seat, and €7 for every paid month of a club membership, for two years after their first booking.",
        "Share it wherever you post. On Instagram and TikTok put it in your bio or in a story with a link sticker, on Facebook and LinkedIn simply in your post. On Instagram we like to post as a collab: invite us, or we invite you. Often the venue joins too.",
        "Questions or an idea for a post? Just reply to this mail.",
        "Cheers,\nTeam MyTable",
      ]
    : [
        `Hoi ${first},`,
        "Welkom als creator bij MyTable. Dit is je eigen affiliate link:",
        input.link,
        "Wie nieuw is en via jouw affiliate link boekt, neemt de eerste keer gratis iemand mee. Jij krijgt €7 per betaalde plek, en €7 per betaalde maand van een club membership, twee jaar lang na hun eerste boeking.",
        "Deel hem waar je maar post. Op Instagram en TikTok zet je hem in je bio of in een story met een linksticker, op Facebook en LinkedIn gewoon in je post. Op Instagram posten we graag als collab: nodig ons uit, of wij nodigen jou uit. Vaak doet de plek zelf ook mee.",
        "Vragen of een idee voor een post? Antwoord gewoon op deze mail.",
        "Groetjes,\nTeam MyTable",
      ];
  const html = wrap(
    lines
      .map((l) => (l === input.link ? `<p style="margin:0 0 16px"><a href="${escapeHtml(l)}" style="color:#5a0f1b;font-weight:600">${escapeHtml(l)}</a></p>` : para(l)))
      .join(""),
  );
  return { subject: en ? "Your MyTable affiliate link" : "Je MyTable affiliate link", text: lines.join("\n\n"), html };
}
