// R1 batch 6: light-field microscope, SIM gap, spinning disk helpers, FCS Koppel, FRAP Axelrod
import * as LF from "../../../../src/physics/imaging/light-field";
import * as S from "../../../../src/physics/imaging/super-resolution";
import * as C from "../../../../src/physics/imaging/confocal";
import * as FD from "../../../../src/physics/imaging/fluorescence-dynamics";

const row = (slug: string, q: string, mine: number, mod: number) =>
  console.log(`${slug.padEnd(14)} ${q.padEnd(32)} mine=${mine.toPrecision(6).padStart(12)} mod=${(+mod).toPrecision(6).padStart(12)} r=${(mod / mine).toFixed(4)}${Math.abs(mod / mine - 1) > 0.005 ? "  <<<" : ""}`);
// Levoy 40x/0.95 dry, W=125 µm, λ=535? pixel 12 µm (Levoy Table 1 uses 125 µm lenslets)
for (const [M, NA, n] of [[40, 0.95, 1], [60, 1.4, 1.515], [20, 0.5, 1]]) {
  const lam = 535e-9, W = 125e-6, px = 4e-6;
  const r = LF.lightFieldMicroscope({ na: NA, magnification: M, n, lensletPitch: W, pixelPitch: px, lambda: lam });
  const R = 0.47 * lam * M / NA, Nud = W / R, Nu = Math.min(Nud, W / (2 * px));
  row("light-field", `${M}x Nu diff`, Nud, r.spotsDiffraction);
  row("light-field", `${M}x DOF conv λn/NA²`, lam * n / NA ** 2, r.dofConventional);
  row("light-field", `${M}x DOF refocus (Inoué e=W)`, lam * n / NA ** 2 + n * W / (M * NA), r.dofRefocused);
  row("light-field", `${M}x DOF refocus (2+Nu)λn/2NA²`, (2 + Nud) * lam * n / (2 * NA ** 2), r.dofRefocused);
  row("light-field", `${M}x DOF view (2+Nu²)`, (2 + Nu * Nu) * lam * n / (2 * NA ** 2), r.dofView);
  row("light-field", `${M}x lenslet f = N·W`, M / (2 * NA) * W, r.lensletFocal);
}
console.log("  SIM gap (488/520, NA1.4, frac 1):", S.simSupportHasGap(488e-9, 520e-9, 1.4, 1), " frac 0.9:", S.simSupportHasGap(488e-9, 520e-9, 1.4, 0.9), " (gap iff frac·2NA/λex > 2NA/λem: frac>", (488 / 520).toFixed(4), ")");
row("spinning-disk", "fps rpm/60·12 (5000rpm)", 5000 / 60 * 12, C.spinningDiskFrameRate(5000, 12));
row("spinning-disk", "fill π d²/(4a²) 50/250", Math.PI / 4 * (50 / 250) ** 2, C.pinholeFillFactor(50e-6, 250e-6));
row("fcs", "Koppel ε√(ΔτT)/√(1+1/N)", 1e4 * Math.sqrt(1e-6 * 10) / Math.sqrt(1 + 1 / 20), FD.koppelSnr(1e4, 1e-6, 10, 20));
// Axelrod Gaussian-beam FRAP: F(t)/F(-) = Σ (−K)^n/n! · 1/(1 + n(1 + 2t/τD)), u = t/τD?
const axel = (u: number, K: number) => { let s = 0, t = 1; for (let n = 0; n < 200; n++) { s += t / (1 + n * (1 + 2 * u)); t *= -K / (n + 1); } return s; };
for (const K of [0.5, 2]) {
  const F0 = axel(0, K), Finf = 1, half = (F0 + Finf) / 2;
  let a = 0, b = 100; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (axel(m, K) < half) a = m; else b = m; }
  row("frap", `Axelrod γ t½/τD K=${K}`, a, FD.frapHalfTimeRatio("gaussian", K));
  row("frap", `Axelrod post-bleach K=${K}`, F0 === F0 ? (1 - Math.exp(-K)) / K : NaN, FD.axelrodPostBleach(K));
}
