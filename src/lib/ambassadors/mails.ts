import { ambassadorCopy } from "@/lib/ambassadors/copy";
import { whatsappLink, type AmbassadorInput } from "@/lib/ambassadors/validate";

export type PlainMail = { subject: string; text: string; html: string };

const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** One answer per row: [label, value, optional link]. */
type Answer = [string, string, string?];

function answers(input: AmbassadorInput, fileName: string | null, labelLocale: "nl" | "en"): Answer[] {
  const t = ambassadorCopy(labelLocale);
  const f = t.form;
  const rows: Answer[] = [
    [f.name, input.name],
    [f.email, input.email],
    [f.phone, input.phone, whatsappLink(input.phone) ?? undefined],
    [f.city, input.city],
    [f.study, [input.study, input.institution, input.studyYear].join(", ")],
    [labelLocale === "en" ? "Role" : "Rol", input.roles.map((r) => t.roles[r].title).join(", ")],
  ];
  if (input.instagram) rows.push([f.instagram, input.instagram]);
  if (input.linkedin) rows.push([f.linkedin, input.linkedin, input.linkedin]);
  if (fileName) rows.push([f.motivation, fileName]);
  if (input.motivationText) rows.push([fileName ? f.motivationText : f.motivation, input.motivationText]);
  if (input.heardFrom) rows.push([f.heardFrom, input.heardFrom]);
  return rows;
}

const answersText = (rows: Answer[]) =>
  rows.map(([label, value]) => (value.includes("\n") ? `${label}:\n${value}` : `${label}: ${value}`)).join("\n");

function answersHtml(rows: Answer[]): string {
  const cell = "padding:4px 16px 4px 0;vertical-align:top";
  return `<table style="border-collapse:collapse;margin:0 0 16px">${rows
    .map(([label, value, href]) => {
      const v = escapeHtml(value).replace(/\n/g, "<br>");
      const shown = href ? `<a href="${escapeHtml(href)}" style="color:#5a0f1b">${v}</a>` : v;
      return `<tr><td style="${cell};color:#7a5a60;white-space:nowrap">${escapeHtml(label)}</td><td style="${cell}">${shown}</td></tr>`;
    })
    .join("")}</table>`;
}

const para = (s: string) => `<p style="margin:0 0 16px">${escapeHtml(s).replace(/\n/g, "<br>")}</p>`;
const wrap = (inner: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px">${inner}</div>`;

/** To the applicant, in the language of the form: thanks, next step, and their answers. */
export function applicantMail(input: AmbassadorInput, fileName: string | null): PlainMail {
  const en = input.locale === "en";
  const first = input.name.split(/\s+/)[0] || input.name;
  const rows = answers(input, fileName, input.locale);
  const hi = en ? `Hi ${first},` : `Hoi ${first},`;
  const thanks = en
    ? "Thank you for your application! We've received it, and we'll send you a WhatsApp message soon to get to know you."
    : "Dank je wel voor je sollicitatie! We hebben hem goed ontvangen. We sturen je snel een WhatsApp-bericht om kennis te maken.";
  const intro = en ? "This is what you filled in:" : "Dit heb je ingevuld:";
  const check = en ? "Something not right? Just reply to this mail." : "Klopt er iets niet? Antwoord gewoon op deze mail.";
  const bye = en ? "Cheers,\nTeam MyTable" : "Groetjes,\nTeam MyTable";
  return {
    subject: en ? "Your application as a MyTable Ambassador" : "Je sollicitatie als MyTable Ambassador",
    text: [hi, "", thanks, "", intro, answersText(rows), "", check, "", bye].join("\n"),
    html: wrap(`${para(hi)}${para(thanks)}${para(intro)}${answersHtml(rows)}${para(check)}${para(bye)}`),
  };
}

/** To us: every answer, the phone as a WhatsApp link, and a link to the application in the admin. */
export function adminMail(input: AmbassadorInput, fileName: string | null, url: string): PlainMail {
  const rows = answers(input, fileName, "nl");
  const lang = input.locale === "en" ? "Engels" : "Nederlands";
  rows.push(["Taal", lang]);
  const open = "Bekijk de aanmelding";
  return {
    subject: `Nieuwe ambassador-aanmelding: ${input.name}, ${input.city}`,
    text: [answersText(rows), "", `${open}: ${url}`].join("\n"),
    html: wrap(`${answersHtml(rows)}<p style="margin:0"><a href="${escapeHtml(url)}" style="color:#5a0f1b;font-weight:600">${open}</a></p>`),
  };
}
