/**
 * Fuel Planner — API client unit tests (data-layer task t_e9815e44).
 *
 * Covers the client's contract surface against the golden fixtures
 * (test/fixtures/nutrition, generated from the real handler): request
 * shaping, response typing, error normalization, and — critically — the
 * estimated-total-price rule from the requirements spec:
 *
 *   totals.price === Σ (unitPrice × quantity) over the line items,
 *   rounded to cents (the backend-provided total IS the contract).
 *
 * The five spec §8 sample scenarios (S1–S5) are asserted against both the
 * spec's exact expected values and the sum-of-subtotals invariant.
 */

import { describe, expect, it, vi } from 'vitest';
import { createNutritionClient, NutritionApiError } from '../src/api/client';
import type { PlanInput } from '../src/lib/nutrition';
import {
  errorFixtures,
  plans,
  productsFixture,
  productsMultibrandFixture,
} from './fixtures/nutrition';

/** Same rounding the engine applies to totals (round to cents). */
const round2 = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;

/** Spec §8 expected totals (docs/nutrition-plan-api.md §5). */
const EXPECTED_TOTALS: Record<string, number> = {
  s1: 3.75,
  s2: 11.66,
  s3: 21.71,
  s4: 11.97,
  s5: 0.0,
};

/** Typed view of a plan fixture (fixtures pair request + response). */
type PlanFixtureView = { request: PlanInput; response: Record<string, any> };
const planOf = (key: string): PlanFixtureView => plans[key] as unknown as PlanFixtureView;

/** Typed view of an error fixture's response envelope. */
type ErrorFixtureView = { response: { error: { code: string; message: string; fields?: { field: string; code: string; detail?: string }[] } } };
const errorOf = (key: string) => (errorFixtures[key] as unknown as ErrorFixtureView).response;

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function clientWith(fetchImpl: typeof fetch) {
  return createNutritionClient({ fetchImpl });
}

describe('fetchProducts', () => {
  it('GETs the products endpoint and returns the typed catalog', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, productsFixture));
    const res = await clientWith(fetchMock as unknown as typeof fetch).fetchProducts();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/nutrition/products');
    expect(init.method).toBe('GET');
    expect(res.products).toHaveLength(8);
    expect(res.meta.brands[0]).toMatchObject({
      id: 'maurten',
      name: 'Maurten',
      currency: 'USD',
      carbPerHourByIntensity: { easy: 40, moderate: 60, hard: 75, race: 90 },
    });
  });

  it('appends ?brand= when a brand filter is requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, productsFixture));
    await clientWith(fetchMock as unknown as typeof fetch).fetchProducts({ brand: 'maurten' });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/nutrition/products?brand=maurten');
  });

  it('joins a base origin for the standalone staging service', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, productsFixture));
    const client = createNutritionClient({ base: 'http://staging.example/', fetchImpl: fetchMock as unknown as typeof fetch });
    await client.fetchProducts();
    expect(fetchMock.mock.calls[0][0]).toBe('http://staging.example/api/nutrition/products');
  });

  it('normalizes a 400 UNKNOWN_BRAND into NutritionApiError with fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(400, errorOf('unknown brand')));
    const p = clientWith(fetchMock as unknown as typeof fetch).fetchProducts({ brand: 'siS' });
    await expect(p).rejects.toBeInstanceOf(NutritionApiError);
    await expect(p).rejects.toMatchObject({
      status: 400,
      code: 'UNKNOWN_BRAND',
      fields: [{ field: 'brand', code: 'UNKNOWN_BRAND' }],
    });
  });

  it('normalizes transport failures into code NETWORK with status 0', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const p = clientWith(fetchMock as unknown as typeof fetch).fetchProducts();
    await expect(p).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });

  it('collapses a malformed success body into INTERNAL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('not json', { status: 200 }));
    const p = clientWith(fetchMock as unknown as typeof fetch).fetchProducts();
    await expect(p).rejects.toMatchObject({ status: 200, code: 'INTERNAL' });
  });

  it('rethrows abort errors unchanged', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    const p = clientWith(fetchMock as unknown as typeof fetch).fetchProducts({ signal: new AbortController().signal });
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('submitPlan', () => {
  it('POSTs the JSON payload to the plan endpoint and returns the plan', async () => {
    const fixture = planOf('s3');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, fixture.response));
    const plan = await clientWith(fetchMock as unknown as typeof fetch).submitPlan(fixture.request);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/nutrition/plan');
    expect(init.method).toBe('POST');
    expect(init.headers['content-type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual(fixture.request);
    expect(plan.totals.price).toBe(21.71);
    expect(plan.meta.brand).toBe('maurten');
  });

  it('normalizes a 400 VALIDATION into NutritionApiError carrying all field errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(400, errorOf('missing duration + bad intensity')));
    const p = clientWith(fetchMock as unknown as typeof fetch).submitPlan({ intensity: 'sprint' } as unknown as PlanInput);
    await expect(p).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION',
      fields: expect.arrayContaining([
        expect.objectContaining({ field: 'durationMinutes', code: 'REQUIRED' }),
        expect.objectContaining({ field: 'intensity', code: 'INVALID_ENUM' }),
      ]),
    });
  });

  it('surfaces the documented 413 PAYLOAD_TOO_LARGE guard', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(413, errorOf('payload too large → 413')));
    const p = clientWith(fetchMock as unknown as typeof fetch).submitPlan({ durationMinutes: 60, intensity: 'easy' });
    await expect(p).rejects.toMatchObject({ status: 413, code: 'PAYLOAD_TOO_LARGE' });
  });
});

describe('sample scenario totals (spec §8 / fixtures S1–S5)', () => {
  for (const key of Object.keys(plans)) {
    it(`S${key.slice(1)} (${key}) — totals.price matches the spec value and Σ subtotals`, async () => {
      const fixture = planOf(key);
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, fixture.response));
      const plan = await clientWith(fetchMock as unknown as typeof fetch).submitPlan(fixture.request);

      // Spec §8 expected value for this scenario.
      expect(plan.totals.price).toBe(EXPECTED_TOTALS[key]);

      // Contract rule: totals.price = Σ (unitPrice × quantity), rounded to cents.
      const items: { quantity: number; unitPrice: number; subtotal: number }[] = fixture.response.items;
      const subtotalSum = round2(items.reduce((s, it) => s + it.quantity * it.unitPrice, 0));
      expect(subtotalSum).toBe(plan.totals.price);

      // Cross-consistency: every line's subtotal is its own qty × unit price.
      for (const it of items) {
        expect(round2(it.quantity * it.unitPrice)).toBe(it.subtotal);
      }

      // units = Σ quantities, itemCount = distinct products.
      expect(plan.totals.units).toBe(items.reduce((s, it) => s + it.quantity, 0));
      expect(plan.totals.itemCount).toBe(items.length);
    });
  }

  it('S3 preload is priced separately from totals.price (contract §3.4)', async () => {
    const fixture = planOf('s3');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, fixture.response));
    const plan = await clientWith(fetchMock as unknown as typeof fetch).submitPlan(fixture.request);
    expect(plan.preRacePreload).not.toBeNull();
    // Preload price = the product's unit price (3.64), and is NOT inside totals.
    expect(plan.preRacePreload!.price).toBe(3.64);
    expect(plan.totals.price).toBe(21.71);
  });

  it('S5 no-fuel plan totals to $0.00 with zero items', async () => {
    const fixture = planOf('s5');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, fixture.response));
    const plan = await clientWith(fetchMock as unknown as typeof fetch).submitPlan(fixture.request);
    expect(plan.items).toHaveLength(0);
    expect(plan.totals).toEqual({ carbsDeliveredG: 0, targetG: 0, itemCount: 0, units: 0, price: 0 });
  });
});

describe('multi-brand catalog surface', () => {
  it('the full product list crosses the wire untouched (gating is UI-only)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, productsMultibrandFixture));
    const res = await clientWith(fetchMock as unknown as typeof fetch).fetchProducts();
    expect(res.products).toHaveLength(8 + 4); // maurten + synthetic acme
    expect(res.products.some((p) => p.brandId === 'acme')).toBe(true);
    expect(res.meta.brands.map((b) => b.id)).toEqual(['maurten', 'acme']);
    expect(res.meta.brands[1].carbPerHourByIntensity.race).toBe(100);
  });
});
