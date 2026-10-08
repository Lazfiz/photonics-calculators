import { buildSearchIndex } from "../../registry/search";

// Prerendered at build time from the registry; the site search fetches it on first use.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex());
}
