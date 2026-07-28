import type { APIRoute } from 'astro';
import { SITE_ORIGIN, WORKBENCH_ORIGIN } from '../data/site';

// Hand-written rather than @astrojs/sitemap, because the site spans two
// hostnames and that integration emits everything under a single `site:` — it
// would list the workbench under the journal's origin and leave the workbench
// with no sitemap of its own. With one indexable URL per host, deriving it from
// the Host header is both shorter and correct on both.
export const prerender = false;

/** The indexable URL each host is responsible for, keyed by hostname. */
const PAGES: Record<string, string[]> = {
  [new URL(SITE_ORIGIN).host]: [`${SITE_ORIGIN}/`],
  [new URL(WORKBENCH_ORIGIN).host]: [`${WORKBENCH_ORIGIN}/`],
};

export const GET: APIRoute = ({ request }) => {
  const host = new URL(request.url).host;
  // An unknown host means a preview deployment or a direct workers.dev hit;
  // fall back to the journal rather than emitting an empty urlset.
  const urls = PAGES[host] ?? PAGES[new URL(SITE_ORIGIN).host];
  const lastmod = new Date().toISOString().slice(0, 10);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
};
