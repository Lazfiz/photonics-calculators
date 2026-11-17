// PR #292 verify probe. Run on BOTH trees and diff: npx tsx docs/audit/fable-verify-probes/pr292/defaults-dump.ts out.json
// Dumps the REST body (via the route handler, in-process) of every schema at defaults, plus openapi paths/params digest.
import { writeFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { GET } from "../../../../src/app/api/v1/[category]/[slug]/route";
import { buildOpenApi } from "../../../../src/registry/api";
import { schemas } from "../../../../src/schemas";

(async () => {
  const out: Record<string, unknown> = {};
  let i = 0;
  for (const s of schemas) {
    const [, category, slug] = s.href.split("/");
    const req = new NextRequest(`https://photonicscalculators.com/api/v1${s.href}`, { headers: { "x-forwarded-for": `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i++ & 255}` } });
    const res = await GET(req, { params: Promise.resolve({ category, slug }) });
    out[s.href] = { status: res.status, body: await res.json() };
  }
  let openapi: unknown = null;
  try { openapi = (buildOpenApi as (o: string) => unknown)("https://photonicscalculators.com"); } catch (e) { openapi = String(e); }
  writeFileSync(process.argv[2], JSON.stringify({ api: out, openapi }, null, 1));
  console.log("schemas", schemas.length);
})();
