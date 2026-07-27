// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://enzomuhlinghaus.com',
  integrations: [vue(), sitemap()],

  // The site is a Cloudflare Worker. Everything is prerendered by default; a page
  // can opt out with `export const prerender = false` to render on demand.
  adapter: cloudflare({
    // NOT optional: astro:assets uses Sharp, which cannot run inside a Worker.
    // 'compile' resizes/encodes at build time and passes through at runtime — which
    // works here because every <Image> is a local ESM import known at compile time.
    imageService: 'compile',
  }),

  // Build-time secrets for the Notion race-journal fetch (see src/lib/races.ts).
  // Server-side + secret: never bundled to the client.
  env: {
    schema: {
      NOTION_TOKEN: envField.string({ context: 'server', access: 'secret' }),
      NOTION_DB_ID: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
