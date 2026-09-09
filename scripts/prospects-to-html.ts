/**
 * Zet een prospect-CSV om in een doorzoekbare HTML-pagina.
 *
 *   npx tsx scripts/prospects-to-html.ts tmp/prospects-rotterdam.csv "Rotterdam"
 *
 * De data gaat rechtstreeks van CSV naar HTML, zodat er niets overgetikt hoeft
 * te worden. Output staat naast de CSV, met .html als extensie.
 */
import { readFileSync, writeFileSync } from "node:fs";

const csvPath = process.argv[2] ?? "tmp/prospects-rotterdam.csv";
const city = process.argv[3] ?? "Rotterdam";

/** Minimale CSV-parser: velden staan altijd tussen dubbele quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const raw = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const [header, ...dataRows] = parseCsv(raw);
const index = (name: string) => header.indexOf(name);

type Venue = {
  naam: string;
  categorie: string;
  adres: string;
  maps: string;
  website: string;
  email: string;
  prijs: string;
  telefoon: string;
  rating: string;
  reviews: number;
};

const venues: Venue[] = dataRows
  .filter((row) => row[index("naam")])
  .map((row) => ({
    naam: row[index("naam")] ?? "",
    categorie: row[index("categorie")] ?? "",
    adres: row[index("adres")] ?? "",
    maps: row[index("google maps")] ?? "",
    website: row[index("website")] ?? "",
    email: row[index("email")] ?? "",
    prijs: row[index("prijs")] ?? "",
    telefoon: row[index("telefoon")] ?? "",
    rating: row[index("rating")] ?? "",
    reviews: Number(row[index("reviews")] ?? 0) || 0,
  }));

const wineBars = venues.filter((v) =>
  v.categorie.toLowerCase().includes("wijn"),
).length;
const withEmail = venues.filter((v) => v.email).length;

const html = `<title>Wijnprospects ${city}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap">
<style>
  :root {
    --ground: #f7f2ec;
    --surface: #fffdfa;
    --surface-alt: #f1e9e1;
    --ink: #2b0d12;
    --ink-soft: #7a5c60;
    --wine: #5a0f1b;
    --gold: #b8873f;
    --line: rgba(43, 13, 18, 0.13);
    --line-strong: rgba(43, 13, 18, 0.26);
    --focus: #5a0f1b;
  }
  :root:not([data-theme="light"]) {
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #170e11;
      --surface: #201317;
      --surface-alt: #2a191e;
      --ink: #f3e9e4;
      --ink-soft: #b39aa0;
      --wine: #e5a9b3;
      --gold: #d8ab63;
      --line: rgba(243, 233, 228, 0.14);
      --line-strong: rgba(243, 233, 228, 0.3);
      --focus: #e5a9b3;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --ground: #170e11;
    --surface: #201317;
    --surface-alt: #2a191e;
    --ink: #f3e9e4;
    --ink-soft: #b39aa0;
    --wine: #e5a9b3;
    --gold: #d8ab63;
    --line: rgba(243, 233, 228, 0.14);
    --line-strong: rgba(243, 233, 228, 0.3);
    --focus: #e5a9b3;
    color-scheme: dark;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: "DM Sans", system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.5;
  }
  .wrap { max-width: 1180px; margin: 0 auto; padding: 40px 24px 72px; }

  header { display: flex; flex-direction: column; gap: 14px; }
  h1 {
    margin: 0;
    font-family: "Cormorant Garamond", Georgia, serif;
    font-size: clamp(2.1rem, 4vw, 3rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--wine);
    text-wrap: balance;
  }
  .lede { margin: 0; max-width: 60ch; color: var(--ink-soft); }
  .rule { width: 84px; height: 3px; background: var(--gold); }

  .tally { display: flex; flex-wrap: wrap; gap: 28px; margin: 26px 0 0; padding: 0; list-style: none; }
  .tally div { font-family: "Cormorant Garamond", Georgia, serif; font-size: 2rem; line-height: 1; color: var(--wine); font-variant-numeric: tabular-nums; }
  .tally span { display: block; margin-top: 4px; font-size: 0.72rem; letter-spacing: 0.09em; text-transform: uppercase; color: var(--ink-soft); }

  .controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 30px 0 14px; }
  input[type="search"] {
    flex: 1 1 260px;
    min-width: 0;
    padding: 10px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 4px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  input[type="search"]::placeholder { color: var(--ink-soft); }
  .chip {
    padding: 8px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .chip[aria-pressed="true"] { background: var(--wine); border-color: var(--wine); color: var(--surface); }
  :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

  .count { margin: 0 0 12px; font-size: 0.85rem; color: var(--ink-soft); font-variant-numeric: tabular-nums; }

  .table-scroll { overflow-x: auto; border-top: 1px solid var(--line-strong); }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th {
    position: sticky; top: 0; z-index: 1;
    background: var(--ground);
    text-align: left;
    padding: 12px 14px 10px;
    font-size: 0.7rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--ink-soft);
    font-weight: 500;
    border-bottom: 1px solid var(--line-strong);
    white-space: nowrap;
  }
  td { padding: 13px 14px; border-bottom: 1px solid var(--line); vertical-align: top; }
  tbody tr:nth-child(even) { background: var(--surface-alt); }
  .name { font-weight: 500; }
  .addr { display: block; margin-top: 2px; font-size: 0.8rem; color: var(--ink-soft); }
  .cat { font-size: 0.78rem; color: var(--ink-soft); white-space: nowrap; }
  .cat.wine { color: var(--wine); font-weight: 500; }
  a { color: var(--wine); text-decoration-thickness: 1px; text-underline-offset: 2px; }
  a:hover { text-decoration-thickness: 2px; }
  .none { color: var(--ink-soft); font-style: italic; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .stars { color: var(--gold); }
  footer { margin-top: 34px; font-size: 0.8rem; color: var(--ink-soft); max-width: 70ch; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="wrap">
  <header>
    <h1>Wijnprospects ${city}</h1>
    <div class="rule"></div>
    <p class="lede">Zaken met een wijnkaart, gesorteerd op wijnbars eerst. Uit Google Maps, met het e-mailadres dat op hun eigen site staat.</p>
    <ul class="tally">
      <li><div>${venues.length}</div><span>zaken</span></li>
      <li><div>${wineBars}</div><span>wijnbars</span></li>
      <li><div>${withEmail}</div><span>met e-mail</span></li>
    </ul>
  </header>

  <div class="controls">
    <input type="search" id="q" placeholder="Zoek op naam, categorie of straat" aria-label="Zoeken">
    <button class="chip" id="onlyWine" aria-pressed="false">Alleen wijnbars</button>
    <button class="chip" id="onlyEmail" aria-pressed="false">Alleen met e-mail</button>
  </div>
  <p class="count" id="count"></p>

  <div class="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Zaak</th>
          <th>Categorie</th>
          <th>E-mail</th>
          <th>Prijs p.p.</th>
          <th>Telefoon</th>
          <th class="num">Rating</th>
        </tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
  </div>

  <footer>Gescraped uit Google Maps. Het e-mailadres komt van de website van de zaak, dus het is niet altijd een <code>info@</code>-adres — controleer voor je mailt. Herhaalbaar voor andere steden met <code>scripts/scrape-venue-prospects.ts</code>.</footer>
</div>

<script>
  const venues = ${JSON.stringify(venues)};
  const rows = document.getElementById("rows");
  const count = document.getElementById("count");
  const q = document.getElementById("q");
  const onlyWine = document.getElementById("onlyWine");
  const onlyEmail = document.getElementById("onlyEmail");

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function render() {
    const term = q.value.trim().toLowerCase();
    const wineOnly = onlyWine.getAttribute("aria-pressed") === "true";
    const emailOnly = onlyEmail.getAttribute("aria-pressed") === "true";

    const list = venues.filter((v) => {
      if (wineOnly && !v.categorie.toLowerCase().includes("wijn")) return false;
      if (emailOnly && !v.email) return false;
      if (!term) return true;
      return (v.naam + " " + v.categorie + " " + v.adres).toLowerCase().includes(term);
    });

    count.textContent = list.length + " van " + venues.length + " zaken";
    rows.innerHTML = list.map((v) => {
      const isWine = v.categorie.toLowerCase().includes("wijn");
      const naam = v.maps
        ? '<a href="' + esc(v.maps) + '" target="_blank" rel="noopener">' + esc(v.naam) + "</a>"
        : esc(v.naam);
      const email = v.email
        ? '<a href="mailto:' + esc(v.email) + '">' + esc(v.email) + "</a>"
        : '<span class="none">bellen</span>';
      const prijs = v.prijs ? esc(v.prijs) : '<span class="none">—</span>';
      const tel = v.telefoon
        ? '<a href="tel:' + esc(v.telefoon.replace(/\\s/g, "")) + '">' + esc(v.telefoon) + "</a>"
        : '<span class="none">—</span>';
      const rating = v.rating
        ? '<span class="stars">★</span> ' + esc(v.rating) + ' <span class="cat">(' + v.reviews + ")</span>"
        : '<span class="none">—</span>';
      return (
        "<tr><td><span class='name'>" + naam + "</span><span class='addr'>" + esc(v.adres.replace(", Nederland", "")) + "</span></td>" +
        "<td class='cat" + (isWine ? " wine" : "") + "'>" + esc(v.categorie) + "</td>" +
        "<td>" + email + "</td><td class='cat'>" + prijs + "</td><td>" + tel + "</td><td class='num'>" + rating + "</td></tr>"
      );
    }).join("");
  }

  for (const button of [onlyWine, onlyEmail]) {
    button.addEventListener("click", () => {
      button.setAttribute("aria-pressed", button.getAttribute("aria-pressed") === "true" ? "false" : "true");
      render();
    });
  }
  q.addEventListener("input", render);
  render();
</script>
`;

const outPath = csvPath.replace(/\.csv$/, ".html");
writeFileSync(outPath, html, "utf8");
console.log(`${venues.length} zaken weggeschreven naar ${outPath}`);
