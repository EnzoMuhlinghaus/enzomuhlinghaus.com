/**
 * Fuel Planner — Worker route GET /api/nutrition/products.
 *
 * On-demand endpoint (prerender = false) reusing the framework-agnostic
 * handleRequest() from src/api/handler.ts. Serves the same JSON contract as
 * the standalone nutrition-plan-service: 200 catalog
 * ({ meta.brands[], products[] }), 400 UNKNOWN_BRAND for a bad ?brand=,
 * 405, 404 (contract task t_12a4f60d).
 */
import type { APIRoute } from 'astro';
import { handleRequest } from '../../../api/handler';
import type { HttpResponse } from '../../../api/handler';

export const prerender = false;

function respond(res: HttpResponse): Response {
  return new Response(res.body, { status: res.status, headers: res.headers });
}

export const GET: APIRoute = ({ request }) =>
  respond(handleRequest({ method: 'GET', url: request.url, body: null }));

/** Non-GET on the route → the contract's 405 JSON error. */
export const POST: APIRoute = ({ request }) =>
  respond(handleRequest({ method: 'POST', url: request.url, body: null }));
