# enzomuhlinghaus.com

Personal site of Enzo Muhlinghaus — homepage with race journal, plus a Toolbox of
running calculators. Built with [Astro](https://astro.build) and Vue islands.
See [CLAUDE.md](CLAUDE.md) for architecture decisions and [PLAN.md](PLAN.md) for the full build plan.

## Develop

```sh
npm install
npm run dev        # dev server at localhost:4321
```

## Build & deploy (Infomaniak)

```sh
npm run build      # static site → dist/
npm run preview    # sanity-check the build locally
```

Upload the **contents of `dist/`** to the Infomaniak web root (FTP or SSH).
Every route is a real HTML file, so no server config or `.htaccess` is needed.

## Notes

- The polaroid photo `public/images/moi_slurp.jpg` is a placeholder — replace it
  with the real photo (same filename) when available.
- Race journal + PR data are sample data in `src/lib/races.ts`, to be replaced by
  an API later.
