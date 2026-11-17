// Lead probe 2: NLS split-step invariants, dispersive wave root, GTI and Treacy by numerical differentiation,
// Q-switch waveform vs closed forms, mode matching by brute force.
// Run: npx tsx docs/audit/fable-p3-probes/lead/probe-ultrafast.ts
import { solveNls, dispersiveWaveShiftNonlinear, solitonContent } from "../../../../src/physics/wave-optics/soliton";
import { gtiPhase, gtiGroupDelay, gtiGdd } from "../../../../src/physics/wave-optics/gires-tournois";
import { treacyCompressor, chirpedGaussianDuration } from "../../../../src/physics/wave-optics/chirped-pulse";
import { qSwitchWaveform, qSwitchExtraction, qSwitchPeakPhotons, qSwitchOptimumCoupling, qSwitchPulse } from "../../../../src/physics/wave-optics/pulsed-laser";
import { singleLensModeMatch, qAfterLens, beamRadiusFromQ, gaussianOverlap } from "../../../../src/physics/wave-optics/mode-matching";
import { spmSpectrum, spmRmsBroadening } from "../../../../src/physics/wave-optics/kerr";
import { dft } from "../../../../src/physics/fft";

const c = 299792458;
// --- NLS
{
  const s1 = solveNls(1, -1, 5);
  console.log(`N=1 anomalous, ξ=5: peak min ${Math.min(...s1.peak).toFixed(6)} max ${Math.max(...s1.peak).toFixed(6)} energy ratio ${s1.energyRatio.toFixed(10)}`);
  const s2 = solveNls(2, -1, Math.PI / 2, { samples: 200 });
  const iq = s2.xi.findIndex((x) => x >= Math.PI / 4);
  console.log(`N=2: peak at ξ=π/4 ${s2.peak[iq].toFixed(4)} (exact 4), at ξ=π/2 ${s2.peak[s2.peak.length - 1].toFixed(5)} (exact 1)`);
  const s0 = solveNls(0, 1, 3);
  const last = s0.rmsWidth.length - 1;
  console.log(`N=0 linear, ξ=3: rms ${s0.rmsWidth[last].toFixed(6)} expected ${Math.sqrt(Math.PI ** 2 / 12 + 9 / 3).toFixed(6)}; rms(0) ${s0.rmsWidth[0].toFixed(6)} expected ${(Math.PI / Math.sqrt(12)).toFixed(6)}`);
  const s3 = solveNls(3, 1, 1);
  console.log(`N=3 normal: energy ratio ${s3.energyRatio.toFixed(10)}`);
  console.log("solitonContent(1.5) =", solitonContent(1.5), " (Satsuma–Yajima: η₂ = N − 3/2 = 0, so one soliton at exactly 1.5)");
}
{
  const b2 = -20e-27, b3 = 0.1e-39, g = 0.1, P = 5000;
  const W = dispersiveWaveShiftNonlinear(b2, b3, g, P);
  console.log(`DW root residual: ${((b2 * W * W) / 2 + (b3 * W ** 3) / 6 - (g * P) / 2).toExponential(2)} (rhs ${(g * P / 2).toFixed(1)}), Ω ${W.toExponential(5)}, linear ${(-3 * b2 / b3).toExponential(5)}`);
}
// --- GTI: τ = dφ/dω and GDD = dτ/dω by central differences in ω
{
  const g = { R: 0.3, n: 1.45, d: 5e-6 };
  let eTau = 0, eGdd = 0;
  for (const lam of [780e-9, 800e-9, 810e-9, 1030e-9, 1064e-9]) {
    const w = (2 * Math.PI * c) / lam, hh = 1e-6 * w;
    const ph = (x: number) => gtiPhase(g, (2 * Math.PI * c) / x);
    let dphi = ph(w + hh) - ph(w - hh);
    dphi -= 2 * Math.PI * Math.round(dphi / (2 * Math.PI));
    const tauNum = dphi / (2 * hh);
    const gddNum = (gtiGroupDelay(g, (2 * Math.PI * c) / (w + hh)) - gtiGroupDelay(g, (2 * Math.PI * c) / (w - hh))) / (2 * hh);
    eTau = Math.max(eTau, Math.abs(tauNum / gtiGroupDelay(g, lam) - 1));
    eGdd = Math.max(eGdd, Math.abs(gddNum - gtiGdd(g, lam)) / Math.abs(gtiGdd(g, lam)));
  }
  console.log(`GTI: rel err τ vs dφ/dω ${eTau.toExponential(2)}, GDD vs dτ/dω ${eGdd.toExponential(2)}`);
}
// --- Treacy: group delay of one pass τ(ω) = G (1 + cos(α − β))/(c cos β), sin β = λ/d − sin α; GDD = dτ/dω, TOD = d²τ/dω²
{
  const lam = 800e-9, d = 1e-3 / 1200, alpha = (35 * Math.PI) / 180, G = 0.3;
  const tau = (w: number) => {
    const l = (2 * Math.PI * c) / w, beta = Math.asin(l / d - Math.sin(alpha));
    return (2 * G * (1 + Math.cos(alpha - beta))) / (c * Math.cos(beta)); // two passes
  };
  const w = (2 * Math.PI * c) / lam, hh = 1e-4 * w;
  const gddNum = (tau(w + hh) - tau(w - hh)) / (2 * hh);
  const todNum = (tau(w + hh) - 2 * tau(w) + tau(w - hh)) / (hh * hh);
  const t = treacyCompressor(lam, d, alpha, G, 2);
  console.log(`Treacy 1200/mm 35° 0.3 m ×2: GDD module ${t.gdd.toExponential(6)} numeric ${gddNum.toExponential(6)}; TOD module ${t.tod.toExponential(5)} numeric ${todNum.toExponential(5)}`);
  // chirped Gaussian duration by FFT: 100 fs FWHM with GDD 20000 fs²
  const N = 4096, T = 20e-12, dt = T / N, tau0 = 100e-15, phi2 = 2e-26;
  const re = Array.from({ length: N }, (_, i) => Math.exp(-2 * Math.LN2 * (((i - N / 2) * dt) / tau0) ** 2));
  const F = dft(re);
  for (let k = 0; k < N; k++) {
    const om = ((k < N / 2 ? k : k - N) * 2 * Math.PI) / T, p = 0.5 * phi2 * om * om, a = F.re[k], b = F.im[k];
    F.re[k] = a * Math.cos(p) - b * Math.sin(p); F.im[k] = a * Math.sin(p) + b * Math.cos(p);
  }
  const out = dft(F.re, F.im, true), I = out.re.map((x, i) => x * x + out.im[i] ** 2), pk = Math.max(...I);
  const above = I.map((v, i) => (v >= pk / 2 ? i : -1)).filter((i) => i >= 0);
  console.log(`chirped 100 fs + 20000 fs²: module ${(chirpedGaussianDuration(tau0, phi2) * 1e15).toFixed(2)} fs, FFT ${((above[above.length - 1] - above[0] + 1) * dt * 1e15).toFixed(1)} fs`);
}
// --- Q-switch
for (const r of [1.05, 1.5, 3, 10, 40]) {
  const eta = qSwitchExtraction(r), w = qSwitchWaveform(r);
  console.log(`Q-switch r=${r}: η ${eta.toFixed(6)} residual ${(r * eta + Math.log(1 - eta)).toExponential(1)}; RK4 ∫Φ ${w.extracted.toFixed(5)} vs rη ${(r * eta).toFixed(5)}; FWHM/τc ${w.fwhm.toFixed(4)} vs E/P estimate ${((r * eta) / qSwitchPeakPhotons(r)).toFixed(4)}`);
}
{ // Degnan optimum by brute-force scan over γ₂
  const g0l = 1.2, gi = 0.03, hv = 1.87e-19, A = 7e-6, sg = 2.8e-23;
  const o = qSwitchOptimumCoupling(g0l, gi, hv, A, sg);
  let best = 0, bg = 0;
  for (let g2 = 0.001; g2 < 2.3; g2 += 0.0005) {
    const E = qSwitchPulse(g0l / (gi + g2 / 2), hv, A, sg, g2, 1e-9).energy;
    if (E > best) { best = E; bg = g2; }
  }
  console.log(`Degnan optimum: γ₂ ${o.couplerLoss.toFixed(4)} E ${(o.energy * 1e3).toFixed(5)} mJ; scan γ₂ ${bg.toFixed(4)} E ${(best * 1e3).toFixed(5)} mJ`);
}
// --- mode matching: the returned lens must put a waist of radius w2 exactly at d
{
  let worst = 0;
  for (const [w1, w2, d] of [[200e-6, 50e-6, 0.3], [1e-3, 1e-3, 0.5], [30e-6, 400e-6, 1.2], [500e-6, 480e-6, 0.05]] as const) {
    const lam = 1064e-9, m = singleLensModeMatch({ lambda: lam, w1, w2, d });
    const q = qAfterLens(lam, w1, m.s1, m.f, m.s2);
    const eta = gaussianOverlap(q, { re: 0, im: (Math.PI * w2 * w2) / lam });
    worst = Math.max(worst, Math.abs(eta - 1), Math.abs(beamRadiusFromQ(q, lam) / w2 - 1), Math.abs(q.re) / d);
    if (!(m.s1 >= 0 && m.s2 >= 0) && m.lensBetweenWaists) console.log("flag wrong");
  }
  console.log("mode matching worst deviation (η, w, waist position):", worst.toExponential(2));
}
// --- SPM spectrum rms width from the FFT vs closed form
for (const [phi, shape] of [[2, "gaussian"], [4.5 * Math.PI, "gaussian"], [3, "sech"], [30, "sech"]] as const) {
  const s = spmSpectrum(phi, shape)!;
  const m0 = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const m2 = (arr: number[]) => arr.reduce((a, b, k) => a + b * s.omegaT0[k] ** 2, 0);
  const ratio = Math.sqrt(m2(s.output) / m0(s.output) / (m2(s.input) / m0(s.input)));
  console.log(`SPM ${shape} φ=${phi.toFixed(3)}: rms broadening FFT ${ratio.toFixed(5)} closed form ${spmRmsBroadening(phi, shape).toFixed(5)}; energy ratio ${(m0(s.output) / m0(s.input)).toFixed(8)}`);
}
