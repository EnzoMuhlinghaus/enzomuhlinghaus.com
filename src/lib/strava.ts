// LIVE DATA — the "N km run so far this year" figure on the Endurance left page,
// fetched from Strava at REQUEST TIME inside the Cloudflare Worker (this module
// never runs in the browser, so the credentials are never shipped to the client).
// Keep the km figure and its formatting in this one file.
//
// Data flow: kmThisYear() → cached() → refreshAccessToken() → athlete stats.
// The result is KV-cached for 30 minutes; Strava's year-to-date total moves at
// most once a day, so that is effectively live.

import { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } from 'astro:env/server';
import { env } from 'cloudflare:workers';
import { STRAVA_ATHLETE_ID } from '../data/endurance';
import { cached } from './cache';

export interface YearDistance {
  /** Display-ready, thousands-separated, e.g. "1,248". */
  figure: string;
  /** Calendar year the figure covers, e.g. "2026". */
  year: string;
}

const CACHE_KEY = 'strava:ytd-run';

// Strava may hand back a NEW refresh token on any exchange and invalidate the old
// one. A build-time secret could not absorb that — it would simply start failing
// weeks later — so we keep the current token in KV and prefer it over the secret.
const REFRESH_TOKEN_KEY = 'strava:refresh-token';

export function kmThisYear(): Promise<YearDistance> {
  return cached(CACHE_KEY, fetchYtdRunKm);
}

async function fetchYtdRunKm(): Promise<YearDistance> {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    throw new Error('strava.ts: STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / STRAVA_REFRESH_TOKEN are not set — cannot fetch the year distance.');
  }

  const accessToken = await refreshAccessToken();

  const res = await fetch(`https://www.strava.com/api/v3/athletes/${STRAVA_ATHLETE_ID}/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`strava.ts: athlete stats failed (${res.status} ${res.statusText}) ${detail}`);
  }

  const data = (await res.json()) as { ytd_run_totals?: { distance?: unknown } };
  const metres = data.ytd_run_totals?.distance;

  // Guard rather than trust: a shape change upstream would otherwise render "NaN km".
  if (typeof metres !== 'number' || !Number.isFinite(metres)) {
    throw new Error(`strava.ts: ytd_run_totals.distance was not a number (got ${JSON.stringify(metres)}).`);
  }

  return {
    figure: Math.round(metres / 1000).toLocaleString('en-US'),
    year: String(new Date().getFullYear()),
  };
}

/** Exchange the refresh token for a short-lived access token, persisting rotation. */
async function refreshAccessToken(): Promise<string> {
  const kv = env.JOURNAL;
  const stored = await kv.get(REFRESH_TOKEN_KEY);
  const refreshToken = stored ?? STRAVA_REFRESH_TOKEN;

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`strava.ts: token refresh failed (${res.status} ${res.statusText}) ${detail}`);
  }

  const data = (await res.json()) as { access_token?: string; refresh_token?: string };

  if (!data.access_token) {
    throw new Error('strava.ts: token refresh returned no access_token.');
  }

  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await kv.put(REFRESH_TOKEN_KEY, data.refresh_token);
  }

  return data.access_token;
}
