/**
 * Fuel Planner — Worker route POST /api/nutrition/plan.
 *
 * On-demand endpoint (prerender = false) reusing the framework-agnostic
 * handleRequest() from src/api/handler.ts. Serves the same JSON contract as
 * the standalone nutrition-plan-service: 200 plan, 400 VALIDATION /
 * UNKNOWN_BRAND, 405, 413, 500 (spec §5.4).
 */
import type { APIRoute } from 'astro';
import { handleRequest } from '../../../api/handler';
import type { HttpResponse } from '../../../api/handler';

export const prerender = false;

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
/** Keep parity with the standalone server's payload cap (spec §5.4). */
const MAX_BODY_BYTES = 64 * 1024;

function respond(res: HttpResponse): Response {
  return new Response(res.body, { status: res.status, headers: res.headers });
}

export const POST: APIRoute = async ({ request }) => {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return new Response(
      JSON.stringify({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 64 KB' },
      }),
      { status: 413, headers: JSON_HEADERS },
    );
  }
  return respond(
    handleRequest({ method: 'POST', url: request.url, body: text.length ? text : null }),
  );
};

/** GET on the route → the spec's 405 contract (Astro would otherwise answer its own HTML). */
export const GET: APIRoute = ({ request }) =>
  respond(handleRequest({ method: 'GET', url: request.url, body: null }));
