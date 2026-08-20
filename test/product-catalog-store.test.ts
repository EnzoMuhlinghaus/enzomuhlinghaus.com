// @vitest-environment happy-dom
/**
 * Fuel Planner — store → catalog integration test (UI task t_965bfae3).
 *
 * Guards the wiring contract between the data layer (nutrition-store.ts,
 * task t_e9815e44) and the ProductCatalog UI: the store exposes
 * products / productsStatus / productsError, and the catalog consumes them
 * directly as props. If either side drifts (renamed getters, changed status
 * union), this file breaks — that's the point.
 */
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createNutritionStore } from '../src/lib/nutrition-store';
import type { NutritionClient } from '../src/api/client';
import ProductCatalog from '../src/components/tools/ProductCatalog.vue';
import { productsMultibrandFixture } from './fixtures/nutrition';

function storeWithCatalog() {
  const client = {
    fetchProducts: vi.fn().mockResolvedValue(productsMultibrandFixture),
    submitPlan: vi.fn(),
  } as unknown as NutritionClient;
  return createNutritionStore(client);
}

describe('nutritionStore → ProductCatalog wiring', () => {
  it('feeds the live catalog straight from the store into the component', async () => {
    const store = storeWithCatalog();
    const load = store.loadProducts();
    // While in flight: status is loading → catalog shows the loading state.
    const w = mount(ProductCatalog, {
      props: {
        products: store.products,
        status: store.productsStatus,
        error: store.productsError,
      },
    });
    await load;
    // Status flipped to ready inside the store — re-render with its current values.
    await w.setProps({
      products: store.products,
      status: store.productsStatus,
      error: store.productsError,
    });
    expect(w.find('[data-state="ready"]').exists()).toBe(true);
    expect(w.findAll('.fp-product').length).toBe(productsMultibrandFixture.products.length);
    // Non-Maurten rows disabled: gating applied on store data, not hardcoded lists.
    expect(w.findAll('.fp-pick:disabled').length).toBe(
      productsMultibrandFixture.products.filter((p) => p.brandId !== 'maurten').length,
    );
  });

  it('a failing load flows through to the catalog error state', async () => {
    const client = {
      fetchProducts: vi.fn().mockRejectedValue(new TypeError('fetch failed')),
      submitPlan: vi.fn(),
    } as unknown as NutritionClient;
    const store = createNutritionStore(client);
    const w = mount(ProductCatalog, {
      props: {
        products: store.products,
        status: store.productsStatus,
        error: store.productsError,
      },
    });
    await store.loadProducts();
    await w.setProps({
      products: store.products,
      status: store.productsStatus,
      error: store.productsError,
    });
    expect(w.find('[data-state="error"]').exists()).toBe(true);
    expect(w.text()).toContain("Couldn't reach the plan service");
  });
});
