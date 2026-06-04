/**
 * Build MyTable favicons from scripts/icon-source.png (table symbol only).
 * Run: node scripts/generate-favicon.mjs
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "scripts/icon-source.png");
const outDirs = [join(root, "src/app"), join(root, "public")];

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const icoSizes = [16, 32, 48];

/** Trim white margins, keep burgundy symbol only */
async function loadSymbol() {
  return sharp(source).trim({ threshold: 14 }).png().toBuffer();
}

async function renderSquare(symbol, canvasSize, paddingRatio) {
  const padding = Math.max(1, Math.round(canvasSize * paddingRatio));
  const inner = canvasSize - padding * 2;
  return sharp(symbol)
    .resize(inner, inner, { fit: "contain", background: transparent })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: transparent,
    })
    .png()
    .toBuffer();
}

function buildIco(buffers, sizes) {
  const count = buffers.length;
  const header = 6 + count * 16;
  let offset = header;
  const entries = buffers.map((buf, i) => {
    const entry = Buffer.alloc(16);
    const dim = sizes[i];
    entry.writeUInt8(dim >= 256 ? 0 : dim, 0);
    entry.writeUInt8(dim >= 256 ? 0 : dim, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    return entry;
  });
  return Buffer.concat([
    Buffer.from([0, 0, 1, 0, count, 0]),
    ...entries,
    ...buffers,
  ]);
}

const symbol = await loadSymbol();

const icoBuffers = await Promise.all(
  icoSizes.map((size) => renderSquare(symbol, size, size <= 16 ? 0.04 : 0.06)),
);

const icon32 = await renderSquare(symbol, 32, 0.06);
const icon192 = await renderSquare(symbol, 192, 0.08);
const apple180 = await renderSquare(symbol, 180, 0.08);

const faviconIco = buildIco(icoBuffers, icoSizes);

for (const dir of outDirs) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "favicon.ico"), faviconIco);
  writeFileSync(join(dir, "icon.png"), icon32);
  writeFileSync(join(dir, "apple-icon.png"), apple180);
}

writeFileSync(join(root, "public/apple-touch-icon.png"), apple180);

// Optional larger PNG for future PWA / app icon
writeFileSync(join(root, "public/icon-192.png"), icon192);

console.log("Favicons written to src/app/ and public/");
