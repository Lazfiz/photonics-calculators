// PR #289 claim: "P_max rises with beam size in every case (0.3–20 mm at 355, 532, 905, 1310, 1550 nm)".
// Run on: the PR head (0199310).  Sweeps the beam diameter AT THE EYE (divergence = 0, so beamDiam is the size at the eye)
// through the schema, and reports every place where maxPowerScanned falls as the beam grows.  No external reference: this
// is a property check of the code's own output.
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
const s = schemas.find((x) => x.href === "/laser-safety/scanning-mpe")!;
const run = (q: Record<string, string | number>) => {
  const p = parseInputs(s, new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])));
  if (!p.ok) throw new Error(p.error);
  return runSchema(s, p.values);
};
const variants: Record<string, Record<string, string | number>> = {
  default: {}, alpha10: { alpha: 10 }, alpha100: { alpha: 100 }, t10: { exposureBasis: "custom", exposureTime: 10 }, t100: { exposureBasis: "custom", exposureTime: 100 },
  slow: { scanRate: 1 }, fast: { scanRate: 10000 }, oneWay: { scanDirection: "one" }, far: { workingDistance: 1000 }, near: { workingDistance: 10 },
};
const N = 400;
for (const wl of [355, 532, 905, 1310, 1550]) for (const [name, v] of Object.entries(variants)) {
  let prev = NaN, prevD = NaN, drops = 0, worst = 0, where = "", nan = 0;
  for (let i = 0; i <= N; i++) {
    const d = 0.3 * Math.pow(20 / 0.3, i / N);
    const p = run({ wavelength: wl, beamDiam: d, divergence: 0, ...v }).outputs.maxPowerScanned as number;
    if (!Number.isFinite(p)) { nan++; continue; }
    if (p < prev * (1 - 1e-9)) { drops++; const rel = 1 - p / prev; if (rel > worst) { worst = rel; where = `${prevD.toFixed(4)}→${d.toFixed(4)} mm: ${prev.toPrecision(5)}→${p.toPrecision(5)} mW`; } }
    prev = p; prevD = d;
  }
  console.log(`${wl} nm ${name}: drops ${drops}${drops ? `, worst −${(worst * 100).toFixed(2)} % at ${where}` : ""}${nan ? `, non-finite ${nan}` : ""}`);
}
