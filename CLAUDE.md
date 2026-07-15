# enzomuhlinghaus.com

Enzo's personal website: an "expedition map"-styled homepage plus a Toolbox of four
running calculators (Pace Calculator, MAS/VO2max Estimator, Race Predictor, Strava Namer).
Full plan and porting rules: see [PLAN.md](PLAN.md).

## Source of truth for the design

The visual design and all page content/logic come from the Claude Design project
**"Enzo's Personal Website Design"** — project id `96d7b1a6-139c-4c81-af68-b170975927d0`,
readable via the claude_design MCP (`DesignSync` tool: `list_files` / `get_file`).
The `.dc.html` files there are the reference when a visual or copy question comes up.

## Locked decisions (don't relitigate)

- **Stack**: Astro static output + **Vue** islands for the four tools only; everything else ships no JS (homepage clock/weather is a small vanilla script).
- **Styling**: plain CSS. Design tokens as custom properties in `src/styles/global.css`
  (`--accent: #c25c26`, `--ink: #26302a`, `--cream: #f6ecd7`, `--parchment: #d9c29a`,
  `--footer-green: #33453a`). Page/component styles go in Astro scoped `<style>` / Vue `<style scoped>`. No Tailwind/Sass.
- **Theme**: the design's "vibe" variants (golden hour, dusk) were removed — alpine morning only.
- **i18n**: single URL per page, EN + FR. Pre-paint inline script sets `<html lang data-lang>`
  from `localStorage.lang` → `navigator.language`. Static text uses paired `.i18n-en`/`.i18n-fr`
  elements toggled by CSS; the toggle dispatches a `langchange` CustomEvent that Vue islands
  and the clock listen to. Fonts self-hosted via @fontsource (Archivo, Instrument Serif,
  JetBrains Mono, Caveat).
- **Hosting**: Infomaniak shared web host, static upload of `dist/` (no Node server, no CI yet).

## Races & PR data

The race journal and PR blackboard on the homepage are fetched from Enzo's Notion **"Race Journal"**
database at **build time** (in `src/lib/races.ts`, which runs only in Astro's Node frontmatter — the
token never ships to the client). Editing Notion means re-running `npm run build` + re-uploading
`dist/`. Keep all race/PR fetch + display mapping in that one file; don't scatter race content into
page markup.

- Secrets: `NOTION_TOKEN` + `NOTION_DB_ID` in `.env` (gitignored), declared as `astro:env/server`
  secrets in `astro.config.mjs`. `.env.example` documents the shape.
- `journalEntries()` (journal, newest-first) and `prEntries()` (PR bests derived from `Run Distance`)
  are `async`; `src/pages/index.astro` `await`s them. Notion property names live in one `PROP` map.
- No `Status` column in Notion: a race is "training" (upcoming) when it has no `Time` or a future `Date`.

## Commands

- `npm run dev` — dev server
- `npm run build` — static build to `dist/`
- `npm run preview` — serve the built site locally

Deploy = upload `dist/` contents to the Infomaniak web root.

## TODO markers

(none currently — the footer CV button links to `public/enzo-muhlinghaus-cv.pdf`)
