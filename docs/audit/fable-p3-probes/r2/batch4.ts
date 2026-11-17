import { stack, qw } from "./tmm";
const nm = 1e-9, D = Math.PI / 180; const p = (x: number) => (100 * x).toFixed(4);
const HL = (nH: number, nL: number, N: number, l0: number) => Array.from({ length: N }, () => [qw(nH, l0 * nm), qw(nL, l0 * nm)]).flat();
const sp = stack(1, [{ n: 1.46, k: 0.001, d: 100 * nm }], 1.52, 0, 550 * nm); console.log("spectrophotometry R/T/A", p(sp.R), p(sp.T), p(sp.A), "(2.81793 96.9597 0.222392)");
const md = stack(1, [{ n: 2.1, d: 50 * nm }, { n: 0.5, k: 3, d: 10 * nm }], 1.52, 0, 550 * nm); console.log("metal-diel air|D|M|sub A", md.A.toFixed(6), "R", md.R.toFixed(4), "T", md.T.toFixed(4));
const md2 = stack(1, [{ n: 0.5, k: 3, d: 10 * nm }, { n: 2.1, d: 50 * nm }], 1.52, 0, 550 * nm); console.log("metal-diel air|M|D|sub A", md2.A.toFixed(6));
console.log("bulk metal 1-R from air", (1 - ((0.5 - 1) ** 2 + 9) / ((1.5) ** 2 + 9)).toFixed(6), "from n=2.1:", (1 - ((0.5 - 2.1) ** 2 + 9) / ((2.6) ** 2 + 9)).toFixed(6));
for (const lam of [502.34, 550]) for (const st of ["HL", "HLH", "LH"]) {
  const L = st === "HL" ? HL(2.35, 1.45, 7, 550) : st === "HLH" ? [...HL(2.35, 1.45, 7, 550), qw(2.35, 550 * nm)] : HL(1.45, 2.35, 7, 550);
  console.log(`dichroic ${st} @${lam}: Rs ${p(stack(1, L, 1.52, 0, lam * nm, 45 * D, "s").R)} Rp ${p(stack(1, L, 1.52, 0, lam * nm, 45 * D, "p").R)}`); }
for (const lam of [500, 550, 580, 600]) console.log("antifog T @", lam, p(stack(1, [{ n: 1.33, d: 120 * nm }], 1.52, 0, lam * nm).T));
