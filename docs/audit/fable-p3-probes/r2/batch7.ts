import { stack, L } from "./tmm";
import { crystalBirefringence } from "../../../../src/physics/polarization/uniaxial";
const nm = 1e-9, D = Math.PI / 180;
// PBS: glass | layers | glass at 45 deg in glass, QW at the internal angle
const ng = 1.6829, th = 45 * D, s0 = ng * Math.sin(th);
const q = (n: number): L => ({ n, d: 550 * nm / (4 * n * Math.sqrt(1 - (s0 / n) ** 2)) });
const HL5 = Array.from({ length: 5 }, () => [q(2.35), q(1.38)]).flat();
for (const [name, Ls] of [["(HL)^5", HL5], ["(HL)^5H", [...HL5, q(2.35)]], ["H(LH)^5", [q(2.35), ...HL5.map((_, i) => i % 2 ? q(2.35) : q(1.38))]]] as [string, L[]][]) {
  const S = stack(ng, Ls, ng, 0, 550 * nm, th, "s"), P = stack(ng, Ls, ng, 0, 550 * nm, th, "p");
  console.log(`PBS ${name} n=${Ls.length}: Rs ${S.R.toFixed(6)} Ts ${S.T.toExponential(4)} Tp ${P.T.toFixed(6)} Rp ${P.R.toFixed(6)}`); }
console.log("(module Rs 0.999967 Ts 3.28e-5 Tp 0.981873 Rp 0.0181267)");
// achromatic quartz/MgF2 QWP 292.405 / 237.792 um at 510 & 600
const dq = crystalBirefringence("quartz", 0), dm = crystalBirefringence("mgf2", 0);
for (const l of [510, 550, 600]) console.log(`achromat @${l}: waves ${((dq(l * nm) * 292.405e-6 - dm(l * nm) * 237.792e-6) / (l * nm)).toFixed(5)}  dn_q ${dq(l * nm).toFixed(6)} dn_MgF2 ${dm(l * nm).toFixed(6)}`);
