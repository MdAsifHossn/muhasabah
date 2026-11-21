/**
 * PWA / favicon generator.
 *
 * Renders the Muhasabah mark (public/images/logo.svg — an emerald tile with a
 * gold ৮-কোণা তারা framing an open book and a flame of নূর) into the PNG sizes
 * the manifest, Apple and the browser tab need. Uses `sharp`, which ships with
 * Next.js.
 *
 *   node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "images");
const svg = readFileSync(join(OUT_DIR, "logo.svg"));

const targets = [
  ["icon-512.png", 512],
  ["icon-192.png", 192],
  ["apple-touch-icon.png", 180],
];

for (const [name, size] of targets) {
  writeFileSync(join(OUT_DIR, name), await sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer());
  console.log(`wrote public/images/${name} (${size}×${size})`);
}

/* favicon.ico — an ICO container holding PNG frames (supported by every modern browser). */
const frames = await Promise.all([16, 32, 48].map((size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer().then((data) => ({ size, data }))));
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
frames.forEach(({ size, data }, index) => {
  const at = 6 + index * 16;
  header.writeUInt8(size, at);
  header.writeUInt8(size, at + 1);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(data.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += data.length;
});
writeFileSync(join(ROOT, "src", "app", "favicon.ico"), Buffer.concat([header, ...frames.map((frame) => frame.data)]));
console.log("wrote src/app/favicon.ico (16/32/48)");
