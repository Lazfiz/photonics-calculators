import test from "node:test";
import assert from "node:assert/strict";

import { c } from "../src/physics/constants";
import {
  DIATOMICS, forceConstant, isotopologue, mostPopulatedJ, reducedMass, rotationalConstant, rotationalConstantV,
  rotationalLines, rotationalPartition, rovibrationalBand, vibrationalTerm,
} from "../src/physics/spectroscopy/diatomic";
import { imfpTpp2m, kineticEnergy, samplingDepth, TPP2M_MATERIALS } from "../src/physics/spectroscopy/photoemission";
import {
  absorptionCoefficient, complexIndex, constantPermittivity, extractIndex, lorentzPermittivity, maxAbsorption,
  slabTransmission, slabTransmissionPolar, waterPermittivity,
} from "../src/physics/spectroscopy/terahertz";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

/** JPL catalogue intensity unit nm²·MHz per HITRAN cm/molecule (Pickett et al. 1998). */
const JPL = 2.99792458e18;

test("CO rotational constants, lines, partition function and intensities against NIST and JPL", () => {
  const co = DIATOMICS.co;
  // NIST WebBook (Huber & Herzberg): B_e = 1.93128087 cm⁻¹ for r_e = 1.128323 Å
  close(rotationalConstant(reducedMass(co.m1, co.m2), co.re) / 100, 1.93128087, 3e-6);
  // the audit's case: μ = 6.856 u, r = 1.128 Å gives 1.9324 cm⁻¹ (the old page used 14 u)
  close(rotationalConstant(6.856 * 1.66053906892e-27, 1.128e-10) / 100, 1.9324, 1e-4);
  const B0 = rotationalConstantV(co, 0);
  // JPL catalogue 28001: B₀ = 57635.968 MHz; J = 1←0 at 115271.2018 MHz, 2←1 at 230538.0000 MHz
  close((B0 * c) / 1e6, 57635.968, 1e-6);
  const lines = rotationalLines(B0, co.De, co.dipole, 300);
  close((lines[0].sigma * c) / 1e6, 115271.2018, 1e-6);
  close((lines[1].sigma * c) / 1e6, 230538.0, 1e-6);
  // JPL: Q(300 K) = 108.865, Q(9.375 K) = 3.744
  close(rotationalPartition(B0, co.De, 300), 108.865, 1e-4);
  close(rotationalPartition(B0, co.De, 9.375), 3.744, 1e-3);
  // JPL log₁₀ I(300 K, nm² MHz): −5.0105 (1←0), −4.1197 (2←1), −3.6118 (3←2), with μ = 0.11011 D
  [-5.0105, -4.1197, -3.6118].forEach((logI, J) =>
    assert.ok(Math.abs(Math.log10(lines[J].S * 100 * JPL) - logI) < 1e-3, `J=${J} ${Math.log10(lines[J].S * 100 * JPL)}`));
  // populations sum to 1; the strongest line (J = 12 → 13) lies above the most populated level (J = 7)
  close(lines.reduce((s, l) => s + l.population, 0), 1, 1e-7); // lines stop at 10⁻⁶ of the strongest
  assert.equal(mostPopulatedJ(B0, 300), 7);
  assert.equal(lines.reduce((a, b) => (b.S > a.S ? b : a)).J, 12);
  // edge cases: no lines at T = 0, no B for zero mass
  assert.equal(rotationalLines(B0, co.De, co.dipole, 0).length, 0);
  assert.ok(Number.isNaN(rotationalConstant(0, co.re)));
  // μ_d = 0 lists the same lines with S = 0 (the cut-off does not depend on μ_d)
  const nodip = rotationalLines(B0, co.De, 0, 300);
  assert.equal(nodip.length, lines.length);
  assert.ok(nodip.every((l) => l.S === 0));
  // the partition sum must converge before the J cap: B = 0.01 cm⁻¹ at 3000 K needs J ≈ 2500 > 1000
  assert.ok(Number.isNaN(rotationalPartition(1, 0, 3000)));
  // CO band origins, hand calculation from the NIST WebBook constants (footnote: ω_e y_e = +0.010511,
  // ω_e z_e = +5.74·10⁻⁵ cm⁻¹): ΔG = vω_e − v(v+1)ω_e x_e + [(v+½)³ − ⅛]ω_e y_e + [(v+½)⁴ − 1/16]ω_e z_e
  //   v = 1: 2169.81358 − 26.57662 + 0.03416075 + 0.000287 = 2143.27141 cm⁻¹
  //   v = 2: 4339.62716 − 79.72986 + 0.16292 + 0.0022386 = 4260.06246 cm⁻¹
  close((vibrationalTerm(1, co) - vibrationalTerm(0, co)) / 100, 2143.27141, 1e-8);
  close((vibrationalTerm(2, co) - vibrationalTerm(0, co)) / 100, 4260.06246, 1e-8);
});

test("HCl: microwave line, force constant and the infrared fundamental with its isotope doublet", () => {
  const hcl = DIATOMICS.hcl;
  const mu = reducedMass(hcl.m1, hcl.m2);
  close(rotationalConstant(mu, hcl.re) / 100, 10.59341, 1e-5); // NIST B_e from r_e = 1.27455 Å
  // JPL 36001: J = 1←0 hyperfine components 625901.603/625918.756/625932.007 MHz, log I −1.3013/−1.1252/−1.6023
  const line = rotationalLines(rotationalConstantV(hcl, 0), hcl.De, hcl.dipole, 300)[0];
  close((line.sigma * c) / 1e6, 625918.756, 5e-5);
  const sum = [-1.3013, -1.1252, -1.6023].reduce((s, l) => s + 10 ** l, 0);
  close(line.S * 100 * JPL, sum, 0.01); // the partition function here leaves out the 4-fold ³⁵Cl spin degeneracy
  // k = μ(2πcω_e)² = 516.3 N/m (hand calculation; Atkins' Physical Chemistry quotes 516 N/m)
  close(forceConstant(mu, hcl.we), 516.3, 2e-4);
  // band origin ω_e − 2ω_e x_e + 3.25 ω_e y_e + 5 ω_e z_e (NIST: ω_e z_e = −0.0121 cm⁻¹, Rank et al. 1965)
  //   = 2990.946 − 105.6372 + 0.728975 − 0.0605 = 2885.977275 cm⁻¹; R(0) = ν₀ + 2B₁ − 4D, P(1) = ν₀ − 2B₀ + 4D
  const nu0 = vibrationalTerm(1, hcl) - vibrationalTerm(0, hcl);
  close(nu0 / 100, 2885.977275, 1e-12);
  const band = rovibrationalBand(hcl, 1, 300);
  const B1 = rotationalConstantV(hcl, 1), B0 = rotationalConstantV(hcl, 0);
  const R0 = band.find((l) => l.branch === "R" && l.J === 0)!, P1 = band.find((l) => l.branch === "P" && l.J === 1)!;
  close(R0.sigma, nu0 + 2 * B1 - 4 * hcl.De, 1e-12);
  close(P1.sigma, nu0 - 2 * B0 + 4 * hcl.De, 1e-12);
  assert.equal(band.some((l) => l.branch === "P" && l.J === 0), false); // no P(0)
  // H³⁷Cl: ρ = √(μ₃₅/μ₃₇), band origin 2.1 cm⁻¹ lower
  const h37 = isotopologue(hcl, hcl.minor.m1, hcl.minor.m2);
  const rho = Math.sqrt(mu / reducedMass(h37.m1, h37.m2));
  close(h37.we, hcl.we * rho, 1e-14);
  const shift = (vibrationalTerm(1, h37) - vibrationalTerm(0, h37) - nu0) / 100;
  assert.ok(shift < -2.0 && shift > -2.2, `${shift}`);
});

test("THz: Liebe–Hufford–Manabe water against its Table I data and a hand calculation", () => {
  // LHM 1991 Table I: 100 GHz, 20 °C: ε = 7.72 + 12.33i; 264 GHz, 40 °C: 5.51 + 7.19i (fit σ ≈ 0.2)
  const a = waterPermittivity(100e9, 293.15), b = waterPermittivity(264e9, 313.15);
  assert.ok(Math.abs(a.re - 7.72) < 0.4 && Math.abs(a.im - 12.33) < 0.4, `${a.re} ${a.im}`);
  assert.ok(Math.abs(b.re - 5.51) < 0.2 && Math.abs(b.im - 7.19) < 0.2, `${b.re} ${b.im}`);
  // cold water (θ < 0, where the sign of the ε₂ term matters): 264 GHz, 10 °C: 5.29 + 4.95i; 30 GHz, 0 °C: 12.48 + 22.65i
  for (const [f, T, re, im] of [[264e9, 283.15, 5.29, 4.95], [30e9, 273.15, 12.48, 22.65]]) {
    const e = waterPermittivity(f, T);
    assert.ok(Math.abs(e.re - re) < 0.2 && Math.abs(e.im - im) < 0.2, `${f} ${T}: ${e.re} ${e.im}`);
  }
  // static limit ε₀ = 77.66 − 103.3θ, θ = 1 − 300/T
  close(waterPermittivity(0, 300).re, 77.66, 1e-12);
  // hand calculation at 1 THz, 25 °C: θ = −0.00620490, ε₀ = 78.3010, ε₁ = 5.25400, ε₂ = 3.47334,
  // γ₁ = 19.3038 GHz (τ = 8.245 ps), γ₂ = 768.29 GHz → ε = 4.16150 + 2.26985i, ñ = 2.10971 + 0.53795i, α = 225.49 cm⁻¹
  const eps = waterPermittivity(1e12, 298.15), nk = complexIndex(eps);
  close(eps.re, 4.1615, 2e-5);
  close(eps.im, 2.26985, 2e-5);
  close(nk.re, 2.10971, 2e-5);
  close(absorptionCoefficient(nk, 1e12) / 100, 225.49, 2e-5);
  // Lorentz: ε(f₀) = ε∞ + iΔε f₀/γ; constant model returns α
  const L = lorentzPermittivity(1e12, 3, 0.1, 1e12, 0.05e12);
  close(L.re, 3, 1e-12);
  close(L.im, 2, 1e-12);
  close(absorptionCoefficient(complexIndex(constantPermittivity(0.7e12, 1.5, 1000)), 0.7e12), 1000, 1e-12);
});

test("THz-TDS slab transmission, parameter extraction and the Jepsen–Fischer limit", () => {
  // weakly absorbing slab: the polar form agrees with the complex one; the real-Fresnel extraction misses only the
  // Fresnel phase arg[4ñ/(ñ+1)²] ≈ κ(1 − n)/(n(n + 1)), i.e. Δn ≈ 4·10⁻⁵ here
  const f = 1e12, d = 1e-3;
  const nk = complexIndex(constantPermittivity(f, 1.95, 200)); // n = 1.95, α = 2 cm⁻¹
  const T = slabTransmission(nk, f, d), P = slabTransmissionPolar(nk, f, d);
  close(Math.hypot(T.re, T.im), P.magnitude, 1e-12);
  close(Math.cos(P.phase), T.re / P.magnitude, 1e-9);
  // |T| = (4n/(n+1)²) e^(−αd/2) = 0.896294 · e^(−0.1)
  close(P.magnitude, ((4 * 1.95) / 2.95 ** 2) * Math.exp(-0.1), 1e-5);
  const x = extractIndex(P.magnitude, P.phase, f, d);
  close(x.n, 1.95, 3e-5);
  close(x.alpha, 200, 1e-4);
  // Jepsen & Fischer 2005: α_max d = 2 ln(DR·4n/(n+1)²); DR = 1000, n = 2, d = 1 mm → 135.80 cm⁻¹ (hand calc)
  close(maxAbsorption(1000, 2, 1e-3) / 100, 20 * Math.log(8000 / 9), 1e-12);
  close(maxAbsorption(1000, 2, 1e-3) / 100, 135.7994, 1e-6);
  assert.ok(Number.isNaN(maxAbsorption(0.5, 2, 1e-3)));
  // DR = 1.05 < (n+1)²/4n = 1.125 for n = 2: the Fresnel loss alone exceeds the dynamic range, α_max = 0
  assert.equal(maxAbsorption(1.05, 2, 1e-3), 0);
});

test("XPS: kinetic energy, TPP-2M against the NIST SRD 71 example and the sampling depth", () => {
  close(kineticEnergy(1486.6, 284.8, 4.5), 1197.3, 1e-12);
  // NIST SRD 71 user's guide, Appendix B: TPP-2M for Si₃N₄ (M 140.28346, ρ 3.44 g/cm³): 5.83, 6.26, 14.21, 23.59,
  // 40.62 Å at 50, 100, 500, 1000, 2000 eV
  const m = { ...TPP2M_MATERIALS.si3n4, M: 140.28346 };
  ([[50, 5.83], [100, 6.26], [500, 14.21], [1000, 23.59], [2000, 40.62]] as const).forEach(([E, l]) =>
    assert.ok(Math.abs(imfpTpp2m(E, m) * 1e10 - l) < 0.006, `${E} eV: ${imfpTpp2m(E, m) * 1e10}`));
  // 95 % sampling depth = 3λ cos θ (−ln 0.05 = 2.9957)
  close(samplingDepth(2e-9, 0), -2e-9 * Math.log(0.05), 1e-12);
  close(samplingDepth(2e-9, Math.PI / 3), 2e-9 * 0.5 * 2.995732, 1e-6);
  assert.ok(Number.isNaN(imfpTpp2m(0, m)));
  assert.ok(Number.isNaN(imfpTpp2m(20, m))); // below the 50 eV fit range
  assert.ok(Number.isNaN(samplingDepth(2e-9, Math.PI / 2)));
});
