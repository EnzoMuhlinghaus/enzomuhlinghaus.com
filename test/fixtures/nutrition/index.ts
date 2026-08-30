/**
 * Fuel Planner — golden API fixtures (contract task t_12a4f60d).
 *
 * Generated from the REAL handler by upstream/scripts/generate-fixtures.mjs
 * (nutrition-plan-service). Never edit by hand — regenerate and commit the
 * diff. `generatedAt` is normalized to a fixed sentinel so fixtures are
 * deterministic.
 *
 * Consumers: data-layer + UI tasks import these as mocks/props in vitest and
 * component tests; the UI brand-gating task uses products-multibrand.json
 * (Maurten + synthetic `acme`) to prove non-Maurten brands render disabled.
 */
import products from './products.json';
import productsBrandMaurten from './products-brand-maurten.json';
import productsMultibrand from './products-multibrand.json';
import planS1 from './plan-s1.json';
import planS2 from './plan-s2.json';
import planS3 from './plan-s3.json';
import planS4 from './plan-s4.json';
import planS5 from './plan-s5.json';
import errors from './errors.json';

import type { ErrorResponse, ProductsResponse } from '../../../src/api/contract';

export interface PlanFixture {
  request: Record<string, unknown>;
  response: unknown; // PlanResponse — typed at the consumer for clarity
}

export const productsFixture = products as ProductsResponse;
export const productsBrandMaurtenFixture = productsBrandMaurten as ProductsResponse;
export const productsMultibrandFixture = productsMultibrand as ProductsResponse;

export const plans: Record<string, PlanFixture> = {
  s1: planS1 as PlanFixture,
  s2: planS2 as PlanFixture,
  s3: planS3 as PlanFixture,
  s4: planS4 as PlanFixture,
  s5: planS5 as PlanFixture,
};

export const errorFixtures = errors as Record<string, { request?: unknown; response: ErrorResponse }>;
