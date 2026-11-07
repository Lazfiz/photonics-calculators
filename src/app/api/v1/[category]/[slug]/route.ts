import type { NextRequest } from "next/server";

import { clientIp, RateLimiter } from "../../../../../lib/report";
import { apiCalculator, apiResponse } from "../../../../../registry/api";
import { parseInputs, runSchema } from "../../../../../schemas/run";

// Sixty runs per IP per minute, per server instance; the CDN answers repeated queries without reaching it.
const limiter = new RateLimiter(60, 60 * 1000);

const CORS = { "Access-Control-Allow-Origin": "*" };

function json(body: unknown, status: number, cacheControl: string) {
  return Response.json(body, { status, headers: { ...CORS, "Cache-Control": cacheControl } });
}

/**
 * Runs a calculator: the query takes the page's URL keys in the page's units (see `/openapi.json`). The result
 * depends only on the query and the deployment, so the CDN may cache it; a new deployment starts a new cache.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ category: string; slug: string }> }) {
  if (!limiter.allow(clientIp(request))) {
    return json({ error: "Too many requests from this address; please try again in a minute." }, 429, "no-store");
  }
  const { category, slug } = await ctx.params;
  const found = apiCalculator(`/${category}/${slug}`);
  if (!found) {
    return json({ error: `No API for /${category}/${slug}. The calculators it can run are listed in /openapi.json.` },
      404, "public, s-maxage=3600");
  }
  const parsed = parseInputs(found.schema, request.nextUrl.searchParams);
  if (!parsed.ok) return json({ error: parsed.error }, 400, "public, s-maxage=86400");
  return json(apiResponse(found.calculator, found.schema, runSchema(found.schema, parsed.values)), 200,
    "public, max-age=3600, s-maxage=86400");
}
