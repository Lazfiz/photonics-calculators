import * as MB from "../../../../src/physics/fiber-optics/macro-bending-loss";
import * as SM from "../../../../src/physics/fiber-optics/step-index-modes";
import * as GC from "../../../../src/physics/fiber-optics/gaussian-coupling";
const cmp = (name: string, mine: number, code: number) =>
  console.log(`${name.padEnd(40)} mine=${mine.toPrecision(6)} code=${code.toPrecision(6)} ratio=${(code / mine).toFixed(4)}`);
// own Bessel by quadrature
const quad = (f: (t: number) => number, a: number, b: number, n = 4000) => { let s = 0; const h = (b - a) / n; for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; };
const J = (n: number, x: number) => quad((t) => Math.cos(n * t - x * Math.sin(t)), 0, Math.PI) / Math.PI;
const K = (n: number, x: number) => quad((t) => Math.exp(-x * Math.cosh(t)) * Math.cosh(n * t), 0, 12, 6000);
function lp01(V: number) { // bisection on U in (0, min(V,2.4048))
  let lo = 1e-6, hi = Math.min(V, 2.404825) - 1e-9;
  const g = (U: number) => { const W = Math.sqrt(V * V - U * U); return U * J(1, U) / J(0, U) - W * K(1, W) / K(0, W); };
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; (g(lo) * g(m) <= 0) ? (hi = m) : (lo = m); }
  const U = (lo + hi) / 2; return { V, U, W: Math.sqrt(V * V - U * U) };
}
const f = { a: 4.1e-6, n1: 1.4494, NA: 0.1246 }, lam = 1550e-9;
const V = 2 * Math.PI * f.a * f.NA / lam;
cmp("V", V, MB.vNumber(f, lam));
cmp("lambda_c LP11", 2 * Math.PI * f.a * f.NA / 2.404825558, MB.lp11CutoffWavelength(f));
const m = lp01(V), mc = MB.lp01Mode(V);
cmp("U", m.U, mc.U); cmp("W", m.W, mc.W);
const wM = f.a * (0.65 + 1.619 * V ** -1.5 + 2.879 * V ** -6);
cmp("MFR Marcuse", wM, MB.modeFieldRadius(f, lam));
// Petermann II numerically: w^2 = 2 ∫ψ² r dr / ∫ψ'² r dr
const psi = (r: number) => r <= 1 ? J(0, m.U * r) : J(0, m.U) * K(0, m.W * r) / K(0, m.W);
const dpsi = (r: number) => r <= 1 ? -m.U * J(1, m.U * r) : -J(0, m.U) * m.W * K(1, m.W * r) / K(0, m.W);
const num = quad((r) => psi(r) ** 2 * r, 0, 1, 400) + quad((r) => psi(r) ** 2 * r, 1, 40, 4000);
const den = quad((r) => dpsi(r) ** 2 * r, 0, 1, 400) + quad((r) => dpsi(r) ** 2 * r, 1, 40, 4000);
const wP = f.a * Math.sqrt(2 * num / den);
cmp("MFR Petermann II", wP, SM.petermannIIRadius(f, lam));
cmp("MFR PII closed form a*sqrt2*J1(U)/(U J0)*V/W? (2a J1 V/(U W J0)) no-> check", f.a * Math.SQRT2 * V * J(1, m.U) / (m.U * m.W * J(0, m.U)), SM.petermannIIRadius(f, lam));
cmp("guided mode count V=2.07", 2, SM.guidedModeCount(V));
cmp("guided mode count V=5 (LP01,11,21,02 =2+4+4+2)", 12, SM.guidedModeCount(5));
cmp("asymptotic V^2/2 V=30", 450, SM.asymptoticModeCount(30));
const n2 = Math.sqrt(f.n1 ** 2 - f.NA ** 2), k = 2 * Math.PI / lam, b = (m.W / V) ** 2;
cmp("neff", Math.sqrt(n2 ** 2 + b * f.NA ** 2), SM.effectiveIndex(f, lam));
// Marcuse bend loss (Snyder-Love normalized form), R=15 mm
const bend = (R: number, mm = m) => { const D = f.NA ** 2 / (2 * f.n1 ** 2); return Math.sqrt(Math.PI) / (2 * f.a) * Math.sqrt(f.a / R) * mm.U ** 2 / (mm.V ** 2 * mm.W ** 1.5 * K(1, mm.W) ** 2) * Math.exp(-4 / 3 * (R / f.a) * D * mm.W ** 3 / mm.V ** 2); };
for (const R of [15e-3, 7.5e-3, 30e-3]) cmp(`bend alpha R=${R * 1e3}mm (SL, beta~n1k)`, bend(R), MB.bendLossCoefficient(f, lam, R));
cmp("per turn dB R=15mm", 10 / Math.LN10 * bend(15e-3) * 2 * Math.PI * 15e-3, MB.bendLossPerTurnDb(f, lam, 15e-3));
// elasto-optic: R_eff = R/(1-pe) ; pe=(n^2/2)[p12 - nu(p11+p12)], p11=0.113 p12=0.252 nu=0.16 -> check ~1.25-1.28
const pe = f.n1 ** 2 / 2 * (0.252 - 0.16 * (0.113 + 0.252));
cmp("Reff/R (p11=.113,p12=.252,nu=.16)", 1 / (1 - pe), MB.elastoOpticBendRadius(1, f.n1));
// out-of-domain probes
console.log("bend V>2.405 (lam=1200nm):", MB.bendLossPerTurnDb(f, 1200e-9, 15e-3), " lp01 V=3:", JSON.stringify(MB.lp01Mode(3)), " MFR V=3:", MB.modeFieldRadius(f, 1000e-9));
console.log("bend R=0.1mm:", MB.bendLossPerTurnDb(f, lam, 1e-4), " R=1mm:", MB.bendLossPerTurnDb(f, lam, 1e-3));
// Gaussian coupling (splice defaults)
const w = 4.5e-6, th = 0.5 * Math.PI / 180;
const eta = Math.exp(-((0.5e-6 / w) ** 2)) * Math.exp(-((Math.PI * 1.45 * w * th / lam) ** 2));
cmp("splice eta offset .5 tilt .5deg n1.45", eta, GC.gaussianCoupling({ w1: w, w2: w, lambda: lam, n: 1.45, offset: 0.5e-6, tilt: th }));
cmp("splice dB", -10 * Math.log10(eta), GC.lossDb(eta));
cmp("mismatch 9/10.4 MFD", (2 * 4.5 * 5.2 / (4.5 ** 2 + 5.2 ** 2)) ** 2, GC.gaussianCoupling({ w1: 4.5e-6, w2: 5.2e-6, lambda: lam }));
cmp("gap 50um n=1 w=4.5", 1 / (1 + (lam * 50e-6 / (2 * Math.PI * (4.5e-6) ** 2)) ** 2), GC.gaussianCoupling({ w1: w, w2: w, lambda: lam, n: 1, gap: 50e-6 }));
const R0 = ((1.447 - 1) / 2.447) ** 2;
cmp("Fresnel R", R0, GC.stepReflectance(1.447, 1));
cmp("RL dB", -10 * Math.log10(R0), GC.returnLossDb(R0));
const a8 = 8 * Math.PI / 180;
cmp("APC 8deg R (R0*exp(-(2pi n w th/lam)^2))", R0 * Math.exp(-((2 * Math.PI * 1.447 * 5.2e-6 * a8 / lam) ** 2)), GC.angledFaceReflectance(1.447, 1, a8, 5.2e-6, lam));
cmp("waist from NA (w=lam/(pi NA))", lam / (Math.PI * 0.22), GC.waistFromNA(0.22, lam));
