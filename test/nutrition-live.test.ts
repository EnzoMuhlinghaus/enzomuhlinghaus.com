/**
 * Fuel Planner — LIVE staging integration tests (data-layer task t_e9815e44).
 *
 * Proves the data layer really talks to the staging backend: every spec §8
 * sample scenario (S1–S5) is submitted through the real client against a
 * running service and the estimated totals are checked against both the
 * spec's expected values and the Σ(unitPrice × quantity) invariant.
 *
 * Opt-in: run with LIVE_BASE pointing at a live service, e.g.
 *
 *   LIVE_BASE=http://100.126.159.73:4399 npx vitest run test/nutrition-live.test.ts
 *
 * Skipped entirely when LIVE_BASE is unset (default CI/unit run).
 */

import { describe, expect, it } from 'vitest';
import { createNutritionClient } from '../src/api/client';
import { plans } from './fixtures/nutrition';

const LIVE_BASE = process.env.LIVE_BASE;

const round2 = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;

const EXPECTED_TOTALS: Record<string, number> = {
  s1: 3.75,
  s2: 11.66,
  s3: 21.71,
  s4: 11.97,
  s5: 0.0,
};

describe.skipIf(!LIVE_BASE)('live staging backend (LIVE_BASE set)', () => {
  const client = createNutritionClient({ base: LIVE_BASE });

  it('GET /api/nutrition/products → live catalog with brand carb rates', async () => {
    const res = await client.fetchProducts();
    expect(res.products.length).toBeGreaterThan(0);
    expect(res.products.every((p) => p.active === true)).toBe(true);
    const maurten = res.meta.brands.find((b) => b.id === 'maurten');
    expect(maurten?.carbPerHourByIntensity?.race).toBe(90);
  });

  for (const key of Object.keys(plans)) {
    it(`POST /api/nutrition/plan — S${key.slice(1)} totals vs the spec (${EXPECTED_TOTALS[key]})`, async () => {
      const fixture = plans[key] as unknown as {
        request: Record<string, unknown>;
        response: {
          items: { quantity: number; unitPrice: number }[];
          totals: { price: number; units: number; itemCount: number };
          meta: { brand: string };
        };
      };
      const plan = await client.submitPlan(fixture.request as never);
      expect(plan.totals.price).toBe(EXPECTED_TOTALS[key]);
      const subtotalSum = round2(
        plan.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
      );
      expect(subtotalSum).toBe(plan.totals.price);
      expect(plan.totals.units).toBe(plan.items.reduce((s, it) => s + it.quantity, 0));
      expect(plan.totals.itemCount).toBe(plan.items.length);
    });
  }

  it('POST /api/nutrition/plan — error envelope round-trips through the client', async () => {
    await expect(
      client.submitPlan({ durationMinutes: 3, intensity: 'easy' } as never),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION' });
  });
});
