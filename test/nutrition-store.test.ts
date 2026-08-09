/**
 * Fuel Planner — data store unit tests (data-layer task t_e9815e44).
 *
 * Verifies the reactive state layer the UI consumes: catalog loading states,
 * normalized errors, the current plan + submit lifecycle, and the guarantee
 * that the FULL product list (all brands) is exposed — brand gating is the
 * UI task's job, never the store's.
 */

import { describe, expect, it, vi } from 'vitest';
import type { NutritionClient } from '../src/api/client';
import { NutritionApiError } from '../src/api/client';
import { createNutritionStore } from '../src/lib/nutrition-store';
import {
  productsFixture,
  productsMultibrandFixture,
} from './fixtures/nutrition';

/**
 * A fake NutritionClient whose methods resolve with PARSED payloads — the
 * store consumes the client layer, where fetchProducts already returns a
 * ProductsResponse and submitPlan a Plan (Response objects never reach it).
 */
function mockClient(): NutritionClient {
  return {
    fetchProducts: vi.fn(),
    submitPlan: vi.fn(),
  } as unknown as NutritionClient;
}

describe('createNutritionStore — catalog', () => {
  it('starts idle with an empty catalog and no plan', () => {
    const store = createNutritionStore(mockClient());
    expect(store.productsStatus).toBe('idle');
    expect(store.products).toEqual([]);
    expect(store.brands).toEqual([]);
    expect(store.productsError).toBeNull();
    expect(store.plan).toBeNull();
    expect(store.submitting).toBe(false);
    expect(store.submitError).toBeNull();
  });

  it('loadProducts → ready with the live catalog + brand summary', async () => {
    const client = mockClient();
    client.fetchProducts = vi.fn().mockResolvedValue(productsFixture);
    const store = createNutritionStore(client);
    await store.loadProducts();
    expect(store.productsStatus).toBe('ready');
    expect(store.products).toHaveLength(8);
    expect(store.brands[0]).toMatchObject({
      id: 'maurten',
      carbPerHourByIntensity: { easy: 40, moderate: 60, hard: 75, race: 90 },
    });
    expect(store.productsError).toBeNull();
  });

  it('loadProducts failure → status error + normalized NutritionApiError', async () => {
    const client = mockClient();
    client.fetchProducts = vi
      .fn()
      .mockRejectedValue(new NutritionApiError(500, { code: 'INTERNAL', message: 'Internal server error' }));
    const store = createNutritionStore(client);
    await store.loadProducts();
    expect(store.productsStatus).toBe('error');
    expect(store.productsError).toMatchObject({ status: 500, code: 'INTERNAL' });
    expect(store.products).toEqual([]);
  });

  it('loadProducts failure with a raw transport error → NETWORK', async () => {
    const client = mockClient();
    client.fetchProducts = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const store = createNutritionStore(client);
    await store.loadProducts();
    expect(store.productsStatus).toBe('error');
    expect(store.productsError).toMatchObject({ status: 0, code: 'NETWORK' });
  });

  it('concurrent loadProducts calls share one request', async () => {
    const client = mockClient();
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    client.fetchProducts = vi.fn().mockImplementation(() => gate.then(() => productsFixture));
    const store = createNutritionStore(client);
    const a = store.loadProducts();
    const b = store.loadProducts();
    expect(client.fetchProducts).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([a, b]);
    expect(store.productsStatus).toBe('ready');
  });

  it('exposes the FULL product list across brands (no gating here)', async () => {
    const client = mockClient();
    client.fetchProducts = vi.fn().mockResolvedValue(productsMultibrandFixture);
    const store = createNutritionStore(client);
    await store.loadProducts();
    // Maurten + synthetic acme both present — the store never filters.
    expect(store.productsFor('maurten')).toHaveLength(8);
    expect(store.productsFor('acme')).toHaveLength(4);
    expect(store.products).toHaveLength(12);
    expect(store.brands.map((b) => b.id)).toEqual(['maurten', 'acme']);
  });

  it('getProduct finds a product by id', async () => {
    const client = mockClient();
    client.fetchProducts = vi.fn().mockResolvedValue(productsFixture);
    const store = createNutritionStore(client);
    await store.loadProducts();
    expect(store.getProduct('maurten-gel-160')?.unitPrice).toBe(4.58);
    expect(store.getProduct('nope')).toBeUndefined();
  });

  it('carbRateFor reads the live brand rules; undefined before load / unknown brand', () => {
    const store = createNutritionStore(mockClient());
    expect(store.carbRateFor('race')).toBeUndefined(); // catalog not loaded
  });

  it('carbRateFor returns per-brand rates once loaded (incl. brand arg)', async () => {
    const client = mockClient();
    client.fetchProducts = vi.fn().mockResolvedValue(productsMultibrandFixture);
    const store = createNutritionStore(client);
    await store.loadProducts();
    expect(store.carbRateFor('race')).toBe(90); // default brand (maurten)
    expect(store.carbRateFor('race', 'acme')).toBe(100);
    expect(store.carbRateFor('easy', 'maurten')).toBe(40);
    expect(store.carbRateFor('race', 'siS')).toBeUndefined();
  });
});

describe('createNutritionStore — plan lifecycle', () => {
  it('submitPlan stores the plan and reports submitting while in flight', async () => {
    const client = mockClient();
    let release!: (v: unknown) => void;
    const gate = new Promise((r) => { release = r; });
    client.submitPlan = vi.fn().mockImplementation(() => gate);
    const store = createNutritionStore(client);

    const pending = store.submitPlan({ durationMinutes: 190, intensity: 'race' });
    expect(store.submitting).toBe(true);
    expect(store.plan).toBeNull();

    const plan = { meta: { brand: 'maurten' }, totals: { price: 21.71 } };
    release(plan);
    await expect(pending).resolves.toBe(plan);
    expect(store.submitting).toBe(false);
    // store.plan is the reactive proxy of the same object — compare content.
    expect(store.plan).toEqual(plan);
    expect(store.submitError).toBeNull();
  });

  it('submitPlan failure → returns null, sets submitError, keeps the previous plan', async () => {
    const client = mockClient();
    const prev = { meta: { brand: 'maurten' }, totals: { price: 3.75 } };
    client.submitPlan = vi
      .fn()
      .mockResolvedValueOnce(prev)
      .mockRejectedValueOnce(
        new NutritionApiError(400, {
          code: 'VALIDATION',
          message: '1 field(s) failed validation',
          fields: [{ field: 'durationMinutes', code: 'OUT_OF_RANGE' }],
        }),
      );
    const store = createNutritionStore(client);

    await store.submitPlan({ durationMinutes: 60, intensity: 'easy' });
    expect(store.plan).toEqual(prev);

    const result = await store.submitPlan({ durationMinutes: 3, intensity: 'easy' });
    expect(result).toBeNull();
    expect(store.submitError).toMatchObject({ status: 400, code: 'VALIDATION' });
    expect(store.submitError?.fields).toEqual([{ field: 'durationMinutes', code: 'OUT_OF_RANGE' }]);
    expect(store.plan).toEqual(prev); // previous valid plan untouched
  });

  it('submitPlan network failure → NETWORK error', async () => {
    const client = mockClient();
    client.submitPlan = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const store = createNutritionStore(client);
    const result = await store.submitPlan({ durationMinutes: 60, intensity: 'easy' });
    expect(result).toBeNull();
    expect(store.submitError).toMatchObject({ status: 0, code: 'NETWORK' });
  });

  it('submitPlan ignores re-entrant calls while one is in flight', async () => {
    const client = mockClient();
    let release!: (v: unknown) => void;
    const gate = new Promise((r) => { release = r; });
    client.submitPlan = vi.fn().mockImplementation(() => gate);
    const store = createNutritionStore(client);

    const first = store.submitPlan({ durationMinutes: 60, intensity: 'easy' });
    const second = store.submitPlan({ durationMinutes: 120, intensity: 'hard' });
    expect(client.submitPlan).toHaveBeenCalledTimes(1);
    await expect(second).resolves.toBeNull();
    release({ totals: { price: 1 } });
    await first;
    expect(store.plan).toEqual({ totals: { price: 1 } });
  });

  it('resetPlan drops the plan and submit error', async () => {
    const client = mockClient();
    client.submitPlan = vi.fn().mockResolvedValue({ totals: { price: 21.71 } });
    const store = createNutritionStore(client);
    await store.submitPlan({ durationMinutes: 190, intensity: 'race' });
    expect(store.plan).not.toBeNull();
    store.resetPlan();
    expect(store.plan).toBeNull();
    expect(store.submitError).toBeNull();
  });
});
