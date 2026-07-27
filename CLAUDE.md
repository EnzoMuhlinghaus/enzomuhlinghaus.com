# enzomuhlinghaus.com

Enzo's personal website, **v2 "Field Journal"**: the homepage is an open journal on a dark
desk — four two-page spreads (Home / Endurance / Work / Travel) with edge tabs and a
page-turn fold — and `/toolbox/` is a single dark "workbench" holding a grid of paper
tool cards (Pace Calculator, Race Predictor, MAS/VO₂max Estimator).

`StravaNamer.vue` is a fourth, finished card that is **deliberately not mounted** — it isn't
ready to ship. It is off the bench (`Workbench.vue`), off the journal's workbench card
(`src/pages/index.astro`), and out of the footer disclaimer. Its `namer` i18n block is kept
intact. Re-add all of those together when the tool is ready.

## Source of truth for the design

The visual design and all page content/logic come from the Claude Design project
**"Enzo's Personal Website Design"** — project id `96d7b1a6-139c-4c81-af68-b170975927d0`,
readable via the claude_design MCP (`DesignSync` tool: `list_files` / `get_file`).
These three files, and only these, are the reference when a visual or copy question comes up:
`Homepage v2: Field Journal.dc.html`, `Design System v2.dc.html`, `Toolbox Workbench v2.dc.html`.
Any other page file in that project is from a superseded design — ignore it.
`support.js` / `image-slot.js` are Claude Design authoring runtime, not site code.
`get_file` truncates binaries at 256 KiB, so images cannot be pulled through it.

## Locked decisions (don't relitigate)

- **Stack**: Astro + **Vue** for the toolbox only, as one `Workbench` island; everything else
  ships no framework JS (the page-turn and the clock/weather are small vanilla scripts).
  Every page is prerendered **except the homepage**, which sets `prerender = false` because it
  renders live Notion + Strava data per request — see "Live data" below.
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
  The adapter must stay on `imageService: 'compile'`: `astro:assets` uses Sharp, which cannot
  run inside a Worker, so images are processed at build time and passed through at runtime.
  This works only because every `<Image>` source is a local ESM import.
- **Hosting**: **Cloudflare Workers** at `enzomuhlinghaus.com`, via `@astrojs/cloudflare` +
  `wrangler.jsonc`. Prerendered pages are served from the edge; only `/` invokes the Worker.
  **Deploys are Cloudflare Workers Builds**, configured in the Cloudflare dashboard (Worker →
  Settings → Build) against this GitHub repo — *not* a GitHub Action, and there is no workflow
  file. Pushing to `main` builds (`npm run build`) and deploys (`npx wrangler deploy`); other
  branches get preview deployments. Nothing lives in GitHub secrets: the build calls no API,
  and the runtime credentials are Worker secrets. Note the dashboard's "Variables and secrets"
  is the *build* environment and should stay empty — it is not where the Notion/Strava
  credentials go.

## Live data

Everything on the Endurance spread is fetched at **request time** inside the Worker, so editing
Notion or going for a run shows up on the site without a rebuild or a deploy. Nothing is fetched
in the browser — this is server rendering, so no credential and no extra client JS is involved.

- `src/lib/races.ts` — the race journal (right page) and personal bests (left page) from Enzo's
  Notion **"Race Journal"** database. Keep all race/PR fetch + display mapping in that one file;
  don't scatter race content into page markup.
- `src/lib/strava.ts` — the "N km run so far in YYYY" figure, from Strava's athlete-stats
  endpoint (`ytd_run_totals.distance`). The year label is derived from the clock, not stored.
- `src/lib/cache.ts` — a read-through **KV cache (30 min)** in front of both, on the `JOURNAL`
  binding. It also implements **stale-if-error**: on an upstream failure it serves the
  `:last-good` copy rather than 500ing at a visitor. Only a cold cache + a dead upstream fails.
- Bindings come from `cloudflare:workers` (`env.JOURNAL`), not `Astro.locals` — adapter v14
  reduced `locals.runtime` to `{ cfContext }`. Re-run `npx wrangler types` after changing
  bindings in `wrangler.jsonc`; it regenerates `worker-configuration.d.ts`.
- Secrets are declared as `astro:env/server` secrets in `astro.config.mjs`; in production they
  are Worker secrets (`npx wrangler secret put …`), locally they come from `.env` (gitignored).
  Note a **local** build copies `.env` to `dist/server/.dev.vars` so the prerender step can read
  it. That file is not bundled, not uploaded and not servable (it's in `.assetsignore`), and
  `dist/` is gitignored — but don't hand `dist/` to anyone off a machine that has real `.env`.

Notion specifics:

- `journalEntries()` (journal, newest-first) and `prEntries()` (PR bests derived from `Run Distance`)
  are `async`; `src/pages/index.astro` `await`s them. Notion property names live in one `PROP` map.
- No `Status` column in Notion: a race is "training" (upcoming) when it has no `Time` or a future `Date`.
- `displayLocation()` returns an ISO country code, not an emoji — v2 draws its own flag marks via
  `src/components/Flag.astro`.

Strava specifics:

- Strava uses OAuth, not a static token. `STRAVA_REFRESH_TOKEN` is exchanged for a short-lived
  access token on each cache miss. Strava may **rotate** the refresh token on any exchange, so
  the current one is persisted to KV under `strava:refresh-token` and preferred over the secret.
- To regenerate the refresh token from scratch: create/open an app at
  <https://www.strava.com/settings/api> (callback domain `localhost`), authorize via
  `https://www.strava.com/oauth/authorize?client_id=ID&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=activity:read_all`,
  then `POST https://www.strava.com/oauth/token` with `client_id`, `client_secret`, the `code`
  from the redirect and `grant_type=authorization_code`. The scope must be `activity:read_all`;
  plain `activity:read` silently omits private activities from the total.

## Static content (`src/data/`)

- `journal.ts` — spread order (`SPREADS`, which drives tabs + hash routing), the Home contents rows,
  and the shared outbound links.
- `endurance.ts`, `work.ts`, `travel.ts` — the Strava athlete id + profile link, career log +
  pencil-doodle boxes, and the travel polaroids with their hand-placed coordinates.

## Commands

- `npm run dev` — dev server (real KV + `.env` secrets, via the Cloudflare vite plugin)
- `npm run build` — builds to `dist/client` (static assets) + `dist/server` (the Worker)
- `npm run preview` — serve the built Worker locally
- `npm run check` — `astro check` (typechecks `.astro`, `.vue` and `.ts`)
- `npx wrangler types` — regenerate `worker-configuration.d.ts` after a binding change
- `npx wrangler deploy` — deploy by hand; `npx wrangler tail` to watch live logs

Deploy = push to `main`; Cloudflare Workers Builds builds and runs `wrangler deploy`.
Preview deployments from other branches share the same KV namespace and secrets as
production, so a preview reads and writes the same cache entries.

## TODO markers

- **The journal copy is untranslated** — the `home`/`endurance`/`work`/`travel` blocks in
  `src/i18n/fr.ts` still hold English. Inert while the toggle is gone; blocks restoring it.
- **`StravaNamer.vue` is finished but unmounted** — see the note at the top of this file for
  the three places to re-add it together.

(`entry--todo` / `thumb--todo` in `src/pages/index.astro` are not markers — they style the
"to be continued…" card on the Home contents page.)
