# Fuel Planner — API Contract (Nutrition Plan)

Authoritative wire contract for the Fuel Planner (Nutrition Plan) flow.
Covers both endpoints served by the plan service: fetching the product
catalog and calculating a plan. Spec source: `nutrition-plan-spec.md`
(t_5b54e345) §5; this document is the exact, implementation-verified shape.

- **Contract task:** t_12a4f60d
- **Served by:** the standalone service (`POST /api/nutrition/plan`,
  `GET /api/nutrition/products`, `GET /health`) and the Astro Worker routes
  `src/pages/api/nutrition/plan.ts` / `src/pages/api/nutrition/products.ts`
  — both reuse the same framework-agnostic `handleRequest()` in
  `src/api/handler.ts`, so the JSON contract is identical in both places.
- **Types:** `src/api/contract.ts` is the single import surface.
- **Fixtures:** golden JSON in `test/fixtures/nutrition/` — generated from
  the real handler (never hand-edited), covering every §8 scenario + every
  §5.4 error case + a multi-brand sample for the UI brand-gating task.

---

## 1. Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/nutrition/products` | Fetch the available product catalog (optional `?brand=<id>` filter) |
| POST | `/api/nutrition/plan` | Create / calculate a nutrition plan |
| GET | `/health` | Liveness (`{ ok: true, service: "nutrition-plan" }`) |

Both business endpoints answer `Content-Type: application/json; charset=utf-8`.

---

## 2. GET /api/nutrition/products

Fetch the purchasable catalog. Returns every **active** product across the
registered brands, with a compact brand summary so clients can render brand
gating without hardcoding names.

### 2.1 Query parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `brand` | string | no | Brand id to filter by. Omitted → all active brands' products. Unknown → 400 `UNKNOWN_BRAND`. |

### 2.2 Response 200

```json
{
  "meta": {
    "generatedAt": "2026-08-09T18:30:00.000Z",
    "brands": [
      { "id": "maurten", "name": "Maurten", "currency": "USD",
        "ruleVersion": 1, "catalogVersion": "2026-08",
        "carbPerHourByIntensity": { "easy": 40, "moderate": 60, "hard": 75, "race": 90 } }
    ]
  },
  "products": [
    {
      "id": "maurten-gel-100",
      "brandId": "maurten",
      "name": "Gel 100",
      "format": "gel",
      "carbsG": 25,
      "caffeineMg": null,
      "servingSize": "1 sachet",
      "boxSize": 12,
      "boxPrice": 45.0,
      "unitPrice": 3.75,
      "autoSelect": true,
      "active": true,
      "sourceUrl": "https://www.maurten.com/us/fuel/gel-100",
      "updatedAt": "2026-08-09"
    }
  ]
}
```

### 2.3 Product fields

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Product identifier (slug `brand-product`, e.g. `maurten-gel-100`) |
| `brandId` | string | Owning brand id (registry key) |
| `name` | string | Display name (e.g. `Gel 100`) |
| `format` | `"gel" \| "drink" \| "solid"` | Product format |
| `carbsG` | number | g carbs per serving |
| `caffeineMg` | number \| null | mg caffeine per serving, `null` = none |
| `servingSize` | string | `1 sachet` \| `500 ml` \| `1 bar` |
| `boxSize` | number | Units per store box |
| `boxPrice` | number | Store price of the box (USD, v1) |
| `unitPrice` | number | `boxPrice / boxSize`, rounded to cents — the unit price used in plan line totals |
| `autoSelect` | boolean | Engine eligibility (false for Additions, Bicarb, caffeine drink mixes, solids) |
| `active` | boolean | Catalogued & purchasable (inactive rows are never returned) |
| `sourceUrl` | string | Store product page |
| `updatedAt` | string | Catalog audit date (`YYYY-MM-DD`) |

`meta.brands[]` fields: `id` (registry key), `name` (display name),
`currency` (ISO 4217), `ruleVersion`, `catalogVersion`, and
`carbPerHourByIntensity` (g/h per intensity — the brand's own carb-rate
rules, exposed so the frontend data layer renders rate hints from live
data instead of a hardcoded brand config; added by the data-layer task).

---

## 3. POST /api/nutrition/plan

### 3.1 Request body

| Field | Type | Required | Default | Range / enum |
|---|---|---|---|---|
| `brand` | string | no | `maurten` | registered brand id |
| `durationMinutes` | integer | **yes** | — | 5–720 |
| `intensity` | enum | **yes** | — | `easy` \| `moderate` \| `hard` \| `race` |
| `bodyWeightKg` | number | no | 70 | 30–200 |
| `temperatureC` | number \| null | no | null | −20–50 (null = unknown) |
| `caffeine` | boolean | no | false | — |
| `formatPreference` | enum | no | `auto` | `auto` \| `gels` \| `drink` \| `mixed` |
| `preRacePreload` | boolean | no | true | include pre-race drink (race intensity only) |

```json
{
  "brand": "maurten",
  "durationMinutes": 190,
  "intensity": "race",
  "bodyWeightKg": 62,
  "temperatureC": 15,
  "caffeine": true,
  "formatPreference": "auto",
  "preRacePreload": true
}
```

### 3.2 Response 200

Top-level keys: `meta`, `inputs` (normalized echo), `target`, `items[]`,
`totals`, `schedule[]`, `preRacePreload`, `assumptions[]`, `notes[]`.

```json
{
  "meta": {
    "brand": "maurten",
    "currency": "USD",
    "ruleVersion": 1,
    "catalogVersion": "2026-08",
    "generatedAt": "2026-08-09T18:30:00.000Z"
  },
  "inputs": {
    "brand": "maurten",
    "durationMinutes": 190,
    "intensity": "race",
    "bodyWeightKg": 62,
    "temperatureC": 15,
    "caffeine": true,
    "formatPreference": "auto",
    "preRacePreload": true
  },
  "target": {
    "hours": 3.17,
    "carbsPerHour": 90,
    "weightFactor": 0.886,
    "totalCarbsTargetG": 252.7,
    "cappedG": null
  },
  "items": [
    {
      "productId": "maurten-drink-mix-320",
      "name": "Drink Mix 320",
      "format": "drink",
      "quantity": 1,
      "unitPrice": 3.64,
      "subtotal": 3.64,
      "carbsG": 80,
      "caffeineMg": null,
      "servingSize": "500 ml"
    }
  ],
  "totals": {
    "carbsDeliveredG": 225,
    "targetG": 252.7,
    "itemCount": 3,
    "units": 5,
    "price": 21.71
  },
  "schedule": [
    { "offsetMin": 0,   "label": "Start", "action": "Sip 1× Drink Mix 320 steadily over the first hour", "productId": "maurten-drink-mix-320" },
    { "offsetMin": 30,  "label": "Gel 1", "action": "Take 1× Gel 160 with water", "productId": "maurten-gel-160" }
  ],
  "preRacePreload": {
    "productId": "maurten-drink-mix-320",
    "quantity": 1,
    "timing": "90 minutes before start",
    "price": 3.64
  },
  "assumptions": [
    "Carb target 90 g/h for race intensity",
    "Weight factor 0.89 applied (62 kg vs 70 kg reference)",
    "35% of carbs from liquid, 65% from gels (auto format, < 25 °C)",
    "Gel 160 chosen by largest-fitting-unit rule; last gel swapped for caffeine variant"
  ],
  "notes": [
    "Practice this exact plan in training — race day is not for experiments",
    "Drink water to thirst alongside; plan extra fluid if hot",
    "Estimates only — not medical advice"
  ]
}
```

### 3.3 PlanItem fields (line items)

| Field | Type | Meaning |
|---|---|---|
| `productId` | string | Product identifier (links to catalog `id`) |
| `name` | string | Product display name |
| `format` | `"gel" \| "drink" \| "solid"` | Product format |
| `quantity` | number | Whole servings in this plan |
| `unitPrice` | number | Price per serving (catalog `unitPrice`) |
| `subtotal` | number | **Line total** = `quantity × unitPrice`, rounded to cents |
| `carbsG` | number | g carbs per serving |
| `caffeineMg` | number \| null | mg caffeine per serving |
| `servingSize` | string | Serving label |

### 3.4 PlanTotals fields

| Field | Type | Meaning |
|---|---|---|
| `carbsDeliveredG` | number | Σ carbs over all line items |
| `targetG` | number | Carb target (rounded to 1 dp) |
| `itemCount` | number | Distinct products |
| `units` | number | Σ quantities |
| `price` | number | **Estimated total price** = Σ subtotals, rounded to cents |

---

## 4. Error payloads (all endpoints)

Every 4xx/5xx response has the same envelope:

```json
{
  "error": {
    "code": "VALIDATION",
    "message": "2 field(s) failed validation",
    "fields": [
      { "field": "durationMinutes", "code": "REQUIRED" },
      { "field": "intensity", "code": "INVALID_ENUM", "detail": "expected one of easy|moderate|hard|race" }
    ]
  }
}
```

### 4.1 Error codes

| HTTP | `code` | When | `fields[]` |
|---|---|---|---|
| 400 | `VALIDATION` | One or more request fields invalid; message is `"N field(s) failed validation"` | one entry per bad field |
| 400 | `UNKNOWN_BRAND` | `brand` not in the registry (plan body or products `?brand=`) | `[{ field: "brand", code: "UNKNOWN_BRAND", detail: "expected one of …" }]` |
| 404 | `NOT_FOUND` | Unknown route | — |
| 405 | `METHOD_NOT_ALLOWED` | Wrong method on a known route | — |
| 413 | `PAYLOAD_TOO_LARGE` | Request body > 64 KB (server guard) | — |
| 500 | `INTERNAL` | Unexpected failure | — |

### 4.2 Field error codes (inside `VALIDATION`)

| Code | Meaning | Extra |
|---|---|---|
| `REQUIRED` | Field missing | — |
| `INVALID_TYPE` | Wrong JSON type | `detail`: expected type |
| `INVALID_ENUM` | Value not in enum | `detail`: `expected one of a\|b\|c` |
| `OUT_OF_RANGE` | Outside min/max | `detail`: `expected 5–720` + numeric `min`/`max` |
| `INVALID_JSON` | Body is not valid JSON | `field: "body"` |

---

## 5. Fixtures (test/fixtures/nutrition/)

Golden JSON, generated from the real handler via
`scripts/generate-fixtures.mjs` (upstream service), committed as-is.

| File | Contents |
|---|---|
| `products.json` | 200 response of `GET /api/nutrition/products` (8 Maurten products) |
| `products-brand-maurten.json` | Same, `?brand=maurten` (identical in v1) |
| `products-multibrand.json` | Multi-brand sample: Maurten + synthetic `acme` brand — for UI brand-gating tests (non-Maurten present but must be disabled) |
| `plan-s1.json` … `plan-s5.json` | Full 200 responses for spec §8 scenarios S1–S5 |
| `errors.json` | One payload per error case: VALIDATION multi-field, UNKNOWN_BRAND, OUT_OF_RANGE, INVALID_TYPE, INVALID_ENUM, INVALID_JSON, METHOD_NOT_ALLOWED, NOT_FOUND, PAYLOAD_TOO_LARGE |
| `index.ts` | Typed re-exports (`products`, `plans`, `errors`) for vitest/UI imports |

Scenario requests (for reference — fixture files pair request + response):

| ID | Request | Expected totals (delivered / target / units / price) |
|---|---|---|
| S1 | easy 60′, 62 kg, 18 °C | 25 g / 35.4 g / 1 / **$3.75** |
| S2 | moderate 120′, 70 kg, 20 °C | 120 g / 120 g / 3 / **$11.66** |
| S3 | race 190′, 62 kg, 15 °C, caffeine | 225 g / 252.7 g / 5 / **$21.71** (+ preload $3.64) |
| S4 | hard 120′, 70 kg, 30 °C | 145 g / 150 g / 3 / **$11.97** (heat note) |
| S5 | easy 30′ | 0 g / 0 g / 0 / **$0.00** (no fuel) |

---

## 6. Notes

- `generatedAt` is runtime-generated — tests must not compare it byte-for-byte;
  fixtures snapshot it at generation time.
- Prices are USD from maurten.com (Aug 2026); `unitPrice = boxPrice / boxSize`
  rounded to cents (derived in the catalog, not stored).
- Adding a brand = one `Brand` entry + `Product[]` rows + registry key; the
  engine, validator, both endpoints, and the contract need no changes
  (proven by `test/multibrand.test.ts` + `products-multibrand.json`).
