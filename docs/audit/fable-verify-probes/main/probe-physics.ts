// Verification of the Fable review fixes (2026-11-17): the key physics items, each against a closed form or a cited
// value typed in here, never against the code under test.
// Run on the tree under test from the repo root: npx tsx docs/audit/fable-verify-probes/main/probe-physics.ts
import { KERR_MEDIA } from "../../../../src/physics/materials/kerr-index";
import { slabPath } from "../../../../src/physics/spectroscopy/optical-path-length";
import * as T from "../../../../src/physics/free-space-comms/turbulence";
import { WINDOW_MATERIALS } from "../../../../src/physics/materials/window-materials";
import { pulseLimits } from "../../../../src/physics/laser-safety/pulse-train";
import { exposureLimit, eyeLimits, limitingAperture } from "../../../../src/physics/laser-safety/eye-exposure-limits";
import { findSchema } from "../../../../src/schemas/index";
import { parseInputs, runSchema } from "../../../../src/schemas/run";

const C = 299792458;
let bad = 0;
function row(name: string, ref: number, got: number | null | undefined, tol: number) {
  const g = got ?? NaN;
  const rel = Math.abs(g / ref - 1);
  const ok = rel <= tol;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "DIFF"} ${name.padEnd(62)} ref=${ref.toPrecision(7)} code=${Number.isFinite(g) ? g.toPrecision(7) : String(got)} rel=${rel.toExponential(1)}`);
}
function api(href: string, qs: string) {
  const s = findSchema(href)!;
  const p = parseInputs(s, new URLSearchParams(qs));
  if (!p.ok) throw new Error(`${href}?${qs}: ${p.error}`);
  return runSchema(s, p.values);
}

// ---------------------------------------------------------------- 1. CS2 n2 (P2-E1)
// Reference: Reichert et al., erratum Optica 3, 657 (2016), corrected Table 1 as quoted in the review (electronic 1.5,
// collision 1.0, libration 7.6, diffusive reorientation 18, all 1e-19 m^2/W). The PDF could not be opened in this session.
console.log("\n# 1. CS2 n2");
row("CS2 electronic n2 (m2/W)", 1.5e-19, KERR_MEDIA.cs2.n2, 1e-12);
row("CS2 long-pulse n2 (m2/W) = 1.5+1.0+7.6+18", 28.1e-19, KERR_MEDIA["cs2-long"].n2, 1e-12);

// ---------------------------------------------------------------- 2. Insertion OPD / delay (P2-W1)
// Reference: plane-parallel plate, OPD = d (sqrt(n^2 - sin^2 th) - cos th) (Born & Wolf 7.5.1). The group delay is the
// numerical derivative d/dw [w OPD(w)/c] with a dispersive toy index n(w) = n0 + s (w - w0), so n_g = n0 + w0 s.
console.log("\n# 2. optical-path-length, insertion");
{
  const d = 10e-3;
  for (const [deg, opdRef] of [[0, 5.0e-3], [30, 5.48188e-3], [60, 7.24745e-3]] as const) {
    const th = (deg * Math.PI) / 180;
    const opd = d * (Math.sqrt(1.5 ** 2 - Math.sin(th) ** 2) - Math.cos(th));
    row(`OPD closed form vs review table, ${deg} deg (m)`, opdRef, opd, 2e-6);
    row(`opdInsertion n=1.5, ${deg} deg (m)`, opd, slabPath(d, 1.5, 1.5, 1, th).opdInsertion, 1e-12);
    row(`insertionGroupDelay n=ng=1.5, ${deg} deg (s)`, opd / C, slabPath(d, 1.5, 1.5, 1, th).insertionGroupDelay, 1e-12);
    // dispersive: n0 = 1.45, n_g = 1.47
    const w0 = (2 * Math.PI * C) / 800e-9, n0 = 1.45, ng = 1.47, s = (ng - n0) / w0;
    const phase = (w: number) => (w * d * (Math.sqrt((n0 + s * (w - w0)) ** 2 - Math.sin(th) ** 2) - Math.cos(th))) / C;
    const h = w0 * 1e-6;
    const tau = (phase(w0 + h) - phase(w0 - h)) / (2 * h);
    row(`insertionGroupDelay n=1.45 ng=1.47, ${deg} deg (s), d(phase)/dw`, tau, slabPath(d, n0, ng, 1, th).insertionGroupDelay, 1e-8);
  }
  const r = api("/spectroscopy/optical-path-length", "");
  console.log("   API output keys:", Object.keys(r.outputs).join(","));
}

// ---------------------------------------------------------------- 3. Gamma-gamma fades (P1-W1)
// Reference: Andrews & Phillips 2005 ch. 9 / Al-Habash 2001, plane wave. alpha = 1/(exp(s_lnX^2) - 1),
// beta = 1/(exp(s_lnY^2) - 1), s_lnX^2 = 0.49 sR2/(1 + 0.65 d2 + 1.11 sR^(12/5))^(7/6),
// s_lnY^2 = 0.51 sR2 (1 + 0.69 sR^(12/5))^(-5/6)/(1 + 0.90 d2 + 0.62 d2 sR^(12/5)), d2 = k D^2/(4L).
// I = X Y with X ~ Gamma(alpha, 1/alpha), Y ~ Gamma(beta, 1/beta): P(I < F) = E_X[P(Y < F/X)], by quadrature here
// (own log-gamma and own incomplete gamma), no Bessel function and no module code.
console.log("\n# 3. scintillation, gamma-gamma fade probability");
function lgamma(x: number): number {
  const g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = g[0];
  for (let i = 1; i < 9; i++) a += g[i] / (x + i);
  const t = x + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
/** Regularized lower incomplete gamma P(a, x) by its series (x < a + 1) or continued fraction. */
function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a, term = 1 / a;
    for (let n = 1; n < 2000; n++) { term *= x / (a + n); sum += term; if (term < sum * 1e-16) break; }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  let b = x + 1 - a, c = 1e300, dd = 1 / b, h = dd;
  for (let i = 1; i < 2000; i++) {
    const an = -i * (i - a);
    b += 2; dd = an * dd + b; if (Math.abs(dd) < 1e-300) dd = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    dd = 1 / dd; const del = dd * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}
function ggCdf(F: number, alpha: number, beta: number): number {
  // X = u/alpha with u ~ Gamma(alpha, 1): integrate over ln u on a wide grid.
  const n = 40000, lo = Math.log(alpha) - 40, hi = Math.log(alpha) + 12, dx = (hi - lo) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const lu = lo + i * dx, u = Math.exp(lu);
    const pdf = Math.exp(alpha * lu - u - lgamma(alpha)); // density in ln u
    const w = i === 0 || i === n ? 0.5 : 1;
    sum += w * pdf * gammaP(beta, (beta * F * alpha) / u);
  }
  return sum * dx;
}
function ggParams(sR2: number, d2: number) {
  const s125 = Math.pow(sR2, 6 / 5);
  const x = (0.49 * sR2) / Math.pow(1 + 0.65 * d2 + 1.11 * s125, 7 / 6);
  const y = (0.51 * sR2 * Math.pow(1 + 0.69 * s125, -5 / 6)) / (1 + 0.9 * d2 + 0.62 * d2 * s125);
  return { alpha: 1 / (Math.exp(x) - 1), beta: 1 / (Math.exp(y) - 1) };
}
for (const [cn2, L, D] of [[1.7e-14, 1000, 0.1], [1.7e-13, 1000, 0], [1.7e-13, 5000, 0], [1.7e-13, 5000, 0.1]] as const) {
  const lam = 1550e-9, k = (2 * Math.PI) / lam;
  const sR2 = 1.23 * cn2 * Math.pow(k, 7 / 6) * Math.pow(L, 11 / 6);
  const { alpha, beta } = ggParams(sR2, (k * D * D) / (4 * L));
  const tag = `Cn2=${cn2} L=${L} D=${D} (sR2=${sR2.toFixed(3)})`;
  row(`physics gammaGammaCdf -3 dB, ${tag}`, ggCdf(10 ** -0.3, alpha, beta), T.gammaGammaCdf(10 ** -0.3, ...Object.values(T.gammaGammaParameters(T.rytovVariance(cn2, lam, L), T.apertureParameter(lam, L, D))) as [number, number]), 1e-4);
  const r = api("/free-space-comms/scintillation", `cz=${cn2}&distance=${L / 1000}&apertureDiameter=${D}`);
  row(`API fade3dBGammaGamma, ${tag}`, ggCdf(10 ** -0.3, alpha, beta), r.outputs.fade3dBGammaGamma, 1e-4);
  row(`API fade10dBGammaGamma, ${tag}`, ggCdf(0.1, alpha, beta), r.outputs.fade10dBGammaGamma, 1e-4);
  console.log(`   log-normal card: ${r.outputs.fade3dB?.toExponential(3)} / ${r.outputs.fade10dB?.toExponential(3)}; warnings: ${r.warnings.length ? r.warnings.map((w) => w.slice(0, 70)).join(" | ") : "(none)"}`);
}
console.log("   scintillation inputs:", findSchema("/free-space-comms/scintillation")!.inputs.map((i) => `${i.key}[${i.unit}]`).join(" "));

// ---------------------------------------------------------------- 4. Fused-silica dn/dT (P2-M9, P2-M10)
// Reference: Malitson, JOSA 55, 1205 (1965): dn/dT relative to air about +10.0e-6 /K in the visible (the review quotes
// 9.5-10e-6). Absolute = relative + n dn_air/dT, with dn_air/dT = -(n_air - 1)/T = -2.7e-4/293 K = -0.92e-6 /K.
// So the absolute value should be near 10.0e-6 - 1.458 * 0.92e-6 = 8.66e-6 /K (Leviton & Frey 2006 Table 6 print 8.86e-6 at 0.6 um).
console.log("\n# 4. dn/dT presets");
row("fused silica dn/dT absolute (1/K), Malitson relative 10.0e-6 - n dn_air/dT", 10.0e-6 - 1.458 * (2.7e-4 / 293), WINDOW_MATERIALS.fusedSilica.dnDT, 0.05);
console.log("   quartz window dn/dT:", WINDOW_MATERIALS.quartz.dnDT, "(Crystran: n_o -5.5e-6, n_e -6.5e-6)");

// ---------------------------------------------------------------- 5. Laser safety closed forms
// ICNIRP 2013 (Health Phys. 105, 271) Tables 5, 7, 8 and p. 287; IEC 60825-1:2014 Tables 3-8 (AEL, two-figure values).
console.log("\n# 5. laser safety");
const A7 = Math.PI * (3.5e-3) ** 2;
{
  // 5a. AEL page (IEC values as energies through the 7 mm stop; ICNIRP form x aperture, IEC prints it to 2 figures).
  let r = api("/laser-safety/ael-limits", "wavelength=532&emissionDuration=1e-8&alpha=0");
  row("AEL Class 1, 532 nm 10 ns: 2e-3 J/m2 x A7 (IEC prints 7.7e-8 J)", 2e-3 * A7, r.si.energy1, 1e-9);
  row("AEL Class 3B, 532 nm 10 ns: 0.03 J (IEC Table 8)", 0.03, r.si.energy3B, 1e-9);
  r = api("/laser-safety/ael-limits", "wavelength=905&emissionDuration=1e-7&alpha=0");
  row("AEL Class 1, 905 nm 100 ns: 2e-3 C_A J/m2 x A7, C_A = 10^0.41", 2e-3 * 10 ** 0.41 * A7, r.si.energy1, 1e-9);
  r = api("/laser-safety/ael-limits", "wavelength=1064&emissionDuration=1e-8&alpha=0");
  row("AEL Class 1, 1064 nm 10 ns: 2e-2 C_C J/m2 x A7 (IEC 7.7e-7 J)", 2e-2 * A7, r.si.energy1, 1e-9);
  row("AEL Class 3B, 1064 nm 10 ns: 0.15 J", 0.15, r.si.energy3B, 1e-9);
  r = api("/laser-safety/ael-limits", "wavelength=1550&emissionDuration=10&alpha=0");
  row("AEL Class 1 CW, 1550 nm: 1000 W/m2 x pi(1.75 mm)^2 (IEC prints 10 mW)", 1000 * Math.PI * (1.75e-3) ** 2, r.si.cw1, 1e-9);
  row("AEL Class 3B CW, 1550 nm: 0.5 W", 0.5, r.si.cw3B, 1e-9);
  r = api("/laser-safety/ael-limits", "wavelength=633&emissionDuration=0.25&alpha=0");
  row("AEL Class 2, 633 nm 0.25 s: 18 t^0.75 J/m2 x A7 (IEC: 1 mW x 0.25 s)", 18 * 0.25 ** 0.75 * A7, r.si.energy2, 0.03);
  console.log(`   Class 2 energy at 0.25 s: code ${r.si.energy2}; IEC form 1 mW x t = 2.5e-4 J; ICNIRP form ${(18 * 0.25 ** 0.75 * A7).toExponential(4)} J`);
  r = api("/laser-safety/ael-limits", "wavelength=1310&emissionDuration=1&alpha=0");
  console.log(`   1310 nm, 1 s (main: euA11 toggle): energy1=${r.si.energy1} cw1=${r.si.cw1} cw3R=${r.si.cw3R}`);
}
{
  // 5b. Sub-ns skin/anterior-segment limit (laser-safety M3). ICNIRP 2013 Table 7: skin 200 C_A J/m2 at 1-100 ns,
  // C_A = 5 at 1050-1400 nm; Table 5 note d as coded: twice the skin limit for the eye in the infrared. Below 1 ns,
  // p. 287: interim 10 % of the 1 ns limit. Expected at 1350 nm: 2000 J/m2 at 1 ns, 200 J/m2 at 500 ps.
  const ant = pulseLimits(1350e-9).find((l) => l.kind === "anteriorSegment");
  if (!ant) console.log("   no anteriorSegment limit at 1350 nm");
  else {
    row("anterior segment 1350 nm, 1 ns: 2 x 200 C_A (J/m2)", 2000, exposureLimit(ant, 1e-9), 1e-9);
    row("anterior segment 1350 nm, 500 ps: 10 % of the 1 ns limit (J/m2)", 200, exposureLimit(ant, 0.5e-9), 1e-9);
    row("anterior segment 1350 nm, 50 ps: held irradiance 2e12 W/m2 x t (J/m2)", 100, exposureLimit(ant, 0.05e-9), 1e-9);
  }
  const cor = pulseLimits(1550e-9).find((l) => l.kind === "cornealIr");
  if (cor) row("cornea 1550 nm, 500 ps: 10 % of 1e4 J/m2", 1e3, exposureLimit(cor, 0.5e-9), 1e-9);
  // The ultrafast page at 1350 nm, 500 ps single pulse: which limit binds on a 1 mm beam?
  const u = findSchema("/laser-safety/ultrafast-laser-safety");
  if (u) console.log("   ultrafast inputs:", u.inputs.map((i) => `${i.key}[${i.unit}]=${i.default}`).join(" "));
}
{
  // 5c. Limiting aperture at exactly 10 s, 1550 nm (ICNIRP Table 8: 1.5 t^0.375 mm for 0.35 s < t < 10 s, 3.5 mm for t >= 10 s).
  const lim = eyeLimits(1550e-9).find((l) => l.kind === "cornealIr")!;
  row("corneal aperture at t = 10 s exactly (m), Table 8: 3.5 mm", 3.5e-3, limitingAperture(lim, 10), 1e-9);
  row("corneal aperture at t = 9.999 s (m): 1.5 t^0.375 mm", 1.5e-3 * 9.999 ** 0.375, limitingAperture(lim, 9.999), 1e-9);
}
{
  // 5d. Scanning MPE: own simulation. A Gaussian beam (1/e2 diameter d) crosses the centre of a round aperture D at
  // speed v. Power fraction through the aperture f(x); pass energy per watt Q1 = (1/v) Int f dx; pass duration = FWHM of f.
  // Rule 1: Q1 P <= H(tau) A(D(tau)). Rule 2: for every n = 1..N, n Q1 P <= H(T_n) A, T_n = (n-1)/rate + tau.
  // Rule 3: C_P = 1 (alpha <= 5 mrad). The aperture is the one of the duration tested.
  const frac = (d: number, D: number, x: number) => {
    const w = d / 2, R = D / 2, n = 400;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const y = -R + ((i + 0.5) * 2 * R) / n, half = Math.sqrt(R * R - y * y);
      // 1-D integral in x' of the Gaussian over the chord, by erf
      const a = Math.SQRT2 / w;
      s += Math.sqrt(2 / Math.PI) / w * Math.exp((-2 * y * y) / (w * w)) * 0.5 * (erf(a * (x + half)) - erf(a * (x - half))) * ((2 * R) / n);
    }
    return s;
  };
  function erf(z: number): number {
    const t = 1 / (1 + 0.3275911 * Math.abs(z));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return z >= 0 ? y : -y;
  }
  const pass = (d: number, D: number, v: number) => {
    const span = D / 2 + 2 * d, n = 4000, dx = (2 * span) / n;
    let integral = 0;
    const f0 = frac(d, D, 0);
    let half = 0;
    for (let i = 0; i <= n; i++) {
      const x = -span + i * dx, f = frac(d, D, x);
      integral += f * dx * (i === 0 || i === n ? 0.5 : 1);
      if (x >= 0 && half === 0 && f < f0 / 2) half = x - dx * ((f0 / 2 - f) / (frac(d, D, x - dx) - f));
    }
    return { q1: integral / v, tau: (2 * half) / v };
  };
  const cases: { name: string; qs: string; lam: number; d: number; v: number; rate: number; T: number }[] = [
    { name: "532 nm default (2 mm at eye, 0.25 s)", qs: "", lam: 532, d: 2e-3, v: 2 * (Math.PI / 6) * 100 * 1, rate: 200, T: 0.25 },
    { name: "1550 nm, 10 s", qs: "wavelength=1550", lam: 1550, d: 2e-3, v: 2 * (Math.PI / 6) * 100 * 1, rate: 200, T: 10 },
    { name: "905 nm, 10 deg, 10 Hz one way, 0.5 m, 10 s", qs: "wavelength=905&scanAngle=10&scanRate=10&scanDirection=one&workingDistance=50", lam: 905, d: 1.5e-3, v: (Math.PI / 18) * 10 * 0.5, rate: 10, T: 10 },
  ];
  for (const c of cases) {
    const retinal = c.lam >= 400 && c.lam < 1400;
    const CA = c.lam < 700 ? 1 : 10 ** (0.002 * (c.lam - 700));
    const H = (t: number) => (retinal ? (t < 5e-6 ? 2e-3 * CA : t <= 10 ? 18 * CA * t ** 0.75 : NaN) : 1e4); // 1500-1800 nm: 10 kJ/m2 to 10 s
    const Dap = (t: number) => (retinal ? 7e-3 : t <= 0.35 ? 1e-3 : t < 10 ? 1.5e-3 * t ** 0.375 : 3.5e-3);
    let pMax = Infinity, rule = 0, tauBind = 0;
    const N = Math.floor((c.T - 1e-4) * c.rate + 1e-9) + 1;
    const cache = new Map<number, { q1: number; tau: number }>();
    const passAt = (D: number) => { const k = Math.round(D * 1e9); if (!cache.has(k)) cache.set(k, pass(c.d, D, c.v)); return cache.get(k)!; };
    // rule 1 (self-consistent tau for the corneal aperture: tau << 0.35 s so D = 1 mm)
    const p1 = passAt(Dap(1e-4));
    const r1 = (H(p1.tau) * Math.PI * Dap(p1.tau) ** 2) / 4 / p1.q1;
    pMax = r1; rule = 1; tauBind = p1.tau;
    const ns = new Set<number>([N]);
    for (let n = 2; n < N; n = Math.ceil(n * 1.07)) ns.add(n);
    for (const n of ns) {
      const Tn = n === N ? c.T : (n - 1) / c.rate + p1.tau;
      const D = Dap(Tn), p = retinal ? p1 : passAt(D);
      const lim = (H(Math.min(Tn, 10)) * Math.PI * D * D) / 4 / (n * p.q1);
      if (lim < pMax) { pMax = lim; rule = 2; tauBind = p.tau; }
    }
    if (!retinal) {
      // The same rule 2 with the train length (N - 1)/rate + tau = 9.995 s instead of the exposure T = 10 s: Table 8 then
      // gives the 1.5 t^0.375 = 3.556 mm aperture, not 3.5 mm.
      const Tn = (N - 1) / c.rate + p1.tau, D = 1.5e-3 * Tn ** 0.375, p = passAt(D);
      console.log(`   rule 2 at the train length ${Tn.toFixed(4)} s, aperture ${(D * 1e3).toFixed(3)} mm: ${((1e4 * Math.PI * D * D) / 4 / (N * p.q1)).toFixed(4)} W; at T = 10 s, 3.5 mm: ${pMax.toFixed(4)} W`);
    }
    const r = api("/laser-safety/scanning-mpe", c.qs);
    row(`scanned P_max, ${c.name} (W)`, pMax, r.si.maxPowerScanned, 0.01);
    console.log(`   mine: rule ${rule}, pass ${(tauBind * 1e6).toFixed(1)} us, ${N} passes | code: rule ${r.outputs.bindingRule}, pass ${r.outputs.passDuration?.toFixed(1)} us, ${r.outputs.passes} passes, T=${r.outputs.exposureUsed} s`);
    // held still: P <= H(T)/T x aperture area / fraction through it
    const D = Dap(c.T), still = ((H(c.T) / c.T) * Math.PI * D * D) / 4 / (1 - Math.exp((-2 * D * D) / (c.d * c.d)));
    row(`held still P_max, ${c.name} (W)`, still, r.si.maxPowerStationary, 0.002);
  }
}
{
  // 5e. NOHD near threshold (laser-safety U1): 2.2 mW, 532 nm, 5 mm, 1 mrad, 0.25 s. Limit 18 t^0.75 / t = 25.456 W/m2
  // over 7 mm. Gaussian growth d(r) = sqrt(a^2 + (r phi)^2); the NOHD is where P (1 - exp(-2 D^2/d^2)) = limit x A7.
  const need = (18 * 0.25 ** 0.75) / 0.25 * A7 / 2.2e-3; // fraction through 7 mm at the NOHD
  const dAt = Math.sqrt((-2 * 49e-6) / Math.log(1 - need));
  const gauss = Math.sqrt(dAt ** 2 - 25e-6) / 1e-3, linear = (dAt - 5e-3) / 1e-3;
  const r = api("/laser-safety/nohd", "power=2.2&wavelength=532&exposure=0.25&beamDia=5&divergence=1");
  row("NOHD default growth = Gaussian (m)", gauss, r.si.nohd, 1e-4);
  const rl = api("/laser-safety/nohd", "power=2.2&wavelength=532&exposure=0.25&beamDia=5&divergence=1&beamGrowth=linear");
  row("NOHD linear option (m)", linear, rl.si.nohd, 1e-4);
  console.log("   nohd inputs:", findSchema("/laser-safety/nohd")!.inputs.map((i) => `${i.key}[${i.unit}]=${i.default}`).join(" "));
}
{
  // 5f. Classification E1 (stopgap): 1550 nm, 30 mm beam, 0.1 mrad. With a 7x telescope stop of 24.5 mm at 2 m (from the
  // audit, IEC Table 10 from memory) 100 mW would be 1M and 1 W would be 4. What does the API say?
  for (const p of [100, 1000]) {
    const r = api("/laser-safety/classification", `wavelength=1550&power=${p}&beamDia=30&divergence=0.1`);
    console.log(`   classification 1550 nm 30 mm ${p} mW: rank ${r.outputs.classRank}, class1Max ${r.outputs.class1Max?.toFixed(1)} mW, warnings: ${r.warnings.map((w) => w.slice(0, 60)).join(" | ") || "(none)"}`);
  }
  console.log("   classification inputs:", findSchema("/laser-safety/classification")!.inputs.map((i) => `${i.key}[${i.unit}]=${i.default}`).join(" "));
}
console.log(`\n${bad} DIFF rows`);
