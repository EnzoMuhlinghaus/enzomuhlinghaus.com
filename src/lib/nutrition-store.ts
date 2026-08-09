/**
 * Fuel Planner — frontend data layer (task t_e9815e44).
 *
 * Owns the live catalog + plan state for the Nutrition Planner UI. The
 * component renders what the store exposes; nothing in the UI imports the
 * static brand/product module (src/data/nutrition.ts) any more — the catalog
 * comes from GET /api/nutrition/products and plans from POST
 * /api/nutrition/plan (src/api/client.ts).
 *
 * State (reactive getters over internal refs — read them in templates,
 * computed, or watchers and they track like any ref):
 *   products          full ACTIVE catalog across every registered brand
 *   brands            meta.brands summary (incl. per-brand carb rates)
 *   productsStatus    idle → loading → ready | error
 *   productsError     normalized failure (NutritionApiError | null)
 *   plan              the current plan (null until a submit succeeds)
 *   submitting        true while a plan request is in flight
 *   submitError       normalized submit failure (NutritionApiError | null)
 *
 * The store deliberately exposes the FULL product list and brand summary:
 * brand gating (Maurten-only allowlist) is a UI concern — task t_965bfae3 —
 * and is NOT applied here. Consumers filter via productsFor(brandId).
 */

import { ref } from 'vue';
import type { BrandSummary, ProductsResponse } from '../api/contract';
import {
  createNutritionClient,
  NutritionApiError,
  type NutritionClient,
} from '../api/client';
import type { Intensity, Product } from '../data/nutrition';
import type { Plan, PlanInput } from './nutrition';

export type ProductsStatus = 'idle' | 'loading' | 'ready' | 'error';

const NETWORK_MESSAGE =
  "Couldn't reach the plan service — check your connection and try again.";

function toError(e: unknown): NutritionApiError {
  if (e instanceof NutritionApiError) return e;
  return new NutritionApiError(0, { code: 'NETWORK', message: NETWORK_MESSAGE });
}

export interface NutritionStore {
  // --- catalog (live, from GET /api/nutrition/products) -------------------
  readonly products: Product[];
  readonly brands: BrandSummary[];
  readonly productsStatus: ProductsStatus;
  readonly productsError: NutritionApiError | null;
  loadProducts(): Promise<void>;

  /** Look a product up by id in the loaded catalog. */
  getProduct(id: string): Product | undefined;
  /** Active products of one brand (no allowlist applied — UI gates brands). */
  productsFor(brandId: string): Product[];
  /**
   * Carb rate (g/h) for an intensity under a brand — from the live
   * meta.brands rules. Brand defaults to the first registered brand.
   * Returns undefined while the catalog is not loaded (or brand unknown).
   */
  carbRateFor(intensity: Intensity, brandId?: string): number | undefined;

  // --- plan (live, from POST /api/nutrition/plan) -------------------------
  readonly plan: Plan | null;
  readonly submitting: boolean;
  readonly submitError: NutritionApiError | null;
  /**
   * Submit the plan request. Resolves with the plan on success (also stored
   * in `plan`), or null on failure (details in `submitError`; the previous
   * plan, if any, is left untouched). No-op while a submit is in flight.
   */
  submitPlan(input: PlanInput): Promise<Plan | null>;
  /** Drop the current plan + submit error (back to the form). */
  resetPlan(): void;
}

export function createNutritionStore(client: NutritionClient = createNutritionClient()): NutritionStore {
  // --- catalog state ------------------------------------------------------
  const products = ref<Product[]>([]);
  const brands = ref<BrandSummary[]>([]);
  const productsStatus = ref<ProductsStatus>('idle');
  const productsError = ref<NutritionApiError | null>(null);
  let productsInflight: Promise<void> | null = null;

  // --- plan state ---------------------------------------------------------
  const plan = ref<Plan | null>(null);
  const submitting = ref(false);
  const submitError = ref<NutritionApiError | null>(null);

  async function loadProducts(): Promise<void> {
    if (productsInflight) return productsInflight;
    productsStatus.value = 'loading';
    productsError.value = null;
    productsInflight = (async () => {
      try {
        const res: ProductsResponse = await client.fetchProducts();
        products.value = res.products;
        brands.value = res.meta.brands;
        productsStatus.value = 'ready';
      } catch (e) {
        productsError.value = toError(e);
        productsStatus.value = 'error';
      } finally {
        productsInflight = null;
      }
    })();
    return productsInflight;
  }

  function getProduct(id: string): Product | undefined {
    return products.value.find((p) => p.id === id);
  }

  function productsFor(brandId: string): Product[] {
    return products.value.filter((p) => p.brandId === brandId);
  }

  function carbRateFor(intensity: Intensity, brandId?: string): number | undefined {
    const id = brandId ?? brands.value[0]?.id;
    const summary = id ? brands.value.find((b) => b.id === id) : undefined;
    return summary?.carbPerHourByIntensity?.[intensity];
  }

  async function submitPlan(input: PlanInput): Promise<Plan | null> {
    if (submitting.value) return null;
    submitting.value = true;
    submitError.value = null;
    try {
      const p = await client.submitPlan(input);
      plan.value = p;
      return p;
    } catch (e) {
      submitError.value = toError(e);
      return null;
    } finally {
      submitting.value = false;
    }
  }

  function resetPlan(): void {
    plan.value = null;
    submitError.value = null;
  }

  return {
    get products() { return products.value; },
    get brands() { return brands.value; },
    get productsStatus() { return productsStatus.value; },
    get productsError() { return productsError.value; },
    loadProducts,
    getProduct,
    productsFor,
    carbRateFor,
    get plan() { return plan.value; },
    get submitting() { return submitting.value; },
    get submitError() { return submitError.value; },
    submitPlan,
    resetPlan,
  };
}

/** App-wide singleton — consumed by NutritionPlanner.vue (and the UI task). */
export const nutritionStore: NutritionStore = createNutritionStore();
