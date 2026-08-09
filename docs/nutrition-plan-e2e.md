# Nutrition Plan — end-to-end test report

Branch: `feat/fuel-planner` · Staging: `astro dev` (Cloudflare Worker adapter, port 4399)
Served tree verified byte-identical to the pushed commit this report was produced against.

## Automated e2e suites — all green

| Suite | Result |
|---|---|
| API contract e2e (`verify/api_e2e.py`) — spec §8 S1–S5 + §5.4 error contract + brand gate | **32/32 PASS** |
| Browser e2e (`verify/browser_e2e.py`, Playwright, 29 named checks + screenshots) | **38/38 PASS** |
| Vitest unit + live integration (`LIVE_BASE` set) | **62/62 PASS** (55 unit + 7 live) |
| `astro check` | 0 errors / 0 warnings / 0 hints (48 files) |

Spec §8 sample scenarios, verified live end-to-end (exact items + totals, Σ(unitPrice×quantity) == totals.price):

| Scenario | Request | Items | Total |
|---|---|---|---|
| S1 | easy 60′ 62 kg 18 °C | 1× Gel 100 | $3.75 |
| S2 | moderate 120′ 70 kg 20 °C | 1× DM160 + 2× Gel160 | $11.66 |
| S3 | race 190′ 62 kg 15 °C caffeine | 1× DM320 + 3× Gel160 + 1× Gel100Caf | $21.71 (+ preload DM320 $3.64) |
| S4 | hard 120′ 70 kg 30 °C | 1× DM320 + 1× Gel160 + 1× Gel100 | $11.97 (heat note present) |
| S5 | easy 30′ | — | $0.00 |

## Manual browser test pass — scenario / steps / expected vs actual

| # | Scenario | Steps | Expected | Actual | Result |
|---|---|---|---|---|---|
| 1 | Initial load | Open `/toolbox`, wait for hydration, inspect console + network | No console errors; products API 200; no failed requests | 0 console/js errors; products → 200; 0 failed resources | PASS |
| 2 | Selecting a plan (S3) | 190 min / RACE / 62 kg / 15 °C / caffeine YES → submit | Hero $21.71 | $21.71 · `5 UNITS · 225 G CARBS · 3:10 RACE` · 1× DM320 $3.64 + 3× Gel160 $13.74 + 1× Gel100Caf $4.33 · schedule −90′ preload … 120′ caffeine · disclaimer | PASS |
| 3 | Adjust back preserves values | Back after results | Form keeps inputs | 190 / 62 / 15 retained | PASS |
| 4 | Validation error (backend 400 path) | Clear duration → submit | Banner + recap + red field | `Couldn't work that out` · `1 field(s) failed validation` · recap `SESSION LENGTH — enter a length in minutes` · `.has-error` | PASS |
| 5 | Recovery | Fill 90 min → submit | Results, non-zero | $7.97 | PASS |
| 6 | MVP: no-fuel | 30 min / EASY → submit | $0.00 + "No fuel needed" | `$0.00` · `No fuel needed for this session` · `0 UNITS · 0 G CARBS · 0:30 EASY` | PASS |
| 7 | Network error | Stop backend → submit | Plain banner, no recap, retry | `Couldn't reach the plan service — check your connection and try again.` · no recap · `try again` present | PASS |
| 8 | Recovery after network error | Restart backend → resubmit | $8.91 | $8.91 = Gel160 $4.58 + Gel100Caf $4.33 | PASS |
| 9 | Maurten-only brand gating | Inspect catalog; POST brand=siS | Catalog Maurten-only; API rejects others | 8 Maurten rows (Gel/Drink Mix/Solid), all enabled, no non-Maurten; `siS` → **400 UNKNOWN_BRAND** `expected one of maurten`; `GET products` exposes only `brands:[maurten]` | PASS |
| 10 | Final console + network sweep | After all scenarios | Clean | 0 errors (only expected dev-mode logs during the intentional outage); 0 failed / ≥400 requests | PASS |

Notes:

- The disabled/"coming soon" rendering for non-Maurten products is unit-tested with a synthetic
  2nd brand (`test/product-catalog.test.ts`, 18 tests); the live catalog carries only the
  allowlisted brand, so no disabled row exists in staging.
- Keyboard submit (Enter) and pointer click both submit; real pointer clicks are covered by the
  Playwright suite.
- The retry-after-network-error path is covered deterministically by `verify/browser_e2e.py`
  (route abort → error banner → unroute → retry → $8.91).
