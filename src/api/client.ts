/**
 * Fuel Planner — typed API client (data-layer task t_e9815e44).
 *
 * The frontend's only path to the plan service. Wraps the two business
 * endpoints from the contract (docs/nutrition-plan-api.md):
 *
 *   GET  /api/nutrition/products → ProductsResponse
 *   POST /api/nutrition/plan     → PlanResponse
 *
 * Every failure is normalized into NutritionApiError so callers get one
 * shape: HTTP status + contract error code + field errors, or code
 * NETWORK with status 0 for transport failures. Aborts are rethrown
 * unchanged (callers own the AbortSignal). A malformed success body or an
 * unparseable error body collapses to code INTERNAL — the contract says
 * every response is the documented envelope, so anything else is a server
 * bug, not a caller concern.
 *
 * Same-origin by default (the Astro/Cloudflare Worker serves /api/nutrition/*
 * on the site's own origin); a `base` option points at the standalone
 * staging service, and `fetchImpl` lets tests inject a mock transport.
 */

import type { PlanInput } from '../lib/nutrition';
import type { PlanResponse, ProductsResponse } from './contract';

/** One field error inside an API error envelope (spec §5.4 codes). */
export interface FieldError {
  field: string;
  code: string;
  detail?: string;
}

/** The `error` object of a 4xx/5xx response (contract §4). */
export interface ApiErrorEnvelope {
  code: string;
  message: string;
  fields?: FieldError[];
}

/** Normalized client failure. `status` is the HTTP status, 0 for network. */
export class NutritionApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: FieldError[];

  constructor(status: number, envelope: ApiErrorEnvelope) {
    super(envelope.message);
    this.name = 'NutritionApiError';
    this.status = status;
    this.code = envelope.code;
    this.fields = envelope.fields ?? [];
  }
}

export interface NutritionClientOptions {
  /** Origin prefix for API calls; '' = same origin as the page. */
  base?: string;
  /** Transport override (tests / SSR). Defaults to globalThis.fetch. */
  fetchImpl?: typeof fetch;
}

const ENDPOINT_PRODUCTS = '/api/nutrition/products';
const ENDPOINT_PLAN = '/api/nutrition/plan';

const joinBase = (base: string, path: string): string =>
  `${base.replace(/\/+$/, '')}${path}`;

function isAbort(e: unknown): boolean {
  const name = (e as { name?: string } | null)?.name;
  return name === 'AbortError';
}

async function parseErrorBody(status: number, res: Response): Promise<NutritionApiError> {
  try {
    const body = (await res.json()) as { error?: ApiErrorEnvelope } | null;
    const env = body?.error;
    if (env && typeof env.code === 'string') {
      return new NutritionApiError(status, env);
    }
  } catch {
    // fall through to the generic envelope
  }
  return new NutritionApiError(status, {
    code: 'INTERNAL',
    message: `Unexpected ${status} response from the plan service`,
  });
}

async function parseSuccess<T>(status: number, res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new NutritionApiError(status, {
      code: 'INTERNAL',
      message: 'Malformed response from the plan service',
    });
  }
}

export interface FetchProductsOptions {
  /** Brand id filter (?brand=); omitted = all active brands. */
  brand?: string;
  signal?: AbortSignal;
}

export interface SubmitPlanOptions {
  signal?: AbortSignal;
}

export interface NutritionClient {
  fetchProducts(opts?: FetchProductsOptions): Promise<ProductsResponse>;
  submitPlan(input: PlanInput, opts?: SubmitPlanOptions): Promise<PlanResponse>;
}

export function createNutritionClient(opts: NutritionClientOptions = {}): NutritionClient {
  const base = opts.base ?? '';
  const doFetch = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);

  async function fetchProducts(options: FetchProductsOptions = {}): Promise<ProductsResponse> {
    const url =
      options.brand !== undefined
        ? `${joinBase(base, ENDPOINT_PRODUCTS)}?brand=${encodeURIComponent(options.brand)}`
        : joinBase(base, ENDPOINT_PRODUCTS);
    let res: Response;
    try {
      res = await doFetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: options.signal,
      });
    } catch (e) {
      if (isAbort(e)) throw e;
      throw new NutritionApiError(0, {
        code: 'NETWORK',
        message: "Couldn't reach the plan service — check your connection and try again.",
      });
    }
    if (!res.ok) throw await parseErrorBody(res.status, res);
    return parseSuccess<ProductsResponse>(res.status, res);
  }

  async function submitPlan(input: PlanInput, options: SubmitPlanOptions = {}): Promise<PlanResponse> {
    let res: Response;
    try {
      res = await doFetch(joinBase(base, ENDPOINT_PLAN), {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(input),
        signal: options.signal,
      });
    } catch (e) {
      if (isAbort(e)) throw e;
      throw new NutritionApiError(0, {
        code: 'NETWORK',
        message: "Couldn't reach the plan service — check your connection and try again.",
      });
    }
    if (!res.ok) throw await parseErrorBody(res.status, res);
    return parseSuccess<PlanResponse>(res.status, res);
  }

  return { fetchProducts, submitPlan };
}

/** Default same-origin client — the site's own Worker serves the API. */
export const nutritionClient: NutritionClient = createNutritionClient();
