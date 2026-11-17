import { findSchema } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
const s = findSchema("/thin-film/solar-protection")!;
console.log(s.inputs.map((i) => `${i.key}:${i.default}[${i.min},${i.max}]`).join(" "));
for (const n of [10, 15, 20, 25, 30, 35, 40]) {
  const r = runSchema(s, (parseInputs(s, new URLSearchParams({ uvPairs: String(n) })) as any).values);
  console.log(n, JSON.stringify(r.outputs).slice(0, 160));
}
const a = findSchema("/thin-film/anti-fog")!;
for (const t of [-25, -10, -5, 0]) { const r = runSchema(a, (parseInputs(a, new URLSearchParams({ waterTemp: String(t) })) as any).values); console.log("antifog", t, r.outputs.surfaceTension, r.warnings.length); }
console.log(a.inputs.find((i) => i.key === "waterTemp"));
