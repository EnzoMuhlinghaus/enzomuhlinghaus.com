// SAMPLE DATA — Enzo plans to build an API that will supply the race journal
// and PR blackboard. Keep every race/PR fact and its display mapping in this
// file so the swap to a fetch is a single-file change.

export interface Race {
  day: string;
  name: string;
  location: string;
  type: string;
  time: string | null;
  rank: number | null;
  field: number | null;
  pr: boolean;
  state: 'done' | 'training';
}

export type PrDistance = '5K' | '10K' | 'Half' | 'Marathon';

export interface PrEntry {
  distance: PrDistance;
  time: string | null;
}

const RACES: Race[] = [
  { day: '17 Mar 2019', name: 'Course des Lumières 10K', location: 'Lyon, FR', type: 'Road Running', time: '41:12', rank: 45, field: 1840, pr: false, state: 'done' },
  { day: '5 Apr 2020', name: 'Semi de Paris', location: 'Paris, FR', type: 'Road Running', time: '1:34:20', rank: 210, field: 6200, pr: false, state: 'done' },
  { day: '10 Oct 2021', name: '10K Champs-Élysées', location: 'Paris, FR', type: 'Road Running', time: '38:50', rank: 12, field: 950, pr: true, state: 'done' },
  { day: '3 Apr 2022', name: 'Marathon de Paris', location: 'Paris, FR', type: 'Road Running', time: '3:42:05', rank: 890, field: 42000, pr: false, state: 'done' },
  { day: '25 Jun 2023', name: 'Beneva Half Marathon', location: 'Vancouver, BC', type: 'Road Running', time: '1:27:42', rank: 34, field: 1400, pr: true, state: 'done' },
  { day: '17 Sep 2023', name: 'Vancouver Sun Run 10K', location: 'Vancouver, BC', type: 'Road Running', time: '39:58', rank: 88, field: 22000, pr: false, state: 'done' },
  { day: '14 Jul 2024', name: 'IRONMAN 70.3 Victoria', location: 'Victoria, BC', type: 'Triathlon', time: '5:48:30', rank: 56, field: 1100, pr: false, state: 'done' },
  { day: '18 May 2025', name: 'IRONMAN 70.3 Emilia-Romagna', location: 'Cervia, IT', type: 'Triathlon', time: '5:35:47', rank: 21, field: 1350, pr: true, state: 'done' },
  { day: '21 Sep 2025', name: 'Seawall Half Marathon', location: 'Vancouver, BC', type: 'Road Running', time: '1:29:10', rank: 15, field: 800, pr: false, state: 'done' },
  { day: '11 Oct 2026', name: 'Royal Victoria Marathon', location: 'Victoria, BC', type: 'Road Running', time: null, rank: null, field: null, pr: false, state: 'training' },
];

export const PRS: PrEntry[] = [
  { distance: '5K', time: null },
  { distance: '10K', time: '38:50' },
  { distance: 'Half', time: '1:27:42' },
  { distance: 'Marathon', time: null },
];

function flagFor(location: string): string {
  if (location.includes(', FR')) return '🇫🇷';
  if (location.includes(', IT')) return '🇮🇹';
  if (location.includes(', BC')) return '🇨🇦';
  return '';
}

export interface JournalEntry {
  day: string;
  name: string;
  location: string;
  type: string;
  time: string;
  rankLabel: string | null;
  pr: boolean;
  training: boolean;
}

/** Race journal entries, newest first, with language-neutral display fields. */
export function journalEntries(): JournalEntry[] {
  return RACES.slice()
    .reverse()
    .map((r) => ({
      day: r.day,
      name: r.name,
      location: `${flagFor(r.location)} ${r.location}`,
      type: r.type,
      time: r.time ?? '—',
      rankLabel: r.rank ? `${r.rank} / ${r.field}` : null,
      pr: r.pr,
      training: r.state === 'training',
    }));
}
