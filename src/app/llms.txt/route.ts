import { buildLlmsTxt } from "../../registry/llms";

// Prerendered at build time from the registry.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
