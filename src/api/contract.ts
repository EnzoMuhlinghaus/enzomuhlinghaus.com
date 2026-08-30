/**
 * Fuel Planner — API contract types (contract task t_12a4f60d).
 *
 * Single import surface for everything that crosses the wire between the
 * workbench UI and the plan service. Re-exports the domain types that the
 * engine/catalog already define and adds the endpoint envelopes:
 *
 *   GET  /api/nutrition/products  → 200 ProductsResponse
 *   POST /api/nutrition/plan      → 200 PlanResponse  · 4xx/5xx ErrorResponse
 *
 * The authoritative prose spec is docs/nutrition-plan-api.md; golden JSON
 * fixtures live in test/fixtures/nutrition/ (generated from the real
 * handler, never hand-edited).
 */

export type {
  Brand,
  BrandRules,
  FormatPreference,
  Intensity,
  Product,
  ProductFormat,
} from '../data/nutrition';

export type {
  NormalizedPlanInput,
  Plan,
  PlanInput,
  PlanItem,
  PlanTarget,
  PlanTotals,
  PreRacePreload,
  ScheduleEntry,
} from '../lib/nutrition';

export type { ApiError, FieldError } from '../lib/validate';

// Local bindings for the envelope types below (re-exports above don't bring
// the names into scope for use in this file's own declarations).
import type { Intensity, Product } from '../data/nutrition';
import type { Plan } from '../lib/nutrition';
import type { ApiError } from '../lib/validate';

/**
 * Brand row in the products endpoint's meta.brands summary.
 *
 * Includes the brand's carb-rate rules (g/h per intensity) so the frontend
 * data layer can render rate hints from live data instead of a hardcoded
 * copy of the brand config (data-layer task t_e9815e44).
 */
export interface BrandSummary {
  id: string;
  name: string;
  currency: string;
  ruleVersion: number;
  catalogVersion: string;
  /** Carb rate by intensity (g/h) — the brand's own rules. */
  carbPerHourByIntensity: Record<Intensity, number>;
}

/** 200 body of GET /api/nutrition/products. */
export interface ProductsResponse {
  meta: {
    generatedAt: string;
    brands: BrandSummary[];
  };
  products: Product[];
}

/** 200 body of POST /api/nutrition/plan. */
export type PlanResponse = Plan;

/** Body of every 4xx/5xx response. */
export interface ErrorResponse {
  error: ApiError;
}
