// PR #289 claim 1 at the API: /laser-safety/pulsed-mpe, ONE pulse (prf = 0), where rule 1 binds and the sub-ns
// anterior-segment change shows.  Run on BOTH origin/main (0cdf269) and the PR head (0199310) and diff.
// Reference for the PR side at 1350/1399 nm, 500 ps, 5 mm beam (1/e 3.54 mm ≥ 1 mm, so averaged over 3.5 mm):
// 200 J/m² × π(1.75 mm)² / (1 − exp(−2·3.5²/5²)) = 1.9242e-3 / 0.62469 = 3.0803e-3 J (ICNIRP 2013 Tables 5 note d, 7, 8; p. 287).
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";
const s = schemas.find((x) => x.href === "/laser-safety/pulsed-mpe")!;
console.log("ref 1350/1399 nm 500 ps 5 mm beam:", ((200 * Math.PI * 1.75e-3 ** 2) / (1 - Math.exp((-2 * 3.5 ** 2) / 25)) * 1e6).toPrecision(6), "µJ");
for (const nm of [532, 700, 800, 1064, 1250, 1300, 1330, 1350, 1399, 1550]) for (const ns of [1e-4, 0.01, 0.05, 0.1, 0.5, 0.99, 1, 10]) for (const d of [2, 5]) {
  const p = parseInputs(s, new URLSearchParams({ wavelength: String(nm), pulseDuration: String(ns), prf: "0", exposureTime: String(ns * 1e-9), beamDiam: String(d) }));
  if (!p.ok) { console.log(nm, ns, d, p.error); continue; }
  const r = runSchema(s, p.values);
  console.log(nm, ns, d, Number((r.outputs.maxPulseEnergy as number).toPrecision(8)), s.outputs.find((o) => o.key === "maxPulseEnergy")!.unit);
}
