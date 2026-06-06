import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const c = "#C19A6B";
const s = `stroke="${c}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ${s}/><path d="M16 2v4M8 2v4M3 10h18" ${s}/></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" ${s}/><path d="M12 6v6l4 2" ${s}/></svg>`,
  people: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" ${s}/><circle cx="9" cy="7" r="4" ${s}/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" ${s}/></svg>`,
  card: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" ${s}/><path d="M2 10h20" ${s}/></svg>`,
  pin: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" ${s}/><circle cx="12" cy="10" r="3" ${s}/></svg>`,
  utensils: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" ${s}/></svg>`,
  flag: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" ${s}/><path d="M4 22v-7" ${s}/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" ${s}/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" ${s}/></svg>`,
  leaf: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" ${s}/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" ${s}/></svg>`,
  wineGlasses: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48"><path d="M12 10c0 5 1.5 8.5 4.5 10.5V30h-2v4h7v-4h-2V20.5C22.5 18.5 24 15 24 10" ${s}/><path d="M36 10c0 5-1.5 8.5-4.5 10.5V30h2v4h-7v-4h2V20.5C25.5 18.5 24 15 24 10" ${s}/><path d="M12 10h12M24 10h12M18 32h12" ${s}/></svg>`,
};

const outDir = join(process.cwd(), "public", "email", "icons");
await mkdir(outDir, { recursive: true });

for (const [name, svg] of Object.entries(icons)) {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await writeFile(join(outDir, `${name}.png`), png);
  console.log(`OK: ${name}.png`);
}
