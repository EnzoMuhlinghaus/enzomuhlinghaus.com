// The book's structure: which spreads exist, in order, and the contents rows
// that link to them from the Home right-hand page.
import type { ImageMetadata } from 'astro';

import desk from '../assets/photos/desk.webp';
import race703 from '../assets/photos/race-703-finish.webp';
import vancouver from '../assets/photos/vancouver.webp';
import type { Spread } from './spreads';

export { SPREADS, type Spread } from './spreads';

export interface JournalRow {
  /** "entry 01" */
  no: string;
  title: string;
  /** Typewriter subtitle under the title. */
  kicker: string;
  blurb: string;
  /** Which spread the row turns to. */
  target: Spread;
  /** null renders the hatched empty frame — the photo hasn't been added yet. */
  photo: ImageMetadata | null;
  alt: string;
  /** Per-photo crop for the 128×96 thumb — object-position, plus an optional
   *  zoom. Taken from the design, which frames each of these by hand. */
  crop: { position: string; scale?: number; origin?: string };
  /** Thumbnail tilt in degrees, and the tape strips holding it. */
  rot: number;
  tapes: string[];
  /** Blurb tilt — nothing sits perfectly straight. */
  blurbRot: number;
}

export const JOURNAL_ROWS: JournalRow[] = [
  {
    no: 'entry 01',
    title: 'Endurance',
    kicker: 'run · tri · ride',
    blurb: 'Race journal + Toolbox built for my training',
    target: 'endurance',
    photo: race703,
    alt: 'Crossing the line at IRONMAN 70.3 Emilia-Romagna',
    // A tall portrait in a landscape thumb — zoom in and hold the top.
    crop: { position: '47% 4%', scale: 1.6, origin: '47% 2%' },
    rot: -2.5,
    tapes: ['top:-16px;left:34px;width:68px;height:20px;transform:rotate(-5deg)'],
    blurbRot: -0.6,
  },
  {
    no: 'entry 02',
    title: 'Work',
    kicker: 'senior software engineer',
    blurb: '9+ years designing & scaling distributed systems',
    target: 'work',
    photo: desk,
    alt: 'my desk setup',
    crop: { position: '55% 75%' },
    rot: 2,
    tapes: [
      'top:-13px;left:-18px;width:58px;height:20px;transform:rotate(-42deg)',
      'bottom:-13px;right:-18px;width:58px;height:20px;transform:rotate(-40deg)',
    ],
    blurbRot: 0.6,
  },
  {
    no: 'entry 03',
    title: 'Travel',
    kicker: 'home is a moving target',
    blurb: 'Born in France, currently parked in Vancouver',
    target: 'travel',
    photo: vancouver,
    alt: 'Vancouver skyline from Stanley Park',
    crop: { position: '60% 55%', scale: 1.2 },
    rot: -1.6,
    tapes: ['top:-15px;right:22px;width:64px;height:20px;transform:rotate(7deg)'],
    blurbRot: -0.5,
  },
];

/** Links shared by the "say hi" scrap and the Work page. */
export const LINKS = {
  email: 'mailto:pro@enzomuhlinghaus.com',
  linkedin: 'https://www.linkedin.com/in/enzo-muhlinghaus-20030713b/',
  github: 'https://github.com/EnzoMuhlinghaus/',
  instagram: 'https://www.instagram.com/muhlinghausenzo/',
  cv: '/enzo-muhlinghaus-cv.pdf',
};
