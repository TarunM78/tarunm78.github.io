/**
 * Generates the isolated-test calibration target for the callout component.
 *
 * This is a TEST FIXTURE, not site content. It is deliberately not a drawing of
 * any real hardware: it exists so that callout anchor placement can be checked
 * against printed coordinates to the pixel, rather than by eye.
 *
 * Delete alongside src/pages/test/ before deploy.
 *
 *   node scripts/make-test-fixture.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const W = 1600;
const H = 1000;

// The four anchors from CONTENT.md's site hero block.
const ANCHORS = [
  { x: 0.3, y: 0.27 },
  { x: 0.67, y: 0.34 },
  { x: 0.5, y: 0.7 },
  { x: 0.15, y: 0.55 },
];

const crosshair = ({ x, y }) => {
  // Numbers, not strings: `px + r` on a string silently concatenates and sends
  // the crosshair arm off to x=4803416.
  const px = Math.round(x * W);
  const py = Math.round(y * H);
  const r = 34;
  return `
    <g stroke="#3A3A36" stroke-width="1.5" fill="none">
      <circle cx="${px}" cy="${py}" r="${r}" />
      <path d="M${px - r - 16},${py} H${px - 8} M${px + 8},${py} H${px + r + 16}
               M${px},${py - r - 16} V${py - 8} M${px},${py + 8} V${py + r + 16}" />
    </g>
    <circle cx="${px}" cy="${py}" r="3.5" fill="#3A3A36" />
    <text x="${px + r + 24}" y="${py - 10}"
          font-family="monospace" font-size="21" fill="#3A3A36"
          letter-spacing="1.5">${x.toFixed(2)}, ${y.toFixed(2)}</text>
    <text x="${px + r + 24}" y="${py + 16}"
          font-family="monospace" font-size="21" fill="#8A8A82"
          letter-spacing="1.5">${px} x ${py} PX</text>`;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="fine" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M20 0 L0 0 0 20" fill="none" stroke="#D8D8D0" stroke-width="1" />
    </pattern>
    <pattern id="coarse" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M100 0 L0 0 0 100" fill="none" stroke="#C2C2B8" stroke-width="1" />
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="#ECEAE2" />
  <rect width="${W}" height="${H}" fill="url(#fine)" />
  <rect width="${W}" height="${H}" fill="url(#coarse)" />

  <!-- edge and centre references, so non-uniform scaling is visible if it happens -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#8A8A82" stroke-width="2" />
  <path d="M${W / 2},0 V${H} M0,${H / 2} H${W}" stroke="#C2C2B8" stroke-width="2" stroke-dasharray="12 10" fill="none" />

  <!-- a true square: if the overlay ever scales non-uniformly, this stops being square -->
  <rect x="${W / 2 - 150}" y="${H / 2 - 150}" width="300" height="300"
        fill="none" stroke="#8A8A82" stroke-width="2" stroke-dasharray="6 6" />
  <text x="${W / 2}" y="${H / 2 + 6}" text-anchor="middle"
        font-family="monospace" font-size="24" fill="#8A8A82" letter-spacing="3">300 x 300 PX SQUARE</text>

  <text x="28" y="44" font-family="monospace" font-size="26" fill="#3A3A36" letter-spacing="3">
    CALLOUT TEST FIXTURE — NOT SITE CONTENT
  </text>
  <text x="28" y="76" font-family="monospace" font-size="21" fill="#8A8A82" letter-spacing="2">
    ${W} x ${H} PX — 20 PX FINE GRID / 100 PX COARSE
  </text>

  ${ANCHORS.map(crosshair).join('\n')}
</svg>`;

const outDir = fileURLToPath(new URL('../src/assets/', import.meta.url));
await mkdir(outDir, { recursive: true });

const out = new URL('../src/assets/callout-test-target.png', import.meta.url);
await writeFile(new URL('../src/assets/callout-test-target.svg', import.meta.url), svg);
await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(out));

console.log(`wrote ${fileURLToPath(out)} (${W}x${H})`);
