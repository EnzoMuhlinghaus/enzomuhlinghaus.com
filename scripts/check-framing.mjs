#!/usr/bin/env node
// Guards the one thing the repo cannot re-derive for itself: how each photo is
// framed. Both halves matter, because framing is a product of the two together —
//
//   1. the CSS numbers (object-position / scale / transform-origin / box height),
//      which belong to the design and are transcribed here verbatim;
//   2. the aspect ratio of the photo they are applied to. `object-position: 88% 26%`
//      means "88% across, 26% down" of *whatever* is in the file, so silently
//      re-cropping a photo moves the framing just as surely as editing the CSS.
//
// This exists because of a real regression: a photo was re-exported as a hand-cropped
// landscape and the hero's `88% 26%` was "fixed" to `50% 50%` to match it. The page
// still looked plausible, so nothing caught it. Check (2) would have.
//
// GROUND TRUTH — Claude Design project "Enzo's Personal Website Design"
//   projectId 96d7b1a6-139c-4c81-af68-b170975927d0
//   file      "Homepage v2: Field Journal.dc.html"
//   read      2026-07-27 via the claude_design MCP (DesignSync → get_file)
// The `design` field on each rule below is the verbatim inline style from that
// file's <img> tag. If the design changes, re-read it with DesignSync and update
// this file in the same commit as the CSS — never the CSS alone.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// ---------------------------------------------------------------- CSS framing

const RULES = [
  {
    label: 'Home hero — the mounted print',
    file: 'src/pages/index.astro',
    design:
      'width:100%;height:363px;object-fit:cover;object-position:88% 26%;display:block;transform:scale(1.02);transform-origin:75% 30%',
    must: ['height: 363px;', 'object-position: 88% 26%;', 'transform: scale(1.02);', 'transform-origin: 75% 30%;'],
  },
  {
    label: 'Endurance — the 70.3 finish shot',
    file: 'src/pages/index.astro',
    design: 'width:100%;height:162px;object-fit:cover;object-position:50% 18%;display:block',
    must: ['height: 162px;', 'object-position: 50% 18%;'],
  },
  {
    label: 'Work — the Captain Wallet office note',
    file: 'src/pages/index.astro',
    design: 'width:100%;height:170px;object-fit:cover;object-position:50% 45%;display:block',
    must: ['height: 170px;', 'object-position: 50% 45%;'],
  },
  {
    label: 'Home contents — 70.3 thumb (128×96)',
    file: 'src/data/journal.ts',
    design: 'width:128px;height:96px;object-fit:cover;object-position:47% 4%;display:block;transform:scale(1.6);transform-origin:47% 2%',
    must: ["position: '47% 4%', scale: 1.6, origin: '47% 2%'"],
  },
  {
    label: 'Home contents — desk thumb (128×96)',
    file: 'src/data/journal.ts',
    design: 'width:128px;height:96px;object-fit:cover;object-position:55% 75%;display:block',
    must: ["position: '55% 75%'"],
  },
  {
    label: 'Home contents — Vancouver thumb (128×96)',
    file: 'src/data/journal.ts',
    design: 'width:128px;height:96px;object-fit:cover;object-position:60% 55%;display:block;transform:scale(1.2);transform-origin:60% 55%',
    must: ["position: '60% 55%', scale: 1.2"],
  },
];

// The design's polaroids are <image-slot shape="rect"> with no object-position,
// i.e. the CSS default. An object-position appearing here would be an invention.
const POLAROID = { file: 'src/components/journal/Polaroid.astro', mustNot: 'object-position' };

// Every literal object-position in the page CSS must be one of the three above;
// a fourth means someone framed a new image without recording it here.
const EXPECTED_LITERAL_POSITIONS = 3;

// ------------------------------------------------------------ photo geometry
// Aspect = width/height of the committed file. These are the *uncropped* source
// frames. Compressing and downscaling a photo must not change these; re-cropping
// does. Tolerance absorbs integer rounding from a resize, nothing more.
const ASPECT_TOLERANCE = 0.01;
const PHOTOS = {
  'moi.webp': 0.75,
  'annecy.webp': 0.75,
  'boston.webp': 0.75,
  'crest.webp': 0.75,
  'desk.webp': 0.75,
  'edinburgh.webp': 0.75,
  'paris.webp': 0.75,
  'ramen.webp': 0.75,
  'tokyo.webp': 0.75,
  'vancouver.webp': 0.75,
  'new-york.webp': 4 / 3,
  'captain-wallet.webp': 1.5,
  'race-703-finish.webp': 2 / 3,
  // og-card.jpg is deliberately excluded: it is a purpose-cut 1200×630 social
  // card, never rendered on the page, and so not governed by the design.
};

/** Intrinsic size of a WebP or JPEG, without pulling in a dependency. */
function dimensions(buf) {
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') {
      return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
    }
    throw new Error(`unrecognised WebP chunk "${chunk}"`);
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o < buf.length) {
      if (buf[o] !== 0xff) { o++; continue; }
      const marker = buf[o + 1];
      // SOF0..SOF15 carry the frame size; DHT/JPG/DAC in that range do not.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) };
      }
      o += 2 + buf.readUInt16BE(o + 2);
    }
  }
  throw new Error('unrecognised image format');
}

// ------------------------------------------------------------------- run them

const failures = [];

for (const rule of RULES) {
  const src = read(rule.file);
  for (const needle of rule.must) {
    if (!src.includes(needle)) {
      failures.push(
        `${rule.label}\n    ${rule.file} is missing:  ${needle}\n    design says:  ${rule.design}`,
      );
    }
  }
}

if (read(POLAROID.file).includes(POLAROID.mustNot)) {
  failures.push(
    `Travel polaroids\n    ${POLAROID.file} sets ${POLAROID.mustNot}, but the design\n    uses <image-slot shape="rect"> with no object-position (CSS default).`,
  );
}

const literals = (read('src/pages/index.astro').match(/object-position:\s*\d/g) ?? []).length;
if (literals !== EXPECTED_LITERAL_POSITIONS) {
  failures.push(
    `src/pages/index.astro has ${literals} literal object-position rules, expected ${EXPECTED_LITERAL_POSITIONS}.\n` +
      `    A new one means an image was framed by hand — add it to scripts/check-framing.mjs\n` +
      `    with the matching design value, or remove it.`,
  );
}

const dir = 'src/assets/photos';
for (const [file, expected] of Object.entries(PHOTOS)) {
  let actual;
  try {
    const { w, h } = dimensions(readFileSync(join(root, dir, file)));
    actual = w / h;
  } catch (err) {
    failures.push(`${dir}/${file}\n    could not read dimensions: ${err.message}`);
    continue;
  }
  if (Math.abs(actual - expected) / expected > ASPECT_TOLERANCE) {
    failures.push(
      `${dir}/${file} has been re-cropped\n` +
        `    aspect is ${actual.toFixed(4)}, expected ${expected.toFixed(4)}.\n` +
        `    Photos may be resized and recompressed, never cropped — the design frames\n` +
        `    them in CSS, and a crop silently shifts every object-position applied to it.`,
    );
  }
}

const untracked = readdirSync(join(root, dir)).filter(
  (f) => !(f in PHOTOS) && f !== 'og-card.jpg' && !f.startsWith('.'),
);
if (untracked.length) {
  failures.push(
    `${dir} has photos with no recorded aspect: ${untracked.join(', ')}\n` +
      `    Add them to PHOTOS in scripts/check-framing.mjs so a later crop is caught.`,
  );
}

if (failures.length) {
  console.error(`\n✗ framing has drifted from the design (${failures.length} problem${failures.length > 1 ? 's' : ''}):\n`);
  for (const f of failures) console.error(`  • ${f}\n`);
  console.error('  Ground truth: "Homepage v2: Field Journal.dc.html" in the Claude Design');
  console.error('  project 96d7b1a6-139c-4c81-af68-b170975927d0 (DesignSync → get_file).\n');
  process.exit(1);
}

console.log(`✓ framing matches the design (${RULES.length} rules, ${Object.keys(PHOTOS).length} photos)`);
