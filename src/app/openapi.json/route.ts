import { buildOpenApi } from "../../registry/api";

// Prerendered at build time from the registry and the calculator schemas.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildOpenApi(), { headers: { "Access-Control-Allow-Origin": "*" } });
}
