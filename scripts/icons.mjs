import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "icon.svg");
const svg = readFileSync(svgPath);

// Maskable icon: render the logo at 80% on a solid bg, leaving the safe zone.
const maskableSvg = Buffer.from(`<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1a0f08"/>
  <g transform="translate(51, 51) scale(0.8)">
    <polygon points="256,90 392,165 392,315 256,390 120,315 120,165"
             fill="#d4b048" stroke="#8a5a20" stroke-width="6"/>
    <text x="256" y="305" font-family="Impact, Arial Black, sans-serif" font-size="180"
          font-weight="900" text-anchor="middle" fill="#1a0f08">TB</text>
  </g>
</svg>`);

const targets = [
  { name: "icon-192.png", size: 192, src: svg },
  { name: "icon-512.png", size: 512, src: svg },
  { name: "icon-512-maskable.png", size: 512, src: maskableSvg },
  { name: "apple-touch-icon.png", size: 180, src: svg },
  { name: "favicon-32.png", size: 32, src: svg },
];

for (const t of targets) {
  const out = join(root, "public", t.name);
  const buf = await sharp(t.src).resize(t.size, t.size).png().toBuffer();
  writeFileSync(out, buf);
  console.log(`OK ${t.name} (${t.size}x${t.size})`);
}

console.log("\nDone.");
