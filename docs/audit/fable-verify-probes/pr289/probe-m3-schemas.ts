// PR #289 claim 1, regression side: which API outputs move because of the sub-ns anterior-segment change.
// Run on BOTH origin/main (0cdf269) and the PR head (0199310) and diff.  Every schema whose module graph uses
// pulse-train.ts is run on a grid of wavelengths (700–1399 nm and controls) × sub-ns/ns durations, found by key name.
// No reference: before/after comparison.
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
const hrefs = process.argv.slice(2);
for (const s of schemas.filter((x) => hrefs.includes(x.href.split("/").pop()!))) {
  const wl = s.inputs.find((i) => /wavelength/i.test(i.key));
  const tau = s.inputs.find((i) => /pulse_?(duration|width)|^tau/i.test(i.key));
  if (!wl || !tau) { console.log(s.href, "no wavelength/pulse input", s.inputs.map((i) => i.key).join(",")); continue; }
  for (const nm of [532, 700, 800, 1064, 1200, 1300, 1350, 1399, 1550]) for (const tSI of [1e-13, 1e-11, 5e-11, 1e-10, 5e-10, 9.9e-10, 1e-9, 1e-8]) {
    const q = { [wl.key]: (nm * 1e-9) / wl.toSI, [tau.key]: tSI / tau.toSI };
    const p = parseInputs(s, new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])));
    if (!p.ok) { console.log(s.href, nm, tSI, "ERROR", p.error); continue; }
    const r = runSchema(s, p.values);
    console.log(s.href, nm, tSI, JSON.stringify(Object.fromEntries(Object.entries(r.outputs).map(([k, v]) => [k, typeof v === "number" ? Number(v.toPrecision(8)) : v]))));
  }
}
