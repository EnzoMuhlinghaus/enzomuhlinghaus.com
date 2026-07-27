// Endurance spread (entry 01) figures that don't come from an API.
//
// The kilometres-this-year figure used to live here as a hand-maintained string.
// It is now fetched from Strava at request time — see src/lib/strava.ts.
// Race results and personal bests come from Notion — see src/lib/races.ts.

/** Public Strava athlete id — also the tail of STRAVA_URL, and not a secret. */
export const STRAVA_ATHLETE_ID = '128774902';

/** Where the Endurance page links out to. */
export const STRAVA_URL = `https://www.strava.com/athletes/${STRAVA_ATHLETE_ID}`;
