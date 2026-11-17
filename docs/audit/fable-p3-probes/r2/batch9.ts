import { metalIndex } from "../../../../src/physics/thin-film/low-emissivity";
import { stack, qw } from "./tmm";
const nm = 1e-9;
// protected silver: air | MgF2-like 1.38 50nm | Ag 80 | adhesion 2.35 10nm | glass 1.52
const R = (l: number, prot: boolean) => { const ag = metalIndex("Ag" as any, l * nm); const L = [...(prot ? [{ n: 1.38, d: 50 * nm }] : []), { n: ag.n, k: ag.k, d: 80 * nm }, { n: 2.35, d: 10 * nm }];
  return stack(1, L, 1.52, 0, l * nm).R; };
let s = 0, sb = 0, n = 0, mn = 1; for (let l = 400; l <= 700; l += 0.5) { s += R(l, true); sb += R(l, false); mn = Math.min(mn, R(l, true)); n++; }
let sn = 0, nn = 0; for (let l = 700; l <= 1200; l += 1) { sn += R(l, true); nn++; }
console.log("prot Ag visMean", (s / n).toFixed(5), "(0.961889) bare", (sb / n).toFixed(5), "(0.975799) visMin", mn.toFixed(5), "(0.901088) nir", (sn / nn).toFixed(5), "(0.987297)");
// heat mirror D30/Ag12/D30 on glass, at 550 nm: front-face R,T
const ag = metalIndex("Ag" as any, 550 * nm); const hm = stack(1, [{ n: 2.35, d: 30 * nm }, { n: ag.n, k: ag.k, d: 12 * nm }, { n: 2.35, d: 30 * nm }], 1.52, 0, 550 * nm);
console.log("Ag 550", ag.n.toFixed(4), ag.k.toFixed(4), "heat mirror face R T A @550", hm.R.toFixed(4), hm.T.toFixed(4), hm.A.toFixed(4), "pane T with back face", (hm.T * 0.95742 / (1 - (1 - 0.95742) * hm.R)).toFixed(4));
