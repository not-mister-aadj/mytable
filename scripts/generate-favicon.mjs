import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "scripts/icon-source.png");
const publicDir = join(root, "public");

const sizes = [16, 32, 48];
const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(source)
      .resize(size, size, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer(),
  ),
);

// Minimal ICO container (PNG-in-ICO style used by many generators)
function buildIco(buffers) {
  const count = buffers.length;
  const header = 6 + count * 16;
  let offset = header;
  const entries = buffers.map((buf, i) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0);
    entry.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 1);
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

writeFileSync(join(publicDir, "favicon.ico"), buildIco(pngBuffers));

await sharp(source)
  .resize(32, 32, { fit: "contain", background: "#ffffff" })
  .png()
  .toFile(join(publicDir, "icon.png"));

await sharp(source)
  .resize(180, 180, { fit: "contain", background: "#ffffff" })
  .png()
  .toFile(join(publicDir, "apple-icon.png"));

console.log("Wrote public/favicon.ico, icon.png, apple-icon.png");
