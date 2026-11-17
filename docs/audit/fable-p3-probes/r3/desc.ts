import { buildChecksJson } from "../../../../src/registry/checks";
import { buildLlmsTxt } from "../../../../src/registry/llms";
import { calculators } from "../../../../src/registry";
import { findSchema } from "../../../../src/schemas";
import { parseInputs } from "../../../../src/schemas/run";
const tiers = new Set(calculators.map((c) => String(c.tier))); console.log("tiers", [...tiers].join(","));
const cj: any = buildChecksJson(); let bad = 0, hosts = new Set<string>();
for (const c of cj.calculators) for (const k of c.checks) {
  const u = new URL(k.apiUrl); hosts.add(u.origin);
  const s = findSchema(u.pathname.replace("/api/v1", ""));
  const p = s ? parseInputs(s, u.searchParams) : { ok: false, error: "no schema" };
  if (!p.ok) { bad++; if (bad < 4) console.log("apiUrl rejected", k.apiUrl.slice(0, 160), (p as any).error); }
}
console.log("checks apiUrl rejected", bad, "hosts", [...hosts].join(","));
console.log("check sample", JSON.stringify(cj.calculators[5].checks[0].outputs).slice(0, 300));
const l = buildLlmsTxt().split("\n");
console.log(l.slice(0, 32).filter((x) => /\d{2,}|API|MCP|categor|runnable|detectors/i.test(x)).map((x) => x.slice(0, 260)).join("\n"));
console.log("headers:", l.filter((x) => x.startsWith("## ")).join(" | "));
