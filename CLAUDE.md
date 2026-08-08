# enzomuhlinghaus.com

Enzo's personal website, **v2 "Field Journal"**: the homepage is an open journal on a dark
desk — four two-page spreads (Home / Endurance / Work / Travel) with edge tabs and a
page-turn fold — and the "workbench" is a single dark page holding a grid of paper
tool cards (Pace Calculator, Race Predictor, MAS/VO₂max Estimator).

**The site spans two hostnames.** The journal is `enzomuhlinghaus.com`; the workbench is
`workbench.enzomuhlinghaus.com`, a destination in its own right for people who never touch
the journal. One Astro project and one Worker serve both — see "The workbench subdomain".
The practical consequence for day-to-day work: **links between the two must be absolute**,
from `src/data/site.ts` (`SITE_ORIGIN` / `WORKBENCH_ORIGIN`). A root-relative `/` on the
workbench points back at the workbench.

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
- **i18n — dormant, English only, and one language reaches the HTML.** v2 has **no language
  toggle** (the design has none), and `<html lang="en" data-lang="en">` is hard-coded in
  `Layout.astro`: nothing auto-detects `navigator.language` any more, because with no toggle a
  French visitor would be stranded in a half-translated site.
  `<T>` renders **only** `SITE_LANG` (`src/i18n/index.ts`). It used to emit paired
  `.i18n-en`/`.i18n-fr` spans that CSS hid one of — which put every visible phrase in the HTML
  twice, and since `fr.ts` still carries **English** for `home`/`endurance`/`work`/`travel`,
  twice *identically*. A crawler reads that as repetition, not translation. Leaves that take
  arguments (`kmSuffix`, `racesCount`) are called as `t.x.y[SITE_LANG](…)` at the call site,
  since `<T>` only takes string pairs.
  **No runtime path can reach French any more, on purpose** — the translation is unreviewed,
  so English is the only acceptable output until Enzo has read the FR copy. `SITE_LANG` is typed
  as the literal `'en'` (widening it back to `'en' | 'fr'` is now a visible diff, not a
  one-character slip); `useMessages()` returns the `en` dictionary outright; `useLang()` returns
  a constant and no longer reads `data-lang`; and the `langchange` listeners in `lang.ts` /
  `Dateline.astro` are **removed**, not merely inert — a listener nothing dispatches is still one
  `dispatchEvent` away from flipping a hydrated island. Dateline's clock is pinned to `en-US` /
  12-hour and no longer imports `fr`.
  Kept for when FR returns: the `{ en, fr }` pair structure, both dictionaries (still exported),
  `useMessages()` itself, and `lang.ts` as the seam to restore the reads through.
  **The CSS-toggle restore path is gone, deliberately.** Bring FR back as real `/fr/` routes
  with `hreflang`, which is what search engines want anyway: separate URLs per language, not one
  URL carrying both. `<T>` then reads the active route's language instead of the constant.
- **Content vs. chrome**: `src/i18n/*` holds UI chrome only. Long-form journal content
  (entry blurbs, travel captions, career log, the pencil doodle) lives in `src/data/*`.
- **Images**: photos live in `src/assets/photos/` and are rendered through
  `astro:assets` `<Image>` so they get resized and re-encoded at build time. Do not put
  photos in `public/` — the originals are 700 KB–1.4 MB each.
  The adapter must stay on `imageService: 'compile'`: `astro:assets` uses Sharp, which cannot
  run inside a Worker, so images are processed at build time and passed through at runtime.
  This works only because every `<Image>` source is a local ESM import.
  **Corollary — the homepage gets no image processing at all.** "Build time" means *prerender*
  time, and `/` is the one page that opts out, so its `<Image>`s emit `/_image?…&f=webp` URLs
  that the Worker answers by streaming the source file back **unresized and unconverted** —
  the `w`/`h`/`f` params are ignored. Whatever is committed in `src/assets/photos/` is byte-for-byte
  what a visitor downloads. So the photos are pre-cut to their final size by hand: **WebP,
  q80, long edge ≤ 1280** (≈2× the largest CSS box any of them occupies), EXIF stripped:
  `cwebp -q 80 -m 6 -metadata none -resize 0 1280 in.jpeg -o out.webp`.
  Dropping a fresh 1.4 MB photo in here ships 1.4 MB to every visitor — dev will look fine
  and lie to you, because the Vite dev server *does* have Sharp. `og-card.jpg` is the one
  deliberate JPEG (1200×630, social scrapers prefer JPEG) and is not rendered through `<Image>`.
  **Resize and recompress freely; never crop.** Every photo is the full uncropped frame, and
  the design does its framing in CSS (`object-position` + `transform-origin`) — so a crop
  silently moves the framing of an image whose CSS nobody touched. `npm run check` enforces
  both halves; see below.
- **Image framing is the design's, verbatim.** `object-position`, `transform: scale()`,
  `transform-origin` and the frame box heights are transcribed from
  `Homepage v2: Field Journal.dc.html` and must not be retuned to suit a re-exported photo —
  re-cut the photo instead. `scripts/check-framing.mjs` (wired into `npm run check`) holds the
  design's values verbatim alongside each photo's expected aspect ratio and fails on either
  kind of drift. When the design genuinely changes, re-read it with the claude_design MCP
  (`DesignSync` → `get_file`) and update that script **in the same commit** as the CSS.
- **The travel polaroids are framed in a file that isn't the HTML.** They are `<image-slot>`
  elements, and the pan/zoom applied by dragging a photo inside its frame is persisted to
  **`.image-slots.state.json`** in the design project, keyed `travel-photo-<id>` — *not* to any
  attribute you can see in the page markup. Read only the HTML and every polaroid looks
  hard-centred, which silently crops through the subject on any photo framed by hand. Those
  numbers live in `travel.ts` as `frame: { s, x, y }`, and `framePosition()` in `Polaroid.astro`
  is a direct port of image-slot's `_geom` + `_clampView` + `_applyView` (the clamp matters:
  Edinburgh's stored pan exceeds its own frame's limit). Slots absent from the sidecar are
  untouched and carry no `frame`. **Whenever you re-read the design, read the sidecar too.**
- **Hosting**: **Cloudflare Workers** at `enzomuhlinghaus.com`, via `@astrojs/cloudflare` +
  `wrangler.jsonc`. Prerendered pages are served from the edge; only `/` invokes the Worker.
  **Deploys are Cloudflare Workers Builds**, configured in the Cloudflare dashboard (Worker →
  Settings → Build) against this GitHub repo — *not* a GitHub Action, and there is no workflow
  file. Pushing to `main` builds (`npm run build`) and deploys (`npx wrangler deploy`); other
  branches get preview deployments. Nothing lives in GitHub secrets: the build calls no API,
  and the runtime credentials are Worker secrets. Note the dashboard's "Variables and secrets"
  is the *build* environment and should stay empty — it is not where the Notion/Strava
  credentials go.

## The workbench subdomain

`workbench.enzomuhlinghaus.com` is the workbench's **canonical home**; `/toolbox/` on the apex
is a legacy path that 301s to it. Both are served by the one Worker and one build — there is no
second project — via **dashboard** configuration that is not in this repo:

1. A **Custom Domain** on the Worker for `workbench.enzomuhlinghaus.com`.
2. A **URL Rewrite** transform rule: host `workbench.enzomuhlinghaus.com` + path `/` → `/toolbox/`.
   Transform rules run *before* Workers and before asset serving, which is the whole point —
   the prerendered `/toolbox/index.html` is served untouched, so the workbench stays static and
   the "everything prerendered except `/`" rule still holds.
3. A **Redirect Rule**: host `enzomuhlinghaus.com` + path starting `/toolbox` → 301 to
   `https://workbench.enzomuhlinghaus.com/`.
4. **Always Use HTTPS** (zone-level, SSL/TLS → Edge Certificates): plain `http://` on either
   host 301s to `https://` at the edge — otherwise Google sees an HTTP twin of every page.
5. A **Redirect Rule**: host `workbench.enzomuhlinghaus.com` + path starting `/toolbox` → 301 to
   `https://workbench.enzomuhlinghaus.com/` (mirror of the apex rule; removes the 200 duplicate).

Consequences worth knowing before editing anything here:

- **Cross-host links must be absolute**, from `src/data/site.ts`. `/` on the workbench loops back
  to the workbench; `/toolbox/` from the journal would 301 rather than go direct.
- The workbench page is reachable at two URLs on the subdomain (root `/` and `/toolbox/`); the
  `/toolbox/` one 301s to the root, and the legacy apex `/toolbox/` 301s as well. The only live
  URL is the subdomain root, so `<link rel="canonical">` on it is effectively self-canonical.
- **The sitemap is hand-written** (`src/pages/sitemap.xml.ts`, on-demand) and keys off the `Host`
  header, because `@astrojs/sitemap` emits every route under a single `site:` and would have
  filed the workbench under the journal's origin. `@astrojs/sitemap` is deliberately *not* a
  dependency. Each host serves a sitemap listing only its own URL.
- Search Console treats a subdomain as a separate site: `workbench.enzomuhlinghaus.com` needs
  its **own property**, and the apex property will not report on it.
- `/robots.txt` is **Cloudflare's managed robots.txt** (it blocks GPTBot, ClaudeBot, CCBot,
  Google-Extended et al. while allowing search). There is no `public/robots.txt`, and adding one
  may override the managed file and silently drop those blocks — check before you do.

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
  `src/i18n/fr.ts` still hold English. Harmless now that only `SITE_LANG` is rendered (the
  duplicate no longer reaches the HTML), but it still blocks restoring French. The FR dictionary
  is also **pending Enzo's review** — keep it up to date, but nothing may render it until then.
- **`StravaNamer.vue` is finished but unmounted** — see the note at the top of this file for
  the three places to re-add it together.

(`entry--todo` / `thumb--todo` in `src/pages/index.astro` are not markers — they style the
"to be continued…" card on the Home contents page.)
