/**
 * Fuel Planner — brand & product catalog data (v1: Maurten).
 *
 * Pure data module, no runtime imports (mirrors site.ts convention).
 * Adding a brand = one Brand entry (with BrandRules) + Product[] rows;
 * the engine (src/lib/nutrition.ts) and any future API stay brand-agnostic.
 *
 * Prices: maurten.com US store, Aug 2026. unitPrice = boxPrice / boxSize,
 * rounded to cents (derived here so the catalog stays consistent).
 */

export type Intensity = 'easy' | 'moderate' | 'hard' | 'race';
export type ProductFormat = 'gel' | 'drink' | 'solid';
export type FormatPreference = 'auto' | 'gels' | 'drink' | 'mixed';

/** Tunable constants that drive the rules engine (nutrition-plan-spec §6). */
export interface BrandRules {
  /** g carbs per hour, by intensity (spec §3.1). */
  carbPerHourByIntensity: Record<Intensity, number>;
  /** Reference body weight (kg) the carb rate is calibrated for. */
  weightRefKg: number;
  /** Clamp range for the weight factor, e.g. [0.85, 1.15]. */
  weightFactorRange: [number, number];
  /** Sessions shorter than this (min) get the cap below. */
  shortSessionMin: number;
  /** Carb-target cap (g) applied to sessions under shortSessionMin. */
  shortSessionCapG: number;
  /** At/above this temperature (°C), the liquid share becomes liquidShareHeat. */
  heatThresholdC: number;
  /** Liquid share of the carb target (auto/mixed format, below heat threshold). */
  liquidShareDefault: number;
  /** Liquid share when temperatureC >= heatThresholdC. */
  liquidShareHeat: number;
  /** Greedy-fill threshold (g): below this, no further unit is added. */
  minUnitG: number;
  /** Drink-mix serving size (g carbs) used per intensity class (spec §3.2). */
  drinkCarbsGByIntensity: Record<Intensity, number>;
  /** Optional pre-race preload (race intensity, sessions >= minMinutes). */
  preRacePreload: { minMinutes: number; productId: string; timingLabel: string } | null;
  /** ISO 4217 currency code for all prices in this brand's catalog. */
  currency: string;
}

/** One purchasable unit (a serving) of a product (spec §6). */
export interface Product {
  id: string; // slug: brand-product, e.g. "maurten-gel-100"
  brandId: string;
  name: string;
  format: ProductFormat;
  /** g carbs per serving. */
  carbsG: number;
  /** mg caffeine per serving, or null. */
  caffeineMg: number | null;
  servingSize: string; // "1 sachet" | "500 ml" | "1 bar"
  boxSize: number;
  boxPrice: number; // store price for the box
  unitPrice: number; // boxPrice / boxSize, rounded to cents (derived)
  /** Engine eligibility: false for Additions, Bicarb, Gel Mix 480 v1, caffeine drink mixes. */
  autoSelect: boolean;
  active: boolean;
  sourceUrl: string;
  updatedAt: string; // "2026-08-09"
}

export interface Brand {
  id: string;
  name: string;
  rules: BrandRules;
  active: boolean;
  /** Audit fields that ride along in the API `meta` block. */
  ruleVersion: number;
  catalogVersion: string;
}

export const MAURTEN_BRAND: Brand = {
  id: 'maurten',
  name: 'Maurten',
  active: true,
  ruleVersion: 1,
  catalogVersion: '2026-08',
  rules: {
    carbPerHourByIntensity: { easy: 40, moderate: 60, hard: 75, race: 90 },
    weightRefKg: 70,
    weightFactorRange: [0.85, 1.15],
    shortSessionMin: 90,
    shortSessionCapG: 60,
    heatThresholdC: 25,
    liquidShareDefault: 0.35,
    liquidShareHeat: 0.5,
    minUnitG: 20,
    drinkCarbsGByIntensity: { easy: 40, moderate: 40, hard: 80, race: 80 },
    preRacePreload: {
      minMinutes: 150,
      productId: 'maurten-drink-mix-320',
      timingLabel: '90 minutes before start',
    },
    currency: 'USD',
  },
};

function makeProduct(p: Omit<Product, 'brandId' | 'unitPrice'>): Product {
  return {
    ...p,
    brandId: 'maurten',
    unitPrice: Math.round((p.boxPrice / p.boxSize) * 100) / 100,
  };
}

/** Maurten catalog — spec §4 (prices: maurten.com US store, Aug 2026). */
export const MAURTEN_PRODUCTS: Product[] = [
  makeProduct({
    id: 'maurten-gel-100',
    name: 'Gel 100',
    format: 'gel',
    carbsG: 25,
    caffeineMg: null,
    servingSize: '1 sachet',
    boxSize: 12,
    boxPrice: 45.0,
    autoSelect: true,
    active: true,
    sourceUrl: 'https://www.maurten.com/us/fuel/gel-100',
    updatedAt: '2026-08-09',
  }),
  makeProduct({
    id: 'maurten-gel-100-caf-100',
    name: 'Gel 100 Caf 100',
    format: 'gel',
    carbsG: 25,
    caffeineMg: 100,
    servingSize: '1 sachet',
    boxSize: 12,
    boxPrice: 52.0,
    autoSelect: true, // swap-eligible via the caffeine rule
    active: true,
    sourceUrl: 'https://www.maurten.com/us/fuel/gel-100-caf-100',
    updatedAt: '2026-08-09',
  }),
  makeProduct({
    id: 'maurten-gel-160',
    name: 'Gel 160',
    format: 'gel',
    carbsG: 40,
    caffeineMg: null,
    servingSize: '1 sachet',
    boxSize: 12,
    boxPrice: 55.0,
    autoSelect: true,
    active: true,
    sourceUrl: 'https://www.maurten.com/us/fuel/gel-160',
    updatedAt: '2026-08-09',
  }),
  makeProduct({
    id: 'maurten-drink-mix-160',
    name: 'Drink Mix 160',
    format: 'drink',
    carbsG: 40,
    caffeineMg: null,
    servingSize: '500 ml',
    boxSize: 18,
    boxPrice: 45.0,
    autoSelect: true,
    active: true,
    sourceUrl: 'https://www.maurten.com/us/fuel/drink-mix-160',
    updatedAt: '2026-08-09',
  }),
  makeProduct({
    id: 'maurten-drink-mix-320',
    name: 'Drink Mix 320',
    format: 'drink',
    carbsG: 80,
    caffeineMg: null,
    servingSize: '500 ml',
    boxSize: 14,
    boxPrice: 51.0,
    autoSelect: true,
    active: true,
    sourceUrl: 'https://www.maurten.com/us/fuel/drink-mix-320',
    updatedAt: '2026-08-09',
  }),
  makeProduct({
    id: 'maurten-drink-mix-320-caf-100',
    name: 'Drink Mix 320 Caf 100',
    format: 'drink',
    carbsG: 80,
    caffeineMg: 100,
    servingSize: '500 ml',
    boxSize: 14,
    boxPrice: 56.0,
    // Catalogued but NOT auto-selected in v1 (spec §3.3); only reachable via the
    // caffeine swap on liquid-only plans (spec §3.2).
    autoSelect: false,
    active: true,
    sourceUrl: 'https://www.maurten.com/us/fuel/drink-mix-320-caf-100',
    updatedAt: '2026-08-09',
  }),
  makeProduct({
    id: 'maurten-solid-160',
    name: 'Solid 160',
    format: 'solid',
    carbsG: 40,
    caffeineMg: null,
    servingSize: '1 bar',
    boxSize: 12,
    boxPrice: 36.0,
    autoSelect: false, // solid = pre/post option, manual (v1)
    active: true,
    sourceUrl: 'https://www.maurten.com/us/fuel/solid-160',
    updatedAt: '2026-08-09',
  }),
  makeProduct({
    id: 'maurten-solid-c-160',
    name: 'Solid C 160',
    format: 'solid',
    carbsG: 40,
    caffeineMg: null,
    servingSize: '1 bar',
    boxSize: 12,
    boxPrice: 36.0,
    autoSelect: false,
    active: true,
    sourceUrl: 'https://www.maurten.com/us/fuel/solid-c-160',
    updatedAt: '2026-08-09',
  }),
];

/**
 * Brand registry. Add a new brand here + its Product rows; nothing else
 * in the engine or API needs to change.
 */
export const BRANDS: Record<string, Brand> = {
  maurten: MAURTEN_BRAND,
};

export const DEFAULT_BRAND_ID = 'maurten';

export const PRODUCTS: Product[] = [...MAURTEN_PRODUCTS];

export function getBrand(id: string): Brand | undefined {
  return BRANDS[id];
}

export function getProducts(brandId: string): Product[] {
  return PRODUCTS.filter((p) => p.brandId === brandId && p.active);
}
