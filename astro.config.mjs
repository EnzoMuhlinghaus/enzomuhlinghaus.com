// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import vue from '@astrojs/vue';

export default defineConfig({
  site: 'https://enzomuhlinghaus.com',
  // No sitemap integration: the site spans two hostnames (the journal and the
  // workbench), and @astrojs/sitemap emits every route under this one `site`.
  // src/pages/sitemap.xml.ts serves the right URLs per host instead.
  integrations: [vue()],

  // The site is a Cloudflare Worker. Everything is prerendered by default; only
  // the homepage opts out (`export const prerender = false`), because it renders
  // live Notion + Strava data per request. See CLAUDE.md "Live data".
  adapter: cloudflare({
    // NOT optional: astro:assets uses Sharp, which cannot run inside a Worker.
    // 'compile' resizes/encodes at build time and passes through at runtime — which
    // works here because every <Image> is a local ESM import known at compile time.
    imageService: 'compile',
  }),

  // Credentials for the request-time Notion + Strava fetches (src/lib/races.ts,
  // src/lib/strava.ts). Server-side + secret: never bundled to the client. In
  // production these are Worker secrets (`wrangler secret put`); locally, .env.
  env: {
    schema: {
      NOTION_TOKEN: envField.string({ context: 'server', access: 'secret' }),
      NOTION_DB_ID: envField.string({ context: 'server', access: 'secret' }),
      STRAVA_CLIENT_ID: envField.string({ context: 'server', access: 'secret' }),
      STRAVA_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret' }),
      STRAVA_REFRESH_TOKEN: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
