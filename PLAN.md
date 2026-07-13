# Implement enzomuhlinghaus.com from the Claude Design project

## Context

The repo is empty (README only). The Claude Design project **"Enzo's Personal Website Design"** (`96d7b1a6-139c-4c81-af68-b170975927d0`) fully specifies a 6-page personal site with an "expedition map" aesthetic: a homepage (hero photo, live Vancouver clock + Open-Meteo weather, polaroid, animated compass rose, marathon route traces, toolbox cards, race journal, PR blackboard), a Toolbox index, and four running tools whose logic is already written in the designs (Pace Calculator, MAS/VO2max Estimator, Race Predictor, Strava Namer). Every page carries full EN/FR strings.

**Decisions made with the user:**
- **Stack**: Astro (static output) + **Vue** islands for the four tools. Real HTML per route → works on Infomaniak shared hosting with a plain file upload.
- **Vibe variant removed**: hard-code the "alpine morning" look (accent `#c25c26`, neutral hero tint). Strip all vibe-switching logic when porting.
- **Language**: single URL per page; auto-detect from `navigator.language` with a clickable EN/FR toggle persisted in `localStorage`.
- **Hosting**: existing Infomaniak web host — build to `dist/`, upload manually (document it; no CI needed now).
- **Styling**: plain CSS, no framework. `global.css` holds design tokens as CSS custom properties (`--accent: #c25c26`, `--ink: #26302a`, `--cream: #f6ecd7`, `--parchment: #d9c29a`, `--footer-green: #33453a`, font stacks) plus shared classes for repeated patterns; page/component-specific styles live in Astro scoped `<style>` blocks and Vue `<style scoped>`.

## First step: repo docs

Before any code, store the planning docs in the repo:
- Copy this plan to `PLAN.md` at the repo root.
- Create a `CLAUDE.md` for future sessions: what the site is, the design-project source (`96d7b1a6-139c-4c81-af68-b170975927d0` via the claude_design MCP / DesignSync), the locked decisions (Astro + Vue islands, plain CSS + tokens, alpine-morning only, i18n mechanism, Infomaniak static hosting), commands (`npm run dev/build/preview`), and the races/PR data note below.

## Project setup

```
npm create astro@latest . -- --template minimal --typescript strict
npx astro add vue
```

Fonts via `@fontsource` packages (self-hosted, no Google request): `archivo`, `instrument-serif`, `jetbrains-mono`, `caveat`.

## Structure

```
src/
  layouts/Layout.astro        # head, fonts, meta/OG, pre-paint language script
  components/
    Nav.astro                 # subpage nav (← ENZO MUHLINGHAUS, breadcrumb, lang toggle)
    Footer.astro              # dark-green footer, social links (shared by all pages)
    LangToggle.astro          # EN/FR badge, click toggles
    tools/
      PaceCalculator.vue
      MasEstimator.vue
      RacePredictor.vue
      StravaNamer.vue
  lib/
    time.ts                   # parseTime / formatTime (verbatim from designs)
    vdot.ts                   # Daniels/Gilbert model: vo2Cost, pctVO2max, vdotFromRace,
                              # velocityAtVO2max, timeMinFromVdot, riegelFit
    lang.ts                   # lang store for Vue islands (reads html[data-lang], listens for toggle event)
    races.ts                  # race journal + PR data — SAMPLE DATA for now (see note below)
  styles/global.css           # palette, parchment background, chip/button/card classes
  pages/
    index.astro
    toolbox/index.astro
    toolbox/pace-calculator.astro
    toolbox/mas-vo2max.astro
    toolbox/race-predictor.astro
    toolbox/strava-namer.astro
public/
  images/  (hero jpg, moi_slurp.jpg, paris-trace.svg, vancouver-trace.svg, favicon)
```

Routes match the design breadcrumbs (`TOOLBOX / PACE CALCULATOR` → `/toolbox/pace-calculator/`).

## Porting rules (design → real site)

- The `.dc.html` files are React-style components with `{{ }}` bindings, `sc-for`/`sc-if`, `style-hover`/`style-focus`. Port markup to Astro/Vue templates; move the repeated inline styles into `global.css` classes (chips, tool cards, dashed result panels, inputs, footer buttons); `style-hover`/`style-focus` become `:hover`/`:focus-visible` rules.
- Copy the tools' logic functions **verbatim** (parseTime, formatTime, VDOT math, Riegel fit, Strava name banks) into `lib/` + the Vue components; convert `state`/`setState` to `ref`/`computed`.
- Delete every `VIBES` map and `vibe` prop; inline `#c25c26` (as CSS var `--accent`) and the alpine-morning hero tint.
- Keep all design content as-is: race journal entries, PR blackboard times (10K 38:50, Half 1:27:42), photo caption, social URLs, `mailto:pro@enzomuhlinghaus.com`. The footer "Résumé / CV ↓" link is a placeholder (`#sayhi`) in the design — keep it and flag as a TODO for a real CV PDF.

## Races & PR data: sample now, API later

The user will build an API later to supply the race journal and PR blackboard data. For now, use the sample data from the Homepage design, but structure for the swap:
- Keep all race + PR entries in `src/lib/races.ts` as typed data (`Race { day, name, location, type, timeSeconds|null, rank, field, pr, state }`, `PR { distance, time|null }`) with the display mapping (flags, rank labels, EN/FR state labels) as functions over that data — one obvious file to replace with a fetch later.
- Render from this data at build time (static) for now; when the API exists it can either feed the build or be fetched client-side without touching the page markup.

## i18n mechanism

- Inline **pre-paint script** in `<head>`: `lang = localStorage.lang ?? (navigator.language.startsWith('fr') ? 'fr' : 'en')` → sets `<html lang data-lang>`. No flash of wrong language.
- Static text: paired elements `<span class="i18n-en">…</span><span class="i18n-fr">…</span>` toggled purely by CSS (`html[data-lang="fr"] .i18n-en { display:none }` etc.). Locale-formatted things (clock date) re-render from the toggle event.
- Toggle click: flips `data-lang`, writes `localStorage`, dispatches a `langchange` CustomEvent.
- Vue islands: `lib/lang.ts` exposes a reactive `lang` ref initialised from `html[data-lang]` and updated on `langchange`; each component keeps its own EN/FR label dictionaries from the design.

## Homepage dynamic bits (vanilla JS, no framework needed)

- Clock: 1 s interval, `toLocaleTimeString` with `America/Vancouver`, locale switches with language (fr-CA 24 h / en-US 12 h).
- Weather: fetch Open-Meteo (`latitude=49.28&longitude=-123.12&current_weather=true`) on load + every 10 min; map weathercode → emoji + label per the design; graceful "—" on failure.
- Compass rose `rose-spin` 90 s animation and polaroid hover from the design CSS.

## Assets (export from the design project)

Fetch via `DesignSync get_file` (base64) and decode to `public/images/`:
- `uploads/paris-trace.svg`, `uploads/vancouver-trace.svg` (small, text)
- `uploads/moi_slurp.jpg` (polaroid)
- `uploads/adrian-yu-Wc45W-dQFlA-unsplash.jpg` (hero)

`get_file` is capped at 256 KiB. If a JPG comes back truncated: the hero is Unsplash photo `Wc45W-dQFlA` (Adrian Yu) — download the original from Unsplash instead; if `moi_slurp.jpg` is too large, ask the user to drop the file into `public/images/` (it's a personal photo, no other source).

Compress/resize images sensibly (hero ≤ ~250 KB at ~2000 px wide). Favicon: small diamond/compass mark in the accent color.

## Responsive adaptation (designs are desktop-fixed)

The design uses fixed 44 px gutters, absolute hero overlays, and a 4-column card grid. Add:
- Toolbox grids: 4→2→1 columns (homepage) and 2→1 (toolbox page).
- Hero: `clamp()` headline sizing; on narrow screens the polaroid moves into flow below the hero; the position/clock badge wraps.
- Race journal + PR blackboard: stack vertically on mobile.
- Footer: buttons wrap; test at the 375 px preset.

## SEO / meta

Per-page `<title>` + description (EN), OG image from the hero photo, `lang` attr set by the pre-paint script, sitemap via `@astrojs/sitemap`, `site: 'https://enzomuhlinghaus.com'` in `astro.config`.

## Deployment (Infomaniak)

`npm run build` → upload `dist/` contents to the host's web root (FTP/SSH per Infomaniak account). Add a short `README.md` section documenting build + upload. No `.htaccess` needed (real HTML files per route).

## Verification

1. `npm run build` passes; `npm run preview` (or dev server via the Browser pane) — visit all 6 routes.
2. Calculators against known values from the design defaults:
   - Pace: 10 km in 40:00 → 4:00/km (≈15.0 km/h); unit switch converts distance + pace.
   - MAS/VO2max: 10K 38:50 → VDOT ≈ 52 ± 1, MAS ≈ 17–18 km/h, four zone paces render.
   - Predictor: 10K 38:50 → Half ≈ 1:25–1:27; adding a second race switches tag to PERSONALIZED; MAS input switches to FROM MAS.
   - Strava Namer: chips switch content, shuffle cycles variants, copy puts title+desc on clipboard (✓ feedback).
3. Language: with a French browser locale the site loads in FR; toggle flips instantly with no reload and persists across pages/reloads.
4. Homepage: clock ticks in Vancouver time, weather badge populates (and shows placeholder if the fetch is blocked).
5. Responsive: check mobile (375 px) and desktop presets in the Browser pane; no horizontal scroll.
