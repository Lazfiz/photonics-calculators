import type { NextRequest } from "next/server";

import { SITE_URL } from "../../../lib/site";

// /api, /api/v1 and any other /api path without a handler: a JSON 404 that points to the API's index, not the HTML
// "Calculator Not Found" page (upgrades review 2026-11, quick win 2).
function notFound(request: NextRequest) {
  return Response.json(
    {
      error: `No API at ${request.nextUrl.pathname}. Run a calculator with GET /api/v1/<category>/<slug> and its page's ` +
        "URL query; the calculators, their inputs and outputs are listed in /openapi.json.",
      openapi: `${SITE_URL}/openapi.json`,
      example: `${SITE_URL}/api/v1/wave-optics/gaussian-beam?wavelength=1064&waist=500&z=100`,
    },
    { status: 404, headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=3600" } },
  );
}

export const GET = notFound;
export const POST = notFound;
