/**
 * One-off PWA icon generator (no image tooling required).
 *
 * Draws an on-brand Muhasabah icon — a white crescent + star on a deep green
 * radial-gradient tile — and writes valid RGBA PNGs using only node:zlib.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "images");

/* ── geometry (all coordinates normalised to a 0..1 unit box) ─────────── */

/** Crescent = big disc minus an offset disc. */
const CRESCENT_OUTER = { cx: 0.46, cy: 0.5, r: 0.28 };
const CRESCENT_BITE = { cx: 0.545, cy: 0.455, r: 0.255 };

/** Five-pointed star sitting inside the crescent's opening. */
const STAR = { cx: 0.66, cy: 0.5, r: 0.115, inner: 0.42, rotation: -Math.PI / 2 };

/** Background gradient stops (deep emerald, lighter in the middle). */
const BG_CENTER = [10, 112, 82]; // #0a7052
const BG_EDGE = [4, 51, 40]; // #043328
const FG = [255, 255, 255];

function inCircle(px, py, c) {
  const dx = px - c.cx;
  const dy = py - c.cy;
  return dx * dx + dy * dy <= c.r * c.r;
}

function inCrescent(px, py) {
  return inCircle(px, py, CRESCENT_OUTER) && !inCircle(px, py, CRESCENT_BITE);
}

/** Ray-casting point-in-polygon over the 10-vertex star. */
const STAR_POLY = (() => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const isOuter = i % 2 === 0;
    const radius = isOuter ? STAR.r : STAR.r * STAR.inner;
    const angle = STAR.rotation + (i * Math.PI) / 5;
    pts.push([STAR.cx + Math.cos(angle) * radius, STAR.cy + Math.sin(angle) * radius]);
  }
  return pts;
})();

function inStar(px, py) {
  let inside = false;
  for (let i = 0, j = STAR_POLY.length - 1; i < STAR_POLY.length; j = i++) {
    const [xi, yi] = STAR_POLY[i];
    const [xj, yj] = STAR_POLY[j];
    const intersects =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function inMark(u, v) {
  return inCrescent(u, v) || inStar(u, v);
}

/** Radial background colour for a normalised point. */
function backgroundAt(u, v) {
  const dx = u - 0.5;
  const dy = v - 0.5;
  const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 0.7071);
  const k = Math.pow(t, 1.25);
  return [
    BG_CENTER[0] + (BG_EDGE[0] - BG_CENTER[0]) * k,
    BG_CENTER[1] + (BG_EDGE[1] - BG_CENTER[1]) * k,
    BG_CENTER[2] + (BG_EDGE[2] - BG_CENTER[2]) * k,
  ];
}

/* ── rendering (4×4 supersampling ⇒ clean anti-aliased edges) ─────────── */

function render(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1)); // +1 filter byte per row
  const S = 4;
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const u = (x + (sx + 0.5) / S) / size;
          const v = (y + (sy + 0.5) / S) / size;
          if (inMark(u, v)) hits++;
        }
      }
      const a = hits / (S * S);
      const [br, bg, bb] = backgroundAt((x + 0.5) / size, (y + 0.5) / size);
      const o = rowStart + 1 + x * 4;
      raw[o] = Math.round(br + (FG[0] - br) * a);
      raw[o + 1] = Math.round(bg + (FG[1] - bg) * a);
      raw[o + 2] = Math.round(bb + (FG[2] - bb) * a);
      raw[o + 3] = 255;
    }
  }
  return raw;
}

/* ── PNG container ────────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rgba, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ── driver ───────────────────────────────────────────────────────────── */

const TARGETS = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const { file, size } of TARGETS) {
  const png = encodePng(size, size, render(size));
  const path = join(OUT_DIR, file);
  writeFileSync(path, png);

  // Self-check: decode IHDR back out of the bytes we just wrote.
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== size || height !== size) {
    throw new Error(`${file}: expected ${size}x${size}, got ${width}x${height}`);
  }
  console.log(`${file}: ${width}x${height}, ${png.length} bytes`);
}
