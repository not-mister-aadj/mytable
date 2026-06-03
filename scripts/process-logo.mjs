import sharp from "sharp";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const input = join(__dirname, "../public/logo.png");
const outputFull = join(__dirname, "../public/logo-transparent.png");
const outputMark = join(__dirname, "../public/logo-mark.png");

const CREAM = { r: 247, g: 241, b: 232 };

const colorDistance = (r, g, b, target) =>
  Math.sqrt(
    (r - target.r) ** 2 + (g - target.g) ** 2 + (b - target.b) ** 2,
  );

function removeBackground(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = colorDistance(r, g, b, CREAM);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    if (dist < 28 || (luminance > 220 && dist < 55)) {
      data[i + 3] = 0;
    } else if (dist < 70) {
      const alpha = Math.round(((dist - 28) / 42) * 255);
      data[i + 3] = Math.min(data[i + 3], alpha);
    }
  }
  return data;
}

/** Find gap between wordmark and tagline; keep full letters above */
function findWordmarkBottom(data, width, height) {
  const rowCounts = [];
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 35) count++;
    }
    rowCounts.push(count);
  }

  const peak = Math.max(...rowCounts.slice(0, Math.floor(height * 0.7)));

  for (let y = Math.floor(height * 0.52); y < height - 10; y++) {
    const gapAvg =
      rowCounts.slice(y, y + 5).reduce((sum, c) => sum + c, 0) / 5;
    const belowAvg =
      rowCounts.slice(y + 5, y + 12).reduce((sum, c) => sum + c, 0) / 7;

    if (gapAvg < peak * 0.15 && belowAvg > peak * 0.25) {
      return y + 10;
    }
  }

  return Math.floor(height * 0.74);
}

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

removeBackground(data);

const fullPng = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ threshold: 10 })
  .png({ quality: 100 })
  .toBuffer({ resolveWithObject: true });

await sharp(fullPng.data).png().toFile(outputFull);

const { data: fullData, info: fullInfo } = await sharp(fullPng.data)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const markHeight = 282;

await sharp(fullPng.data)
  .extract({
    left: 0,
    top: 0,
    width: fullInfo.width,
    height: markHeight,
  })
  .png()
  .toFile(outputMark);

const fullMeta = await sharp(outputFull).metadata();
const markMeta = await sharp(outputMark).metadata();
console.log(`Full: ${outputFull} (${fullMeta.width}x${fullMeta.height})`);
console.log(`Mark: ${outputMark} (${markMeta.width}x${markMeta.height})`);
