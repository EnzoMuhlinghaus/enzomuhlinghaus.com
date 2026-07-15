// @ts-check
import { defineConfig, envField } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://enzomuhlinghaus.github.io',
  integrations: [vue(), sitemap()],
  // Build-time secrets for the Notion race-journal fetch (see src/lib/races.ts).
  // Server-side + secret: never bundled to the client.
  env: {
    schema: {
      NOTION_TOKEN: envField.string({ context: 'server', access: 'secret' }),
      NOTION_DB_ID: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
