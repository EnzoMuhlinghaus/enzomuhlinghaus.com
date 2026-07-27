// Read-through KV cache shared by the two live data sources (src/lib/races.ts,
// src/lib/strava.ts). Runs only inside the Worker, never in the browser.
//
// The JOURNAL binding comes from `cloudflare:workers` rather than being threaded
// down from the page, so callers keep their original no-argument signatures.
//
// Two keys per entry:
//   <key>            — the hot copy, expires after `ttl` seconds
//   <key>:last-good  — never expires, rewritten on every successful fetch
//
// The second one is the whole point. Notion and Strava are third parties that
// will occasionally be slow, rate-limited or down, and the homepage renders on
// demand — so an upstream hiccup would otherwise be a 500 for whoever happened
// to be visiting. Serving a stale race journal is strictly better than serving
// an error page: the content is months-stable, and the alternative is a broken
// site. We only fail when there has never been a good payload to fall back to.

import { env } from 'cloudflare:workers';

/** How long a fetched payload stays hot before the next request refreshes it. */
export const TTL_SECONDS = 30 * 60;

const lastGoodKey = (key: string) => `${key}:last-good`;

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = TTL_SECONDS,
): Promise<T> {
  const kv = env.JOURNAL;
  const hit = await kv.get<T>(key, 'json');
  if (hit !== null) return hit;

  try {
    const fresh = await fetcher();
    // Sequential, not Promise.all: if the hot write fails we would rather not
    // have already claimed a new last-good.
    await kv.put(key, JSON.stringify(fresh), { expirationTtl: ttl });
    await kv.put(lastGoodKey(key), JSON.stringify(fresh));
    return fresh;
  } catch (err) {
    const stale = await kv.get<T>(lastGoodKey(key), 'json');
    if (stale !== null) {
      console.error(`cache: "${key}" fetch failed, serving last-good instead —`, err);
      return stale;
    }
    // Nothing cached and upstream is unreachable: there is no page to render.
    throw err;
  }
}
