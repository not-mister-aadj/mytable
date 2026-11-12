import assert from "node:assert/strict";
import test from "node:test";
import { adminMail, applicantMail } from "@/lib/ambassadors/mails";
import type { AmbassadorInput } from "@/lib/ambassadors/validate";

const input: AmbassadorInput = {
  name: "Sam de Vries",
  email: "sam@example.com",
  phone: "06 12345678",
  city: "Rotterdam",
  study: "Bedrijfskunde",
  institution: "Erasmus",
  studyYear: "2",
  roles: ["fill", "social"],
  instagram: null,
  linkedin: null,
  motivationText: "Ik hou van <wijn> & mensen",
  availability: null,
  heardFrom: "Instagram",
  locale: "nl",
};

test("applicant mail in Dutch lists their answers and escapes html", () => {
  const m = applicantMail(input, "motivatie.pdf");
  assert.equal(m.subject, "Je sollicitatie als MyTable Ambassador");
  assert.match(m.text, /^Hoi Sam,/);
  assert.match(m.text, /Rol: Verbinden, Content/);
  assert.match(m.text, /motivatie\.pdf/);
  assert.doesNotMatch(m.text, /Instagram: /);
  assert.match(m.html, /&lt;wijn&gt; &amp; mensen/);
  assert.doesNotMatch(m.html + m.text, /—/);
});

test("applicant mail follows the form language", () => {
  const m = applicantMail({ ...input, locale: "en" }, null);
  assert.equal(m.subject, "Your application as a MyTable Ambassador");
  assert.match(m.text, /^Hi Sam,/);
  assert.match(m.text, /Role: Connect, Content/);
});

test("admin mail has a WhatsApp link and the admin link", () => {
  const m = adminMail(input, null, "https://dashboard.mytable.club/ambassadors");
  assert.equal(m.subject, "Nieuwe ambassador-aanmelding: Sam de Vries, Rotterdam");
  assert.match(m.html, /https:\/\/wa\.me\/31612345678/);
  assert.match(m.text, /Bekijk de aanmelding: https:\/\/dashboard\.mytable\.club\/ambassadors/);
  assert.match(m.text, /Taal: Nederlands/);
});
