// LIVE DATA — the race journal and PR blackboard are fetched from Enzo's Notion
// "Race Journal" database at BUILD TIME (this module runs only in Astro's Node
// frontmatter, never in the browser, so the token is never shipped to the client).
// Keep every race/PR fact and its display mapping in this one file.
//
// Data flow: fetchRaces() → journalEntries() (homepage journal) and prEntries()
// (PR blackboard). Editing Notion means re-running `npm run build` + re-uploading dist/.

import { NOTION_TOKEN, NOTION_DB_ID } from 'astro:env/server';

export interface Race {
  day: string;
  name: string;
  location: string; // short display label incl. flag, e.g. "🇫🇷 Annecy"
  lat: number | null;
  lon: number | null;
  type: string; // 'Road Running' | 'Trail Running' | 'Triathlon'
  runDistance: string | null; // '5k' | '10k' | 'Half' | 'Marathon'
  triDistance: string | null; // 'Sprint' | 'Olympic' | '70.3' | 'Ironman'
  time: string | null;
  overallPlace: number | null;
  overallTotal: number | null;
  genderPlace: number | null;
  genderTotal: number | null;
  divisionPlace: number | null;
  divisionTotal: number | null;
  pr: boolean;
  state: 'done' | 'training';
}

export type PrDistance = '5K' | '10K' | 'Half' | 'Marathon';

export interface PrEntry {
  distance: PrDistance;
  time: string | null;
}

// Exact Notion property names — centralized so a rename in Notion is a one-line edit here.
const PROP = {
  name: 'Race Name',
  date: 'Date',
  time: 'Time',
  type: 'Type',
  runDistance: 'Run Distance',
  triDistance: 'Triathlon Distance',
  location: 'Location',
  pr: 'PR',
  overallPlace: 'Overall Place',
  overallTotal: 'Overall Total',
  genderPlace: 'Gender Place',
  genderTotal: 'Gender Total',
  divisionPlace: 'Division Place',
  divisionTotal: 'Division Total',
} as const;

const NOTION_VERSION = '2022-06-28';

// ---- Notion property extractors ------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
type NotionProps = Record<string, any>;

const title = (p: NotionProps, key: string): string =>
  (p[key]?.title ?? []).map((t: any) => t.plain_text).join('').trim();

const richText = (p: NotionProps, key: string): string =>
  (p[key]?.rich_text ?? []).map((t: any) => t.plain_text).join('').trim();

const selectName = (p: NotionProps, key: string): string | null =>
  p[key]?.select?.name ?? null;

const number = (p: NotionProps, key: string): number | null => {
  const v = p[key]?.number;
  return typeof v === 'number' ? v : null;
};

const checkbox = (p: NotionProps, key: string): boolean => p[key]?.checkbox === true;

const dateStart = (p: NotionProps, key: string): string | null => p[key]?.date?.start ?? null;

const place = (p: NotionProps, key: string): { name: string; lat: number | null; lon: number | null } => {
  const pl = p[key]?.place;
  return {
    name: pl?.name ?? '',
    lat: typeof pl?.lat === 'number' ? pl.lat : null,
    lon: typeof pl?.lon === 'number' ? pl.lon : null,
  };
};

// ---- Display helpers -----------------------------------------------------------

const COUNTRY_FLAG: Record<string, string> = {
  France: '🇫🇷',
  Italy: '🇮🇹',
  Canada: '🇨🇦',
};

/** Flag from a country name (last segment of a Notion place name). */
function flagFor(country: string): string {
  return COUNTRY_FLAG[country.trim()] ?? '';
}

/** "Annecy, Auvergne-Rhone-Alpes, France" → "🇫🇷 Annecy". */
function displayLocation(placeName: string): string {
  const parts = placeName.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  const city = parts[0];
  const country = parts[parts.length - 1];
  const flag = flagFor(country);
  return flag ? `${flag} ${city}` : city;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO "2025-04-27" → "27 Apr 2025" (matches the original display style). */
function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Trim a leading zero-hour so "0:42:33" → "42:33"; leaves "1:59:12" and "41:01" as-is. */
function normalizeTime(t: string): string | null {
  const trimmed = t.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^0:(?=\d{2}:\d{2}$)/, '');
}

/** Parse "H:MM:SS" or "MM:SS" into seconds for comparison; null if unparseable. */
function timeToSeconds(t: string): number | null {
  const parts = t.split(':').map((s) => Number(s));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

// ---- Notion fetch --------------------------------------------------------------

// Memoize per build: journalEntries() and prEntries() both need the data, but a
// single `npm run build` should query Notion only once.
let racesPromise: Promise<Race[]> | null = null;
function fetchRaces(): Promise<Race[]> {
  return (racesPromise ??= queryRaces());
}

/** Fetch all races from Notion, oldest first (build-time only). Throws loudly on failure. */
async function queryRaces(): Promise<Race[]> {
  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    throw new Error('races.ts: NOTION_TOKEN / NOTION_DB_ID are not set — cannot build the race journal.');
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, local build date
  const races: Race[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ property: PROP.date, direction: 'ascending' }],
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`races.ts: Notion query failed (${res.status} ${res.statusText}) ${detail}`);
    }

    const data = (await res.json()) as { results: any[]; has_more: boolean; next_cursor: string | null };

    for (const row of data.results) {
      const p: NotionProps = row.properties ?? {};
      const iso = dateStart(p, PROP.date);
      const time = normalizeTime(richText(p, PROP.time));
      const loc = place(p, PROP.location);
      // No Status column in Notion: a race is "training" (upcoming) when it has no
      // recorded time or its date is still in the future.
      const upcoming = time === null || (iso !== null && iso > today);

      races.push({
        day: iso ? formatDay(iso) : '',
        name: title(p, PROP.name),
        location: displayLocation(loc.name),
        lat: loc.lat,
        lon: loc.lon,
        type: selectName(p, PROP.type) ?? '',
        runDistance: selectName(p, PROP.runDistance),
        triDistance: selectName(p, PROP.triDistance),
        time,
        overallPlace: number(p, PROP.overallPlace),
        overallTotal: number(p, PROP.overallTotal),
        genderPlace: number(p, PROP.genderPlace),
        genderTotal: number(p, PROP.genderTotal),
        divisionPlace: number(p, PROP.divisionPlace),
        divisionTotal: number(p, PROP.divisionTotal),
        pr: checkbox(p, PROP.pr),
        state: upcoming ? 'training' : 'done',
      });
    }

    cursor = data.has_more ? data.next_cursor ?? undefined : undefined;
  } while (cursor);

  return races;
}

// ---- Public API (consumed in Astro frontmatter) --------------------------------

export interface JournalEntry {
  day: string;
  name: string;
  location: string;
  type: string;
  distance: string | null; // display distance: triathlon distance or run distance, when known
  time: string;
  rankLabel: string | null;
  pr: boolean;
  training: boolean;
}

/** Display distance for a race: triathlon distance if any, else the run distance
 *  (with a tidy uppercase 'K'). Null for races that carry neither (e.g. trails). */
function displayDistance(r: Race): string | null {
  if (r.triDistance) return r.triDistance;
  if (r.runDistance) return r.runDistance.replace(/k$/, 'K');
  return null;
}

/** Race journal entries, newest first, with language-neutral display fields. */
export async function journalEntries(): Promise<JournalEntry[]> {
  const races = await fetchRaces();
  return races
    .slice()
    .reverse()
    .map((r) => ({
      day: r.day,
      name: r.name,
      location: r.location,
      type: r.type,
      distance: displayDistance(r),
      time: r.time ?? '—',
      // Only show "place / total" when both are known (older races lack a total).
      rankLabel: r.overallPlace && r.overallTotal ? `${r.overallPlace} / ${r.overallTotal}` : null,
      pr: r.pr,
      training: r.state === 'training',
    }));
}

/** Normalize Notion's Run Distance ('5k'/'10k'/'Half'/'Marathon') to a PrDistance. */
function toPrDistance(runDistance: string | null): PrDistance | null {
  switch ((runDistance ?? '').toLowerCase()) {
    case '5k':
      return '5K';
    case '10k':
      return '10K';
    case 'half':
      return 'Half';
    case 'marathon':
      return 'Marathon';
    default:
      return null;
  }
}

const PR_ORDER: PrDistance[] = ['5K', '10K', 'Half', 'Marathon'];

/** PR blackboard: fastest completed time per distance, derived from the race list. */
export async function prEntries(): Promise<PrEntry[]> {
  const races = await fetchRaces();
  const best = new Map<PrDistance, { time: string; seconds: number }>();

  for (const r of races) {
    if (r.state !== 'done' || !r.time) continue;
    const distance = toPrDistance(r.runDistance);
    if (!distance) continue;
    const seconds = timeToSeconds(r.time);
    if (seconds === null) continue;
    const current = best.get(distance);
    if (!current || seconds < current.seconds) best.set(distance, { time: r.time, seconds });
  }

  return PR_ORDER.map((distance) => ({ distance, time: best.get(distance)?.time ?? null }));
}
