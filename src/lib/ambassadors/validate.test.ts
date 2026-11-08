import assert from "node:assert/strict";
import test from "node:test";
import { MAX_MOTIVATION_BYTES, motivationExtension, parseAmbassadorForm } from "./validate";

function form(fields: Record<string, string | string[]>) {
  return {
    get: (k: string) => {
      const v = fields[k];
      return Array.isArray(v) ? v[0] : v;
    },
    getAll: (k: string) => {
      const v = fields[k];
      return v === undefined ? [] : Array.isArray(v) ? v : [v];
    },
  };
}

const base = { name: " Sophie de Vries ", email: "Sophie@Example.nl", city: "Utrecht", adult: "on" };

test("accepts text motivation and cleans the input", () => {
  const f = form({ ...base, motivationText: "Ik breng graag mensen samen.", roles: ["host", "fill", "host", "hack"], locale: "en" });
  const r = parseAmbassadorForm(f.get, f.getAll, null);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.input.name, "Sophie de Vries");
  assert.equal(r.input.email, "sophie@example.nl");
  assert.deepEqual(r.input.roles, ["host", "fill"]);
  assert.equal(r.input.locale, "en");
  assert.equal(r.input.phone, null);
});

test("accepts a document instead of text", () => {
  const f = form(base);
  const r = parseAmbassadorForm(f.get, f.getAll, { name: "motivatie.PDF", size: 1000 });
  assert.ok(r.ok);
});

test("rejects missing fields, unknown city, no 18+, no motivation, wrong or large file", () => {
  const cases: Array<[Record<string, string>, { name: string; size: number } | null, string]> = [
    [{ ...base, name: "" }, null, "required"],
    [{ ...base, email: "geen-mail" }, null, "required"],
    [{ ...base, city: "Groningen" }, null, "required"],
    [{ ...base, adult: "" }, null, "adult"],
    [base, null, "motivation"],
    [base, { name: "cv.png", size: 10 }, "file"],
    [base, { name: "brief.docx", size: MAX_MOTIVATION_BYTES + 1 }, "fileSize"],
  ];
  for (const [fields, file, error] of cases) {
    const f = form(fields);
    const r = parseAmbassadorForm(f.get, f.getAll, file);
    assert.deepEqual(r, { ok: false, error });
  }
});

test("only pdf, doc and docx", () => {
  assert.equal(motivationExtension("a.pdf"), "pdf");
  assert.equal(motivationExtension("a.final.DOCX"), "docx");
  assert.equal(motivationExtension("a.exe"), null);
  assert.equal(motivationExtension("noext"), null);
});
