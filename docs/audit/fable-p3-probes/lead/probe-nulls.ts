// Lead check of R3 WEAK-1: in-range inputs that give null outputs with no warning.
// Run: npx tsx docs/audit/fable-p3-probes/lead/probe-nulls.ts
import { findSchema } from "../../../../src/schemas/index";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
const cases: [string, string][] = [
  ["/thin-film/solar-protection", "uvPairs=40"], ["/thin-film/solar-protection", "uvPairs=35"],
  ["/thin-film/anti-fog", "waterTemp=-25"], ["/thin-film/anti-fog", "waterTemp=-10"],
  ["/wave-optics/ring-cavity", "outputCouplerR=0.01"], ["/wave-optics/michelson-interferometer", "linewidth=0"],
  ["/thin-film/notch-filter", "pairs=1"], ["/wave-optics/gaussian-beam", "waist=0x10"],
];
for (const [href, qs] of cases) {
  const s = findSchema(href);
  if (!s) { console.log(href, "no schema"); continue; }
  const p = parseInputs(s, new URLSearchParams(qs));
  if (!p.ok) { console.log(href, qs, "400:", p.error); continue; }
  const r = runSchema(s, p.values) as unknown as Record<string, unknown>;
  console.log(href, qs, JSON.stringify(r).slice(0, 420));
}
