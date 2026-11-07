import { buildChecksJson } from "../../registry/checks";

// Prerendered at build time from the calculator schemas.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildChecksJson(), { headers: { "Access-Control-Allow-Origin": "*" } });
}
