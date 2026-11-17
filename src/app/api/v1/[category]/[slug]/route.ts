import type { NextRequest } from "next/server";

import { clientIp, RATE_LIMIT_EXPOSED, RateLimiter, rateLimitHeaders, type RateLimitStatus } from "../../../../../lib/report";
import { apiCalculator, apiResponse } from "../../../../../registry/api";
import { parseInputs, runSchema } from "../../../../../schemas/run";

// Sixty runs per IP per minute, per server instance; the CDN answers repeated queries without reaching it.
const WINDOW_SECONDS = 60;
const limiter = new RateLimiter(60, WINDOW_SECONDS * 1000);

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": RATE_LIMIT_EXPOSED };

function json(body: unknown, status: number, cacheControl: string, limit: RateLimitStatus) {
  const cacheable = !/no-store/.test(cacheControl);
  return Response.json(body, {
    status,
    headers: { ...CORS, ...rateLimitHeaders(limit, WINDOW_SECONDS, cacheable), "Cache-Control": cacheControl },
  });
}

/**
 * Runs a calculator: the query takes the page's URL keys in the page's units (see `/openapi.json`). The result
 * depends only on the query and the deployment, so the CDN may cache it; a new deployment starts a new cache.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ category: string; slug: string }> }) {
  const limit = limiter.check(clientIp(request));
  if (!limit.allowed) {
    return json({ error: "Too many requests from this address; please try again in a minute." }, 429, "no-store", limit);
  }
  const { category, slug } = await ctx.params;
  const found = apiCalculator(`/${category}/${slug}`);
  if (!found) {
    return json({ error: `No API for /${category}/${slug}. The calculators it can run are listed in /openapi.json.` },
      404, "public, s-maxage=3600", limit);
  }
  const parsed = parseInputs(found.schema, request.nextUrl.searchParams);
  if (!parsed.ok) return json({ error: parsed.error }, 400, "public, s-maxage=86400", limit);
  return json(apiResponse(found.calculator, found.schema, runSchema(found.schema, parsed.values)), 200,
    "public, max-age=3600, s-maxage=86400", limit);
}
