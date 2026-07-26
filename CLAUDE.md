# enzomuhlinghaus.com

Enzo's personal website, **v2 "Field Journal"**: the homepage is an open journal on a dark
desk — four two-page spreads (Home / Endurance / Work / Travel) with edge tabs and a
page-turn fold — and `/toolbox/` is a single dark "workbench" holding a 2×2 grid of paper
tool cards (Pace Calculator, Race Predictor, MAS/VO₂max Estimator, Strava Namer).

[PLAN.md](PLAN.md) documents the superseded v1 build and is kept for history only.

## Source of truth for the design

The visual design and all page content/logic come from the Claude Design project
**"Enzo's Personal Website Design"** — project id `96d7b1a6-139c-4c81-af68-b170975927d0`,
readable via the claude_design MCP (`DesignSync` tool: `list_files` / `get_file`).
The v2 files are the reference when a visual or copy question comes up:
`Homepage v2: Field Journal.dc.html`, `Design System v2.dc.html`, `Toolbox Workbench v2.dc.html`.
Ignore the v1 files (`Homepage.dc.html`, `Toolbox.dc.html`, the per-tool sheets) — they
describe the old design. `support.js` / `image-slot.js` are Claude Design authoring runtime,
not site code. `get_file` truncates binaries at 256 KiB, so images cannot be pulled through it.

## Locked decisions (don't relitigate)

- **Stack**: Astro static output + **Vue** for the toolbox only, as one `Workbench` island;
  everything else ships no framework JS (the page-turn and the clock/weather are small
  vanilla scripts).
- **Styling**: plain CSS. Design tokens as custom properties in `src/styles/global.css`
  — desk `--desk-top: #4a4038` / `--desk-bottom: #3a322b`, papers `--paper-l: #f6efdd` /
  `--paper-r: #f9f3e3`, inks `--ink: #2e2517` → `--ink-2` → `--muted` → `--faint` → `--gold: #9a8258`,
  accents `--red: #c1442e` / `--rust: #a5533f`, and a 42px `--rule-step` ruled-paper beat.
  Shared primitives (`.pill`, `.wf`, `.leader`, `.info`/`.iinfo`, `.tape`, `.ruled`, `.hand-link`)
  also live there. Page/component styles go in Astro scoped `<style>` / Vue `<style scoped>`.
  No Tailwind/Sass.
- **Type — three voices, fixed jobs**: Caveat speaks (titles/body), Special Elite labels
  (UPPERCASE eyebrows, field labels, page numbers), JetBrains Mono measures (data only).
  Never body copy in mono or data in handwriting. Self-hosted via @fontsource.
- **i18n — dormant, English only.** v2 has **no language toggle** (the design has none), and
  `<html lang="en" data-lang="en">` is hard-coded in `Layout.astro`: nothing auto-detects
  `navigator.language` any more, because with no toggle a French visitor would be stranded in a
  half-translated site. The machinery is kept for when FR comes back — paired `.i18n-en`/`.i18n-fr`
  spans (via `<T>`), the `en.ts`/`fr.ts` dictionaries, `useMessages()`, and the `langchange`
  listeners in `lang.ts` / `Dateline.astro`, which are inert until something dispatches the event.
  To re-enable: restore a toggle that flips `data-lang` and dispatches `langchange`
  (see `git log -- src/components/LangToggle.astro`). Note `fr.ts` still carries **English** text
  for `home`/`endurance`/`work`/`travel`; only the workbench blocks are actually translated.
- **Content vs. chrome**: `src/i18n/*` holds UI chrome only. Long-form journal content
  (entry blurbs, travel captions, career log, the pencil doodle) lives in `src/data/*`.
- **Images**: photos live in `src/assets/photos/` and are rendered through
  `astro:assets` `<Image>` so they get resized and re-encoded at build time. Do not put
  photos in `public/` — the originals are 700 KB–1.4 MB each.
- **Hosting**: GitHub Pages via `.github/workflows` (`withastro/action`), with
  `NOTION_TOKEN` / `NOTION_DB_ID` as repo secrets. Pushing to `main` deploys.

## Races & PR data

The race journal (Endurance right page) and the personal bests (Endurance left page) are fetched
from Enzo's Notion **"Race Journal"** database at **build time** (in `src/lib/races.ts`, which runs
only in Astro's Node frontmatter — the token never ships to the client). Editing Notion means
re-running the build. Keep all race/PR fetch + display mapping in that one file; don't scatter race
content into page markup.

- Secrets: `NOTION_TOKEN` + `NOTION_DB_ID` in `.env` (gitignored), declared as `astro:env/server`
  secrets in `astro.config.mjs`. `.env.example` documents the shape.
- `journalEntries()` (journal, newest-first) and `prEntries()` (PR bests derived from `Run Distance`)
  are `async`; `src/pages/index.astro` `await`s them. Notion property names live in one `PROP` map.
- No `Status` column in Notion: a race is "training" (upcoming) when it has no `Time` or a future `Date`.
- `displayLocation()` returns an ISO country code, not an emoji — v2 draws its own flag marks via
  `src/components/Flag.astro`.

## Static content (`src/data/`)

- `journal.ts` — spread order (`SPREADS`, which drives tabs + hash routing), the Home contents rows,
  and the shared outbound links.
- `endurance.ts`, `work.ts`, `travel.ts` — the km-this-year figure, career log + pencil-doodle boxes,
  and the travel polaroids with their hand-placed coordinates.

## Commands

- `npm run dev` — dev server
- `npm run build` — static build to `dist/`
- `npm run preview` — serve the built site locally
- `npm run check` — `astro check` (typechecks `.astro`, `.vue` and `.ts`)

Deploy = push to `main`; the GitHub Pages workflow builds and publishes.

## TODO markers

- **`KM_THIS_YEAR` in `src/data/endurance.ts` is hand-maintained.** No data source is wired up;
  a Strava fetch mirroring `races.ts` would be the natural fix.
- **The v2 journal copy is untranslated** — see the TODO at the top of `src/i18n/fr.ts`.
