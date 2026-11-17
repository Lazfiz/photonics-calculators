// PR #289 claim 1 (audit M3): sub-ns anterior-segment limit.
// Run on: the PR head (0199310) AND origin/main (0cdf269) to see before/after. `npx tsx docs/audit/fable-verify-probes/pr289/probe-m3-subns.ts`
// Reference (written out by hand below, not taken from the code): ICNIRP, Health Phys. 105(3):271–295 (2013):
//   Table 7 (skin, 400–1400 nm): 200 C_A J/m² for 1 ns–100 ns; C_A = 10^(0.002(λ−700)) at 700–1050 nm, 5 at 1050–1400 nm (Table 3).
//   Table 5 note d: anterior segment = 2 × skin limit from 700 nm.  p. 282: below the table, hold the irradiance of the shortest duration.
//   p. 287 (as the PR and the audit read it; PDF NOT fetched in this session): sub-ns skin exposure ≤ 10 % of the 1 ns limit.
//   Table 5, 1050–1400 nm, 10 ps–13 µs retinal: 20 C_C C_E mJ/m²; C_C = 8 + 10^(0.04(λ−1250)) at 1200–1400 nm (Table 3).
import { exposureLimit } from "../../../../src/physics/laser-safety/eye-exposure-limits";
import { pulseLimits, pulseTrainLimits } from "../../../../src/physics/laser-safety/pulse-train";

const CA = (nm: number) => (nm < 700 ? 1 : nm < 1050 ? Math.pow(10, 0.002 * (nm - 700)) : 5);
const ant1ns = (nm: number) => 2 * 200 * CA(nm); // J/m²
/** reference: min(held 1 ns irradiance · t, 10 % of the 1 ns value) */
const ref = (nm: number, t: number) => (t >= 1e-9 ? ant1ns(nm) : Math.min((ant1ns(nm) / 1e-9) * t, 0.1 * ant1ns(nm)));
const code = (nm: number, t: number, kind: string) => {
  const l = pulseLimits(nm * 1e-9, 1.5e-3).find((x) => x.kind === kind)!;
  return exposureLimit(l, t);
};
console.log("anterior segment, J/m²: λ, t, reference, code");
for (const [nm, t] of [[1350, 1e-9], [1350, 5e-10], [1350, 5e-11], [1350, 1e-10], [1350, 1e-13], [800, 1e-9], [800, 5e-10], [1399, 5e-10], [700, 5e-10], [1050, 5e-10]] as const) {
  console.log(nm, t, ref(nm, t).toPrecision(8), code(nm, t, "anteriorSegment").toPrecision(8));
}
const CC1399 = 8 + Math.pow(10, 0.04 * (1399 - 1250));
console.log("1399 nm retinal thermal at 500 ps: reference 20·C_C mJ/m² =", (0.02 * CC1399).toPrecision(6), "code", code(1399, 5e-10, "retinalThermal").toPrecision(6));
// As energies through each aperture (7 mm retina, 3.5 mm skin), wide flat beam approximated by a 1 m Gaussian is not
// needed: compare H·A directly.
const A7 = Math.PI * 3.5e-3 ** 2, A35 = Math.PI * 1.75e-3 ** 2;
console.log("1399 nm, 500 ps, energy through aperture: retinal ref", (0.02 * CC1399 * A7).toPrecision(5), "J; anterior ref", (200 * A35).toPrecision(5), "J");
for (const d of [1e-3, 2e-3, 5e-3, 20e-3]) {
  const r = pulseTrainLimits(1399e-9, d, { duration: 5e-10, prf: 0, exposure: 5e-10 }, 1.5e-3);
  console.log(`code pulseTrainLimits 1399 nm 500 ps d=${d * 1e3} mm: qMax=${r.qMax.toPrecision(6)} J`, JSON.stringify(r.limits.map((l) => [l.kind, +l.qMax.toPrecision(5)])));
}
// where does the anterior limit bind for a single 500 ps pulse (beam 2 mm)?
for (const nm of [700, 800, 1000, 1064, 1200, 1250, 1300, 1350, 1399]) {
  const r = pulseTrainLimits(nm * 1e-9, 2e-3, { duration: 5e-10, prf: 0, exposure: 5e-10 }, 1.5e-3);
  const b = r.limits.reduce((a, c) => (c.qMax < a.qMax ? c : a));
  console.log(nm, "nm 500 ps 2 mm: binding", b.kind, r.qMax.toPrecision(5));
}
