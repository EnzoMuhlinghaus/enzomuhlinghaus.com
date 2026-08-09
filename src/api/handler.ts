/**
 * Fuel Planner — framework-agnostic HTTP request handler.
 *
 * Implements POST /api/nutrition/plan (spec §5). The handler only depends on
 * method/url/body, so the same code runs under the standalone Node service
 * (nutrition-plan-service) and this repo's Astro/Cloudflare Worker route
 * (src/pages/api/nutrition/plan.ts). Ported from t_f6579854 unchanged except
 * for the import specifiers.
 */

import { calculatePlan } from '../lib/nutrition';
import { validatePlanRequest } from '../lib/validate';
import type { ApiError } from '../lib/validate';

export interface HttpRequest {
  method: string;
  url: string;
  body: string | null;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(status: number, payload: unknown): HttpResponse {
  return { status, headers: JSON_HEADERS, body: JSON.stringify(payload) };
}

function error(status: number, err: ApiError): HttpResponse {
  return json(status, { error: err });
}

function pathname(url: string): string {
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

export function handleRequest(req: HttpRequest): HttpResponse {
  const path = pathname(req.url);

  if (req.method === 'GET' && path === '/health') {
    return json(200, { ok: true, service: 'nutrition-plan' });
  }

  if (path === '/api/nutrition/plan') {
    if (req.method !== 'POST') {
      return error(405, {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed for ${path}; use POST`,
      });
    }
    try {
      const raw: unknown = req.body ? JSON.parse(req.body) : null;
      const result = validatePlanRequest(raw);
      if (!result.ok) {
        return error(400, result.error);
      }
      const plan = calculatePlan(result.value.input, result.value.brand, result.value.products);
      return json(200, plan);
    } catch (e) {
      if (e instanceof SyntaxError) {
        return error(400, {
          code: 'VALIDATION',
          message: 'Request body is not valid JSON',
          fields: [{ field: 'body', code: 'INVALID_JSON', detail: 'expected a JSON object' }],
        });
      }
      return error(500, {
        code: 'INTERNAL',
        message: 'Internal server error',
      });
    }
  }

  return error(404, {
    code: 'NOT_FOUND',
    message: `No route for ${req.method} ${path}`,
  });
}
