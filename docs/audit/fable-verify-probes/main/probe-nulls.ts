// Verification of P3-W1 (null outputs must come with a warning) and P3-M7/M8/M9, on the tree under test.
// Run from the repo root: npx tsx docs/audit/fable-verify-probes/main/probe-nulls.ts
// Sweep: every schema at its defaults, each numeric input at its min and at its max, each choice at each option.
// "silent" = a null output with warnings: []. "unnamed" = a null output where no warning contains the output's key or
// a word (4+ letters) of its label: a rough count, only to size the gap that PR #292 addresses.
import { NextRequest } from "next/server";
import { schemas } from "../../../../src/schemas/index";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
import { GET } from "../../../../src/app/api/v1/[category]/[slug]/route";
import { POST } from "../../../../src/app/mcp/route";

let runs = 0, rejected = 0, nullOutputs = 0, silent = 0, unnamed = 0, allNull = 0;
const silentCases: string[] = [];
for (const s of schemas) {
  const sets: Record<string, string>[] = [{}];
  for (const i of s.inputs) sets.push({ [i.key]: String(i.min) }, { [i.key]: String(i.max) });
  for (const c of s.choices ?? []) for (const o of c.options) sets.push({ [c.key]: o.value });
  for (const q of sets) {
    const p = parseInputs(s, new URLSearchParams(q));
    if (!p.ok) { rejected++; continue; }
    runs++;
    const r = runSchema(s, p.values);
    const nulls = Object.entries(r.outputs).filter(([, v]) => v === null).map(([k]) => k);
    if (nulls.length === Object.keys(r.outputs).length && nulls.length > 0) allNull++;
    for (const k of nulls) {
      nullOutputs++;
      if (r.warnings.length === 0) { silent++; silentCases.push(`${s.href}?${new URLSearchParams(q)} ${k}`); continue; }
      const label = s.outputs.find((o) => o.key === k)!.label.toLowerCase();
      const words = label.split(/[^a-zà-ÿ]+/).filter((w) => w.length >= 4);
      const text = r.warnings.join(" ").toLowerCase();
      if (!text.includes(k.toLowerCase()) && !words.some((w) => text.includes(w))) unnamed++;
    }
  }
}
console.log(`schemas ${schemas.length}, runs ${runs}, rejected with a 400 ${rejected}`);
console.log(`null outputs ${nullOutputs} (runs with every output null: ${allNull}); silent (no warning at all) ${silent}; no warning names the output (rough) ${unnamed}`);
for (const c of silentCases.slice(0, 40)) console.log("  SILENT", c);

async function get(path: string) {
  const [, , , category, slug] = new URL(path, "https://x.test").pathname.split("/");
  const res = await GET(new NextRequest(new URL(path, "https://x.test"), { headers: { "x-forwarded-for": "10.9.9.9" } }), { params: Promise.resolve({ category, slug }) });
  return { status: res.status, body: await res.json() };
}
(async () => {
  // The review's two real failures and a few "infinite" cases, through the REST handler.
  for (const path of [
    "/api/v1/thin-film/anti-fog?waterTemp=-25", "/api/v1/thin-film/solar-protection?uvPairs=40",
    "/api/v1/wave-optics/ring-cavity?outputCouplerR=0.01", "/api/v1/laser-safety/green-laser-pointer?divergence=0",
    "/api/v1/wave-optics/gaussian-beam?waist=0x10", "/api/v1/wave-optics/gaussian-beam?waist=1e1", "/api/v1/wave-optics/nope",
  ]) {
    const { status, body } = await get(path);
    const outs = body.outputs ? Object.entries(body.outputs as Record<string, { value: number | null }>).filter(([, o]) => o.value === null).map(([k]) => k) : [];
    console.log(`${status} ${path} nulls=[${outs}] ${body.error ? "error: " + String(body.error).slice(0, 90) : "warnings: " + JSON.stringify(body.warnings).slice(0, 160)}`);
  }
  // anti-fog reference at -25 C: IAPWS-style extrapolation is not a source; only check that the value continues the
  // trend of the -10 C and -5 C values the review quoted (77.01, 76.34 mN/m: slope -0.135/K gives 79.0 at -25 C).
  const af = await get("/api/v1/thin-film/anti-fog?waterTemp=-25");
  console.log("anti-fog surfaceTension at -25 C:", af.body.outputs.surfaceTension.value, "(linear continuation of the review's -10/-5 C values: 79.0)");
  // P3-M8: an MCP batch of 200 run_calculator calls from one address.
  const batch = Array.from({ length: 200 }, (_, i) => ({ jsonrpc: "2.0", id: i, method: "tools/call", params: { name: "run_calculator", arguments: { calculator: "/wave-optics/gaussian-beam" } } }));
  const res = await POST(new Request("https://x.test/mcp", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.8.8.8" }, body: JSON.stringify(batch) }));
  const text = await res.text();
  console.log(`MCP batch of 200: HTTP ${res.status}, ${text.slice(0, 140)}`);
})();
