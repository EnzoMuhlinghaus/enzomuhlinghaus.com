# enzomuhlinghaus.com

My personal site — [enzomuhlinghaus.com](https://enzomuhlinghaus.com).

The homepage is a field journal: an open book on a dark desk, four two-page spreads
(Home / Endurance / Work / Travel) with edge tabs and a page-turn fold. `/toolbox/` is a
workbench holding a few small running calculators — pace, race prediction, MAS/VO₂max.

The Endurance spread is live. Race results and personal bests come from my Notion race
journal, and the year's running total comes from Strava, both fetched when the page is
requested rather than baked in at build time. Editing a race or going for a run shows up
on the site without a deploy.

## Stack

- **[Astro](https://astro.build)** — every page is prerendered except the homepage, which
  renders on demand for the live data.
- **Vue** — used only for the toolbox, mounted as a single island. The rest of the site
  ships no framework JavaScript; the page-turn and the clock/weather are small vanilla scripts.
- **Plain CSS** — design tokens as custom properties in `src/styles/global.css`. No Tailwind,
  no Sass.
- **[Cloudflare Workers](https://workers.cloudflare.com)** — hosting. Prerendered pages are
  served from the edge; only `/` invokes the Worker. Upstream responses are cached in Workers
  KV for 30 minutes, with a last-known-good copy served if Notion or Strava is unreachable,
  so a third-party outage degrades to slightly stale data instead of an error page.

## Develop

```sh
npm install
npm run dev
```

Rendering the homepage locally needs Notion and Strava credentials — copy `.env.example`
to `.env` and fill it in. Without them the homepage fails to render; the toolbox and every
other page work regardless.

```sh
npm run check      # typechecks .astro, .vue and .ts
npm run build      # → dist/client (static assets) + dist/server (the Worker)
npm run preview    # serve the built Worker locally
```

`npm run build` needs no credentials: nothing is fetched at build time, so the deploy
pipeline runs without any secrets. They are only read at request time, from Worker secrets.

## Layout

```
src/
  pages/       index.astro (the journal) and toolbox/
  components/  journal/ (page, dateline, polaroid), tools/ (Vue), Flag, T
  lib/         races.ts (Notion), strava.ts, cache.ts (KV read-through cache)
  data/        static journal content — spreads, career log, travel polaroids
  i18n/        UI strings; the French dictionary is dormant, see CLAUDE.md
  styles/      global.css — design tokens and shared primitives
```

Deploys run on push to `main` via Cloudflare Workers Builds. Architecture decisions and the
reasoning behind them live in [CLAUDE.md](CLAUDE.md).

## Use

The repository is public so the build is readable, but no license is granted: the journal
entries, photographs and visual design are personal. Borrow an idea, not the content.
