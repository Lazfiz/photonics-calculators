// PR #293 verification probe: dumps the JSON body of GET /api/v1/<category>/<slug> (defaults) for every API calculator,
// calling the route handler in-process. Run on BOTH trees (main checkout and feat/fable-upgrades worktree), from the
// tree root, redirect to a file, then diff:  npx tsx docs/audit/fable-verify-probes/pr293/api-dump.ts > out.json
import { NextRequest } from "next/server";
import { GET } from "../../../../src/app/api/v1/[category]/[slug]/route";
import { calculators } from "../../../../src/registry";
async function main() {
  const out: Record<string, unknown> = {};
  let i = 0;
  for (const c of calculators) {
    const [, category, slug] = c.href.split("/");
    // A fresh address per 50 requests keeps the probe under the 60/min limiter.
    const res = await GET(new NextRequest(`https://x.test/api/v1/${category}/${slug}`, { headers: { "x-forwarded-for": `192.0.2.${Math.floor(i++ / 50)}` } }),
      { params: Promise.resolve({ category, slug }) });
    out[c.href] = { status: res.status, cache: res.headers.get("cache-control"), body: await res.json() };
  }
  console.log(JSON.stringify(out, null, 1));
}
main();
