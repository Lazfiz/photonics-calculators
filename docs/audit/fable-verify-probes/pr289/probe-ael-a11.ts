// PR #289 claim 2 (audit U2): EU A11 outputs on /laser-safety/ael-limits; euA11 input removed.
// Run on: the PR head (0199310). (On origin/main the A11 outputs do not exist; the euA11 input does.)
// Reference, by hand: ICNIRP 2013 Table 7 skin limit 1.1e4·C_A·t^0.25 J/m² (C_A = 5 at 1050–1400 nm) over the stop that
// Schulmeister's 2022 A11 white paper §4 gives (1 mm to 0.35 s, 1.5 t^0.375 mm to 10 s, 3.5 mm after).  [IEC-unverified]:
// neither IEC 60825-1:2014 nor EN 60825-1:2014/A11:2021 nor the white paper could be read in this session.
// IEC-only Class 1 at 1310 nm: 10·C_A·C_C W/m² × π(3.5 mm)², C_A = 5 (IEC's C_4... as the repo uses), C_C = 8 + 10^(0.04·60).
import { schemas } from "../../../../src/schemas";
import { parseInputs, runSchema } from "../../../../src/schemas/run";

const s = schemas.find((x) => x.href === "/laser-safety/ael-limits")!;
const run = (q: Record<string, string | number>) => {
  const p = parseInputs(s, new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])));
  return p.ok ? runSchema(s, p.values) : p;
};
const A = (dmm: number) => (Math.PI * (dmm * 1e-3) ** 2) / 4;
console.log("ref 1 s energy through 1.5 mm:", (1.1e4 * 5 * 1 * A(1.5)).toPrecision(10), "J");
console.log("ref CW at 0.35 s through 1 mm:", (1.1e4 * 5 * Math.pow(0.35, -0.75) * A(1) * 1e3).toPrecision(10), "mW");
// is 0.35 s really the minimum of P(t) = H(t)·A(t)/t over t?  brute force 1 ns … 30 ks
let best = [Infinity, 0];
for (let i = 0; i <= 200000; i++) {
  const t = 1e-9 * Math.pow(3e13, i / 200000);
  const H = t < 1e-7 ? 200 * 5 : t < 10 ? 1.1e4 * 5 * Math.pow(t, 0.25) : 2000 * 5 * t;
  const d = t < 0.35 ? 1 : t < 10 ? 1.5 * Math.pow(t, 0.375) : 3.5;
  const P = (H * A(d)) / t;
  if (t >= 0.25 && P < best[0]) best = [P, t]; // CW over the time base: durations up to 100 s; short t never binds for CW? check all:
}
console.log("ref CW min over t ≥ 0.25 s:", (best[0] * 1e3).toPrecision(8), "mW at t =", best[1].toPrecision(4), "s");
console.log("ref IEC Class 1 CW 1310 nm:", (10 * 5 * (8 + Math.pow(10, 2.4)) * A(7) * 1e3).toPrecision(8), "mW (3R: capped at 500 mW)");
for (const q of [{ wavelength: 1310, emissionDuration: 1 }, { wavelength: 1310 }, {}, { wavelength: 1250 }, { wavelength: 1249.9 }, { wavelength: 1399.9 }, { wavelength: 1400 }, { wavelength: 1310, euA11: 1 }]) {
  console.log(JSON.stringify(q), JSON.stringify(run(q)));
}
console.log("outputs:", s.outputs.map((o) => o.key).join(" "));
