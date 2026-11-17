// Lead probes, fibre optics: own Bessel functions (integral representations), own ODE integration.
import { lp01Mode, bendLossCoefficient, modeFieldRadius, DB_PER_E_FOLD } from "../../../../src/physics/fiber-optics/macro-bending-loss";
import { petermannIIRadius, guidedModeCount } from "../../../../src/physics/fiber-optics/step-index-modes";
import { amplifier, coreOverlap } from "../../../../src/physics/fiber-optics/doped-fiber-gain";
import { uniformReflectance, peakReflectance, strainGaugeFactor, effectivePhotoelastic } from "../../../../src/physics/fiber-optics/fiber-bragg-grating";
import { sbsThreshold, srsThreshold, effectiveLength, alphaFromDbPerKm, fwmEfficiency } from "../../../../src/physics/fiber-optics/fiber-nonlinear";
import { dgdExceedanceProbability } from "../../../../src/physics/fiber-optics/polarization-mode-dispersion";

const row = (name: string, mine: number, code: number) =>
  console.log(name.padEnd(50), mine.toExponential(6), code.toExponential(6), (code / mine).toFixed(6));

const simpson = (f: (x: number) => number, a: number, b: number, n = 4000) => {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
};
const J = (nu: number, x: number) => simpson((t) => Math.cos(nu * t - x * Math.sin(t)), 0, Math.PI, 2000) / Math.PI;
const K = (nu: number, x: number) => simpson((t) => Math.exp(-x * Math.cosh(t)) * Math.cosh(nu * t), 0, 12, 6000);

// 1. LP01 eigenvalue: bisection on U J1(U)/J0(U) = W K1(W)/K0(W).
function myLp01(V: number) {
  let lo = 1e-6, hi = Math.min(V, 2.4048) - 1e-9;
  const g = (u: number) => { const w = Math.sqrt(V * V - u * u); return (u * J(1, u)) / J(0, u) - (w * K(1, w)) / K(0, w); };
  for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (g(m) > 0) hi = m; else lo = m; }
  const U = 0.5 * (lo + hi); return { U, W: Math.sqrt(V * V - U * U) };
}
for (const V of [1.2, 2.0, 2.4, 3.5]) row(`LP01 U at V=${V}`, myLp01(V).U, lp01Mode(V).U);

// 2. Marcuse bend loss: SMF-like a = 4.1 µm, n1 = 1.4494, NA = 0.12 (the repo's ROADMAP quotes 2.62 dB/turn at R = 10 mm, with the elasto-optic R_eff?)
{
  const f = { a: 4.1e-6, n1: 1.4494, NA: 0.12 }, lam = 1550e-9;
  for (const R of [5e-3, 10e-3, 15e-3]) {
    const V = (2 * Math.PI * f.a * f.NA) / lam, { U, W } = myLp01(V), k = (2 * Math.PI) / lam;
    const kap = U / f.a, gam = W / f.a, b2 = (f.n1 * k) ** 2 - kap ** 2;
    const mine = (Math.sqrt(Math.PI) * kap ** 2 * Math.exp((-2 * gam ** 3 * R) / (3 * b2))) / (2 * gam ** 1.5 * V ** 2 * Math.sqrt(R) * K(1, W) ** 2);
    row(`bend α (1/m) R=${R * 1e3} mm`, mine, bendLossCoefficient(f, lam, R));
    console.log("   dB/turn:", DB_PER_E_FOLD * mine * 2 * Math.PI * R);
  }
  // 3. Petermann II: w² = 2 ∫E² r dr / ∫E'² r dr
  for (const a of [4.1e-6, 3e-6, 6e-6]) {
    const ff = { ...f, a }, V = (2 * Math.PI * a * f.NA) / lam, { U, W } = myLp01(V);
    const E = (r: number) => (r <= 1 ? J(0, U * r) / J(0, U) : K(0, W * r) / K(0, W));
    const dE = (r: number) => (r <= 1 ? (-U * J(1, U * r)) / J(0, U) : (-W * K(1, W * r)) / K(0, W));
    const num = simpson((r) => E(r) ** 2 * r, 0, 1, 400) + simpson((r) => E(r) ** 2 * r, 1, 1 + 40 / W, 2000);
    const den = simpson((r) => dE(r) ** 2 * r, 0, 1, 400) + simpson((r) => dE(r) ** 2 * r, 1, 1 + 40 / W, 2000);
    row(`Petermann II w (m) a=${a * 1e6} µm V=${V.toFixed(3)}`, a * Math.sqrt((2 * num) / den), petermannIIRadius(ff, lam));
    console.log("   Marcuse w:", modeFieldRadius(ff, lam), " Γ core (mine):", simpson((r) => E(r) ** 2 * r, 0, 1, 400) / num, " code:", coreOverlap(ff, lam));
  }
}
console.log("mode count V=2.3, 2.5, 3.9, 10:", [2.3, 2.5, 3.9, 10].map(guidedModeCount), " (expect 2, 6, 12 incl. pol/deg; V²/2=50)");

// 4. EDFA: integrate the Giles–Desurvire rate equations directly (RK4) and compare with the Saleh closed form.
{
  const hc = 6.62607015e-34 * 299792458;
  const fiber = { N: 1e25, area: Math.PI * (1.5e-6) ** 2, tau: 10e-3 };
  const beams = [
    { lambda: 980e-9, sigmaA: 2.0e-25, sigmaE: 0, overlap: 0.8, power: 50e-3 },
    { lambda: 1550e-9, sigmaA: 2.5e-25, sigmaE: 3.5e-25, overlap: 0.6, power: 1e-6 },
  ];
  for (const L of [3, 10, 25]) {
    const n = 20000, dz = L / n; let P = beams.map((b) => b.power); let ase = 0, Gz = 1;
    const inv = (p: number[]) => {
      let num = 0, den = 1 / fiber.tau;
      p.forEach((pw, k) => { const b = beams[k], r = (b.overlap * pw * b.lambda) / (hc * fiber.area); num += r * b.sigmaA; den += r * (b.sigmaA + b.sigmaE); });
      return num / den;
    };
    const d = (p: number[]) => { const n2 = inv(p); return p.map((pw, k) => beams[k].overlap * fiber.N * (beams[k].sigmaE * n2 - beams[k].sigmaA * (1 - n2)) * pw); };
    for (let i = 0; i < n; i++) {
      const n2a = inv(P), Ga = P[1] / beams[1].power;
      const k1 = d(P), k2 = d(P.map((p, j) => p + 0.5 * dz * k1[j])), k3 = d(P.map((p, j) => p + 0.5 * dz * k2[j])), k4 = d(P.map((p, j) => p + dz * k3[j]));
      P = P.map((p, j) => p + (dz / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      const n2b = inv(P), Gb = P[1] / beams[1].power;
      ase += 0.5 * dz * beams[1].overlap * beams[1].sigmaE * fiber.N * (n2a / Ga + n2b / Gb); Gz = Gb;
    }
    const r = amplifier(fiber, beams, L, 1);
    row(`EDFA gain L=${L} m`, Gz, r.gain);
    row(`EDFA NF  L=${L} m (dB ${(10 * Math.log10((1 + 2 * Gz * ase) / Gz)).toFixed(3)})`, (1 + 2 * Gz * ase) / Gz, r.noiseFigure);
  }
}

// 5. FBG: closed form, with my own coupled-mode solution r = -κ sinh(γL)/(σ sinh γL + iγ cosh γL).
for (const [kL, sL] of [[1, 0], [2, 1], [2, 3], [0.3, 5]] as const) {
  let R: number;
  if (kL > sL) { const g = Math.sqrt(kL * kL - sL * sL); R = Math.sinh(g) ** 2 / (Math.cosh(g) ** 2 - (sL * sL) / (kL * kL)); }
  else { const g = Math.sqrt(sL * sL - kL * kL); R = Math.sin(g) ** 2 / ((sL * sL) / (kL * kL) - Math.cos(g) ** 2); }
  row(`FBG R κL=${kL} σL=${sL}`, R, uniformReflectance(kL, sL));
}
row("FBG peak tanh²(3)", Math.tanh(3) ** 2, peakReflectance(3));
{ const n = 1.4682, pe = (n * n / 2) * (0.252 - 0.16 * (0.113 + 0.252)); row("p_e", pe, effectivePhotoelastic(n)); row("gauge 1-p_e", 1 - pe, strainGaugeFactor(n)); }

// 6. SBS / SRS thresholds: SMF, A_eff 80 µm², 0.2 dB/km, 20 km.
{
  const a = 0.2 / 4.342944819 / 1e3, L = 20e3, Leff = (1 - Math.exp(-a * L)) / a;
  row("L_eff 20 km", Leff, effectiveLength(alphaFromDbPerKm(0.2), L));
  row("SBS P_th K=1 (W)", (21 * 80e-12) / (5e-11 * Leff), sbsThreshold({ Aeff: 80e-12, gB: 5e-11, Leff }));
  row("SRS P_th K=1 (W)", (16 * 80e-12) / (6.45e-14 * Leff), srsThreshold(80e-12, 6.45e-14, Leff));
  // FWM efficiency brute: |∫ e^{(-α+iΔβ)z}dz|² / Leff²
  const db = 2e-4; let re = 0, im = 0; const n = 200000, dz = L / n;
  for (let i = 0; i < n; i++) { const z = (i + 0.5) * dz, e = Math.exp(-a * z); re += e * Math.cos(db * z) * dz; im += e * Math.sin(db * z) * dz; }
  row("FWM η brute", (re * re + im * im) / Leff ** 2, fwmEfficiency(a, L, db));
}
// 7. PMD Maxwell tail by numeric integration of the pdf.
{
  const mean = 1, s = mean * Math.sqrt(Math.PI / 8);
  const tail = simpson((x) => Math.sqrt(2 / Math.PI) * (x * x / s ** 3) * Math.exp(-x * x / (2 * s * s)), 3, 12, 20000);
  row("P(DGD > 3 mean)", tail, dgdExceedanceProbability(3, 1));
}
