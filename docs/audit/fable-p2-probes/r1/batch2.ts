// R1 batch 2: confocal FWHM table recomputed independently (paraxial scalar, direct spatial quadrature)
import * as C from "../../../../src/physics/imaging/confocal";

// J0 via Abramowitz & Stegun 9.4.1 / 9.4.3
function J0(x: number) {
  const ax = Math.abs(x);
  if (ax <= 3) { const y = (x / 3) ** 2; return 1 - 2.2499997 * y + 1.2656208 * y ** 2 - 0.3163866 * y ** 3 + 0.0444479 * y ** 4 - 0.0039444 * y ** 5 + 0.00021 * y ** 6; }
  const y = 3 / ax;
  const f0 = 0.79788456 - 0.00000077 * y - 0.0055274 * y ** 2 - 0.00009512 * y ** 3 + 0.00137237 * y ** 4 - 0.00072805 * y ** 5 + 0.00014476 * y ** 6;
  const t0 = ax - 0.78539816 - 0.04166397 * y - 0.00003954 * y ** 2 + 0.00262573 * y ** 3 - 0.00054125 * y ** 4 - 0.00029333 * y ** 5 + 0.00013558 * y ** 6;
  return f0 * Math.cos(t0) / Math.sqrt(ax);
}
const NR = 200;
function h2(u: number, v: number) { // |2∫ J0(vρ) e^{-iuρ²/2} ρdρ|²
  let re = 0, im = 0;
  for (let i = 0; i < NR; i++) { const r = (i + 0.5) / NR; const j = J0(v * r) * r; re += j * Math.cos(u * r * r / 2); im -= j * Math.sin(u * r * r / 2); }
  re *= 2 / NR; im *= 2 / NR; return re * re + im * im;
}
// tabulate f(u, v) on a v grid for interpolation
const DV = 0.05, VMAX = 60;
function table(u: number) { const n = Math.round(VMAX / DV) + 2; const t = new Float64Array(n); for (let i = 0; i < n; i++) t[i] = h2(u, i * DV); return t; }
const interp = (t: Float64Array, v: number) => { const x = v / DV; const i = Math.floor(x); if (i >= t.length - 1) return 0; const f = x - i; return t[i] * (1 - f) + t[i + 1] * f; };
const J11 = 3.8317059702;
// ∫_pinhole f(|c - w|) d²w, c distance of pinhole centre from point
function pinInt(t: Float64Array, c: number, p: number) {
  if (p === 0) return interp(t, c);
  const Ns = 40, Nphi = 48; let s = 0;
  for (let i = 0; i < Ns; i++) { const rr = p * (i + 0.5) / Ns; for (let k = 0; k < Nphi; k++) { const ph = 2 * Math.PI * (k + 0.5) / Nphi; s += interp(t, Math.hypot(c - rr * Math.cos(ph), rr * Math.sin(ph))) * rr; } }
  return s * (p / Ns) * (2 * Math.PI / Nphi);
}
function fwhm(f: (x: number) => number, x0: number, x1: number) { const f0 = f(0); let a = x0, b = x1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (f(m) > f0 / 2) a = m; else b = m; } return 2 * (a + b) / 2; }
for (const P of [0, 0.5, 1, 2]) {
  const p = J11 * P;
  const t0 = table(0);
  const lat = fwhm((v) => interp(t0, v) * pinInt(t0, v, p), 0, 5) / (2 * Math.PI); // in λ/NA
  const ax = fwhm((u) => { const t = table(u); return interp(t, 0) * pinInt(t, 0, p); }, 0, 30) / (4 * Math.PI); // u = 4π(n-√)z/λ
  const sec = P <= 1 ? fwhm((u) => { const t = table(u); let s = 0; const dr = 0.1; for (let r = dr / 2; r < 50; r += dr) s += interp(t, r) * pinInt(t, r, p) * r * dr; return s; }, 0, 40) / (4 * Math.PI) : NaN;
  const L = C.confocalLateralFwhm(1, 1, P), A = C.confocalAxialFwhm(1, 1.0, 1e-3, P) * (1 - Math.sqrt(1 - 1e-6)), S = C.confocalOpticalSectionFwhm(1, 1.0, 1e-3, P) * (1 - Math.sqrt(1 - 1e-6));
  console.log(`P=${P} lat mine ${lat.toFixed(4)} mod ${L.toFixed(4)} | ax mine ${ax.toFixed(4)} mod ${A.toFixed(4)} | sec mine ${sec.toFixed(4)} mod ${S.toFixed(4)}`);
}
console.log("throughput 1AU", C.pinholeThroughput(1), "expect 0.8378; pinholeAU(50um,63x,520nm,1.4)", C.pinholeAiryUnits(50e-6, 63, 520e-9, 1.4), "mine", 50e-6 / 63 / (1.22 * 520e-9 / 1.4));
