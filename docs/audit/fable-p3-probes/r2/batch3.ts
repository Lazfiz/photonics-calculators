import { stack, qw, L } from "./tmm";
const nm = 1e-9, D = Math.PI / 180; const p = (x: number) => (100 * x).toFixed(5);
const HL = (nH: number, nL: number, N: number, l0: number) => Array.from({ length: N }, () => [qw(nH, l0 * nm), qw(nL, l0 * nm)]).flat();
console.log("angle-tuning (HL)^5 peak:", p(stack(1, HL(2.35, 1.45, 5, 550), 1.52, 0, 550 * nm).R), "(97.9171)");
const d7 = HL(2.35, 1.45, 7, 550);
console.log("dichroic 7 pairs 45deg at 502.34: Rs", p(stack(1, d7, 1.52, 0, 502.34 * nm, 45 * D, "s").R), "(99.8495) Rp", p(stack(1, d7, 1.52, 0, 502.34 * nm, 45 * D, "p").R), "(96.7114)");
console.log("dielectric-stack nL1.38:", p(stack(1, HL(2.35, 1.38, 5, 550), 1.52, 0, 550 * nm).R), "(98.7249)");
console.log("HR (HL)^10H 1064:", p(stack(1, [...HL(2.35, 1.45, 10, 1064), qw(2.35, 1064 * nm)], 1.52, 0, 1064 * nm).R), "(99.993)");
console.log("anti-fog dry 1.33/120nm @550:", p(stack(1, [{ n: 1.33, d: 120 * nm }], 1.52, 0, 550 * nm).T), "(99.1513) wet(water inc):", p(stack(1.33, [{ n: 1.33, d: 120 * nm }], 1.52, 0, 550 * nm).T));
console.log("hard-coating 2.1/200nm @550 R:", p(stack(1, [{ n: 2.1, d: 200 * nm }], 1.52, 0, 550 * nm).R), "(23.6374)");
const ps = stack(1, [{ n: 1.38, d: 49.8188 * nm }], 1.52, 0, 550 * nm); console.log("phase-shift R", p(ps.R), "(2.78215) argR", ps.phaseR.toFixed(3), "(-163.618)");
const sp = stack(1, [{ n: 1.46, k: 0.001, d: 100 * nm }], 1.52, 0, 550 * nm); console.log("spectrophotometry R/T/A", p(sp.R), p(sp.T), p(sp.A), "(2.81793 96.9597 0.222392)");
console.log("wavelength-sep T at 770:", p(stack(1, HL(2.35, 1.45, 5, 550), 1.52, 0, 770 * nm).T), "(71.826)");
// metal-dielectric: air | diel 50 | metal 10 | sub
const md = stack(1, [{ n: 2.1, d: 50 * nm }, { n: 0.5, k: 3, d: 10 * nm }], 1.52, 0, 550 * nm); console.log("metal-diel A (air|D|M|sub)", md.A.toFixed(6), "R", md.R.toFixed(4), "(module 0.172414)");
const md2 = stack(1, [{ n: 0.5, k: 3, d: 10 * nm }, { n: 2.1, d: 50 * nm }], 1.52, 0, 550 * nm); console.log("metal-diel A (air|M|D|sub)", md2.A.toFixed(6));
// gradient index, cosine profile 1.1 -> 1.52 over 500 nm, from air
for (const prof of ["cos", "lin"]) { const N = 2000, Ls: L[] = []; for (let j = 0; j < N; j++) { const u = (j + 0.5) / N; const w = prof === "cos" ? (1 - Math.cos(Math.PI * u)) / 2 : u; Ls.push({ n: 1.1 + (1.52 - 1.1) * w, d: 500 * nm / N }); }
  console.log("GRIN", prof, "R", p(stack(1, Ls, 1.52, 0, 550 * nm).R), "(0.177065)"); }
// single-ar oblique 45 s/p, double-layer ar
for (const pol of ["s", "p"] as const) console.log("single-ar 45deg", pol, p(stack(1, [qw(1.38, 550 * nm)], 1.52, 0, 550 * nm, 45 * D, pol).R));
console.log("double-layer AR R:", p(stack(1, [qw(1.38, 550 * nm), qw(1.7, 550 * nm)], 1.52, 0, 550 * nm).R), "(6.56773e-5)");
// dual-band AR: air | n1 d1 | n2 d2 | n3 d3 | sub
const db = [{ n: 1.38, d: 251.478 * nm }, { n: 2.1, d: 16.2628 * nm }, { n: 1.65, d: 71.3729 * nm }];
console.log("dual-band R1 R2:", p(stack(1, db, 1.52, 0, 450 * nm).R), p(stack(1, db, 1.52, 0, 1064 * nm).R), "(0.0369779 0.234267)");
// Fabry-Perot FWHM exact (Airy, lossless): n=1.5 d=500 R=0.8
{ const F = 4 * 0.8 / 0.04, half = Math.asin(1 / Math.sqrt(F)), m = 3; const l1 = 4 * Math.PI * 750 / (2 * m * Math.PI - 2 * half), l2 = 4 * Math.PI * 750 / (2 * m * Math.PI + 2 * half);
  console.log("FP FWHM exact", (l1 - l2).toFixed(4), "approx FSR/F", (166.6667 / (Math.PI * Math.sqrt(0.8) / 0.2)).toFixed(4), "(11.8892)"); }
