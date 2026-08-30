// @vitest-environment happy-dom
/**
 * Fuel Planner — NutritionPlanner card integration test (UI task t_965bfae3).
 *
 * Proves the card consumes the data store and renders the brand-gated
 * product catalog inside the workbench card (the acceptance surface a user
 * actually sees): with the multibrand fixture loaded through a mocked store,
 * only Maurten rows are enabled and non-Maurten rows are disabled.
 *
 * The store module is mocked so no network happens and the test controls
 * the catalog state directly.
 */
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { productsMultibrandFixture } from './fixtures/nutrition';

const maurtenCount = productsMultibrandFixture.products.filter(
  (p) => p.brandId === 'maurten',
).length;
const acmeCount = productsMultibrandFixture.products.length - maurtenCount;

/** Fake store shaped exactly like the real nutrition-store singleton. */
function fakeStore(overrides: Record<string, unknown> = {}) {
  return {
    products: productsMultibrandFixture.products,
    brands: productsMultibrandFixture.meta.brands,
    productsStatus: 'ready',
    productsError: null,
    loadProducts: vi.fn().mockResolvedValue(undefined),
    getProduct: (id: string) =>
      productsMultibrandFixture.products.find((p) => p.id === id) ?? undefined,
    productsFor: (brandId: string) =>
      productsMultibrandFixture.products.filter((p) => p.brandId === brandId),
    carbRateFor: () => 90,
    plan: null,
    submitting: false,
    submitError: null,
    submitPlan: vi.fn(),
    resetPlan: vi.fn(),
    ...overrides,
  };
}

vi.mock('../src/lib/nutrition-store', () => ({
  nutritionStore: fakeStore(),
}));

import NutritionPlanner from '../src/components/tools/NutritionPlanner.vue';

async function mountCard() {
  const w = mount(NutritionPlanner, { attachTo: document.body });
  await nextTick();
  return w;
}

describe('NutritionPlanner card renders the brand-gated catalog', () => {
  it('shows the AVAILABLE PRODUCTS section with all fixture rows', async () => {
    const w = await mountCard();
    expect(w.text()).toContain('AVAILABLE PRODUCTS');
    const rows = w.findAll('.fp-product');
    expect(rows.length).toBe(productsMultibrandFixture.products.length);
  });

  it('only Maurten products are enabled inside the card', async () => {
    const w = await mountCard();
    expect(w.findAll('.fp-pick:not(:disabled)').length).toBe(maurtenCount);
    expect(w.findAll('.fp-pick:disabled').length).toBe(acmeCount);
  });

  it('non-Maurten rows carry the coming-soon tag; Maurten rows do not', async () => {
    const w = await mountCard();
    expect(w.findAll('.fp-p-tag').length).toBe(acmeCount);
  });
});
