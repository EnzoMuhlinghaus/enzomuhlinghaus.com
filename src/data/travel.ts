// Travel spread (entry 03): two stacks of taped polaroids, positioned by hand.
// x/y/w are px within each page's polaroid canvas and `rot` is the tilt in
// degrees — the same absolute layout as `_polaroidsL` / `_polaroidsR` in
// "Homepage v2: Field Journal". Below the mobile breakpoint the pages fall back
// to a plain flow layout and these coordinates are ignored.
import type { ImageMetadata } from 'astro';
import type { CountryCode } from '../components/Flag.astro';

import annecy from '../assets/photos/annecy.webp';
import boston from '../assets/photos/boston.webp';
import crest from '../assets/photos/crest.webp';
import edinburgh from '../assets/photos/edinburgh.webp';
import newYork from '../assets/photos/new-york.webp';
import paris from '../assets/photos/paris.webp';
import ramen from '../assets/photos/ramen.webp';
import tokyo from '../assets/photos/tokyo.webp';
import vancouver from '../assets/photos/vancouver.webp';

/** Which corners the washi tape holds the polaroid by. */
export type TapeVariant = 'tc' | 'tl' | 'tr' | 'two';

export interface Polaroid {
  id: string;
  /** null renders the hatched empty frame — the photo hasn't been added yet. */
  photo: ImageMetadata | null;
  place: string;
  country: CountryCode;
  year: string;
  caption: string;
  rot: number;
  x: number;
  y: number;
  w: number;
  tape: TapeVariant;
}

export const POLAROIDS_LEFT: Polaroid[] = [
  {
    id: 'vancouver',
    photo: vancouver,
    place: 'Vancouver',
    country: 'CA',
    year: 'home now',
    caption: 'the one-way ticket.',
    rot: -4.5,
    x: 0,
    y: 2,
    w: 236,
    tape: 'tc',
  },
  {
    id: 'tokyo',
    photo: tokyo,
    place: 'Tokyo',
    country: 'JP',
    year: '2025',
    caption: 'the Skytree from Sumida Park.',
    rot: 4.5,
    x: 268,
    y: 48,
    w: 194,
    tape: 'tl',
  },
  {
    id: 'annecy',
    photo: annecy,
    place: 'Annecy',
    country: 'FR',
    year: '2021–26',
    caption: 'home for five years.',
    rot: 3,
    x: 6,
    y: 256,
    w: 232,
    tape: 'two',
  },
  {
    id: 'new-york',
    photo: newYork,
    place: 'New York',
    country: 'US',
    year: '2022',
    caption: 'looked up the whole trip.',
    rot: -6,
    x: 244,
    y: 326,
    w: 190,
    tape: 'tr',
  },
];

export const POLAROIDS_RIGHT: Polaroid[] = [
  {
    id: 'paris',
    photo: paris,
    place: 'Paris',
    country: 'FR',
    year: '',
    caption: 'second home — friends & unforgettable shows.',
    rot: 4,
    x: 0,
    y: 2,
    w: 232,
    tape: 'tl',
  },
  {
    // Crest and its keep, on the Drôme.
    id: 'drome',
    photo: crest,
    place: 'La Drôme',
    country: 'FR',
    year: 'born here',
    caption: 'where I was born and grew up.',
    rot: -4.5,
    x: 236,
    y: 50,
    w: 230,
    tape: 'tc',
  },
  {
    id: 'kyoto',
    photo: ramen,
    place: 'Kyoto',
    country: 'JP',
    year: '2025',
    caption: 'best ramen ever.',
    rot: -3,
    x: 20,
    y: 262,
    w: 206,
    tape: 'tr',
  },
  {
    id: 'boston',
    photo: boston,
    place: 'Boston',
    country: 'US',
    year: '2022',
    caption: 'the red brick of Harvard.',
    rot: 5.5,
    x: 270,
    y: 298,
    w: 198,
    tape: 'two',
  },
  {
    id: 'edinburgh',
    photo: edinburgh,
    place: 'Edinburgh',
    country: 'SCT',
    year: '2023',
    caption: 'Dean Village on the Water of Leith.',
    rot: -3,
    x: 66,
    y: 516,
    w: 190,
    tape: 'tc',
  },
];

/** Absolute wrapper placement for one polaroid on a desktop-sized page. */
export function polaroidStyle(p: Polaroid): string {
  return `left:${p.x}px;top:${p.y}px;width:${p.w}px;transform:rotate(${p.rot}deg)`;
}

/** The one or two tape strips holding a polaroid down. */
export function tapeStyles(p: Polaroid): string[] {
  switch (p.tape) {
    case 'tl':
      return ['top:-13px;left:-12px;width:86px;height:24px;transform:rotate(-42deg)'];
    case 'tr':
      return ['top:-13px;right:-12px;width:86px;height:24px;transform:rotate(42deg)'];
    case 'two':
      return [
        'top:-12px;left:4px;width:74px;height:22px;transform:rotate(-9deg)',
        'top:-12px;right:4px;width:74px;height:22px;transform:rotate(8deg)',
      ];
    default:
      return [
        `top:-11px;left:50%;margin-left:-39px;width:78px;height:22px;transform:rotate(${p.rot > 0 ? -5 : 4}deg)`,
      ];
  }
}
