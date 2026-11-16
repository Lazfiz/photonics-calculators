// Lead probe, imaging: brute-force pupil integrals against diffraction-mtf, diffraction-psf, confocal, wavefront.
import * as mtf from "../../../../src/physics/imaging/diffraction-mtf";
import * as psf from "../../../../src/physics/imaging/diffraction-psf";
import * as conf from "../../../../src/physics/imaging/confocal";
import * as wf from "../../../../src/physics/imaging/wavefront";
import * as sr from "../../../../src/physics/imaging/super-resolution";
const row = (s: string, mine: number, mod: number) => console.log(s.padEnd(58), mine.toPrecision(6).padStart(12), mod.toPrecision(6).padStart(12), (mod / mine).toFixed(5));

// OTF by direct 2D overlap of two unit pupils shifted by ±nu, phase(ρ²) given
function otfBF(nu: number, phase: (r2: number) => number, N = 700): number {
  let re = 0; const h = 2 / N;
  for (let i = 0; i < N; i++) { const x = -1 + (i + 0.5) * h;
    for (let j = 0; j < N; j++) { const y = -1 + (j + 0.5) * h;
      const a = (x + nu) ** 2 + y * y, b = (x - nu) ** 2 + y * y;
      if (a < 1 && b < 1) re += Math.cos(phase(a) - phase(b)); } }
  return (re * h * h) / Math.PI;
}
for (const [nu, W] of [[0.3, 0.5], [0.3, 1.0], [0.1, 2.0], [0.6, 0.25]] as const)
  row(`Hopkins OTF nu=${nu} W020=${W} waves`, otfBF(nu, (r2) => 2 * Math.PI * W * r2), mtf.defocusedOtf(nu, W));
// first contrast reversal: smallest W where min over nu of OTF < 0
{ let Wrev = NaN; for (let W = 0.5; W < 0.8; W += 0.005) { let neg = false; for (let nu = 0.02; nu < 1; nu += 0.02) if (mtf.defocusedOtf(nu, W) < -1e-6) neg = true; if (neg) { Wrev = W; break; } }
  console.log("first contrast reversal W020/λ (module header says ≈0.65):", Wrev.toFixed(3)); }
// high NA: NA 0.95 air, dz 0.5 µm, 550 nm
{ const s = 0.95, D = 0.5 / 0.55, K = 2 * Math.PI * D;
  const ph = (r2: number) => K * Math.sqrt(Math.max(0, 1 - s * s * r2));
  row("highNA OTF(0.5) s=.95 D=.909 (hdr 0.0432)", otfBF(0.5, ph, 1200), mtf.highNaDefocusOtf(0.5, D, s));
  const strehl = (wgt: (r: number) => number) => { let re = 0, im = 0, w0 = 0; const N = 200000; for (let i = 0; i < N; i++) { const r = (i + 0.5) / N; const w = wgt(r) * r; re += w * Math.cos(ph(r * r)); im += w * Math.sin(ph(r * r)); w0 += w; } return (re * re + im * im) / (w0 * w0); };
  row("highNA Strehl uniform-rho pupil (hdr 0.273)", strehl(() => 1), mtf.highNaDefocusStrehl(D, s));
  console.log("  same defocus, aplanatic (1-s²ρ²)^-1/4 weight:", strehl((r) => (1 - s * s * r * r) ** -0.25).toFixed(4), " uniform-in-cosθ (1-s²ρ²)^-1/2:", strehl((r) => (1 - s * s * r * r) ** -0.5).toFixed(4), " psf.axialIntensity:", psf.axialIntensity(0.5e-6, 550e-9, 1, 0.95).toFixed(4));
  // mid NA comparison of the two pages' on-axis intensity at the same defocus
  for (const [na, dz] of [[0.5, 4e-6], [0.8, 1e-6], [1.3, 0.8e-6]] as const) { const n = na > 1 ? 1.518 : 1; console.log(`  NA ${na} n ${n} dz ${dz * 1e6}µm: mtf-page Strehl ${mtf.highNaDefocusStrehl((n * dz) / 550e-9, na / n).toFixed(4)}  psf-page axialIntensity ${psf.axialIntensity(dz, 550e-9, n, na).toFixed(4)}`); }
}
// own J0/J1 by integral representation
const J = (n: number, x: number) => { let s = 0; const N = 400; for (let k = 0; k < N; k++) { const t = ((k + 0.5) * Math.PI) / N; s += Math.cos(n * t - x * Math.sin(t)); } return s / N; };
const airy = (v: number) => (v < 1e-6 ? 1 : (2 * J(1, v) / v) ** 2);
row("Airy FWHM coefficient (λ/NA)", (() => { let a = 1, b = 2; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (airy(m) > 0.5) a = m; else b = m; } return a / Math.PI; })(), psf.airyFwhm(1, 1));
row("encircled energy at first zero", 0.8378, psf.encircledEnergyAiry(psf.BESSEL_J1_FIRST_ZERO));
// Confocal, 1 AU pinhole: lateral = Airy(v)·∫_pinhole Airy(|v−w|) d²w
{ const p = 3.8317059702 * 1; // optical radius
  const det = (v: number) => { let s = 0; const NR = 120, NT = 120; for (let i = 0; i < NR; i++) { const r = ((i + 0.5) * p) / NR; for (let j = 0; j < NT; j++) { const t = ((j + 0.5) * 2 * Math.PI) / NT; s += airy(Math.hypot(v - r * Math.cos(t), r * Math.sin(t))) * r; } } return s; };
  const I0 = det(0); let a = 0.5, b = 2.5; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (airy(m) * det(m) > 0.5 * I0) a = m; else b = m; }
  const tab = conf.CONFOCAL_FWHM_TABLE.find((r) => Math.abs(r[0] - 1) < 1e-9)!;
  row("confocal lateral FWHM coeff, 1 AU", a / Math.PI, tab[1]);
  // axial for a point: |h(u,0)|²·∫_pinhole |h(u,w)|² d²w, h(u,v)=2∫J0(vρ)exp(-iuρ²/2)ρdρ
  const h2 = (u: number, v: number) => { let re = 0, im = 0; const N = 300; for (let k = 0; k < N; k++) { const r = (k + 0.5) / N; const j = J(0, v * r) * r; re += j * Math.cos((u * r * r) / 2); im -= j * Math.sin((u * r * r) / 2); } return (4 * (re * re + im * im)) / (N * N); };
  const ax = (u: number) => { let s = 0; const NR = 150; for (let i = 0; i < NR; i++) { const r = ((i + 0.5) * p) / NR; s += h2(u, r) * r; } return h2(u, 0) * s; };
  const A0 = ax(0); a = 2; b = 8; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (ax(m) > 0.5 * A0) a = m; else b = m; }
  row("confocal axial FWHM coeff, 1 AU (2u½/4π)", (2 * a) / (4 * Math.PI), tab[2]);
  // section of a thin plane via S(u)=∫₀² OTF(q/2;u)²·p·J1(qp) dq with brute-force OTF
  const S = (u: number) => { let s = 0; const NQ = 60; for (let k = 0; k < NQ; k++) { const q = ((k + 0.5) * 2) / NQ; const o = otfBF(q / 2, (r2) => (u / 2) * r2, 160); s += o * o * p * J(1, q * p); } return s; };
  const S0 = S(0); a = 3; b = 9; for (let i = 0; i < 14; i++) { const m = (a + b) / 2; if (S(m) > 0.5 * S0) a = m; else b = m; }
  row("confocal section FWHM coeff, 1 AU", (2 * a) / (4 * Math.PI), tab[3]);
  row("pinhole throughput 1 AU (=encircled 83.8%)", 0.8378, conf.pinholeThroughput(1));
}
// Coma Strehl brute force 2D, σ = 0.1 and 0.25 waves
for (const sig of [0.1, 0.25]) { let re = 0, im = 0, n = 0; const N = 600; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -1 + (2 * (i + 0.5)) / N, y = -1 + (2 * (j + 0.5)) / N; const r = Math.hypot(x, y); if (r >= 1) continue; const ph = 2 * Math.PI * sig * Math.sqrt(8) * (3 * r ** 3 - 2 * r) * (x / r); re += Math.cos(ph); im += Math.sin(ph); n++; }
  row(`coma Strehl σ=${sig}λ (Maréchal ${Math.exp(-((2 * Math.PI * sig) ** 2)).toFixed(4)})`, (re * re + im * im) / (n * n), wf.zernikeStrehl("coma", sig));
  let r2 = 0, i2 = 0; n = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -1 + (2 * (i + 0.5)) / N, y = -1 + (2 * (j + 0.5)) / N; const q = x * x + y * y; if (q >= 1) continue; const ph = 2 * Math.PI * sig * Math.sqrt(5) * (6 * q * q - 6 * q + 1); r2 += Math.cos(ph); i2 += Math.sin(ph); n++; }
  row(`spherical Strehl σ=${sig}λ`, (r2 * r2 + i2 * i2) / (n * n), wf.zernikeStrehl("spherical", sig)); }
// Mortensen MLE: N=1000, a=100 nm, b²=10, λ=670 nm, NA 1.4
{ const s = (0.21 * 670e-9) / 1.4, a = 100e-9, N = 1000, b = 10; const sa2 = s * s + (a * a) / 12; const tau = (2 * Math.PI * sa2 * b) / (N * a * a);
  let I = 0; const M = 2e6; for (let k = 0; k < M; k++) { const t = (k + 0.5) / M; I += Math.log(t) / (1 + t / tau); } I /= M;
  row("Mortensen eq.5 MLE σ (m)", Math.sqrt((sa2 / N) / (1 + I)), sr.mortensenPrecision(670e-9, 1.4, N, a, b, { estimator: "mle" }));
  row("Mortensen eq.6 LS σ (m)", Math.sqrt((sa2 / N) * (16 / 9 + (8 * Math.PI * sa2 * b) / (N * a * a))), sr.mortensenPrecision(670e-9, 1.4, N, a, b, { estimator: "ls" })); }
