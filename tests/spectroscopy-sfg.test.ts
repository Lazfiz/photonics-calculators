import test from "node:test";
import assert from "node:assert/strict";

import { b_Wien, eV, sigma_SB } from "../src/physics/constants";
import { blackbodyBandFraction, planckExitance } from "../src/physics/blackbody";
import {
  localMaxima, resonantSusceptibility, sfgIntensity, sfgWavelength, singleResonancePeakShift,
} from "../src/physics/spectroscopy/sum-frequency";
import { photonFromWavelength, photonFromWavenumber } from "../src/physics/spectroscopy/wavenumber";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const perCm = 100; // 1 cm⁻¹ in 1/m

test("SFG wavelength: 532 nm + 3300 cm⁻¹ gives 452.550 nm", () => {
  // Hand calculation (audit value, PR #127): 10⁷/(10⁷/532 + 3300) = 10⁷/22096.992 nm.
  assertRel(sfgWavelength(532e-9, 3300 * perCm) * 1e9, 452.55027, 1e-7, "λ_SFG");
  assert.ok(Number.isNaN(sfgWavelength(532e-9, 0)), "ν̃_IR = 0");
  assert.ok(Number.isNaN(sfgWavelength(-1, 3300 * perCm)), "λ_vis < 0");
});

test("SFG lineshape: Lorentzian peak (A/Γ)², half height at Δ = Γ, interference with the background", () => {
  // Shen 1989 / Lambert et al. 2005 model; hand calculations with A = 8, Γ = 5 cm⁻¹ (A/Γ = 1.6).
  const r = [{ center: 2878 * perCm, amplitude: 8 * perCm, halfWidth: 5 * perCm }];
  assertRel(sfgIntensity(2878 * perCm, r, 0, 0), 2.56, 1e-12, "peak, no background");
  assertRel(sfgIntensity(2883 * perCm, r, 0, 0), 1.28, 1e-12, "half maximum at Δ = Γ");
  // At the centre χ = A_NR e^{iφ} − iA/Γ, so |χ|² = A_NR² + (A/Γ)² − 2 A_NR (A/Γ) sin φ.
  assertRel(sfgIntensity(2878 * perCm, r, 0.5, Math.PI / 2), 0.25 + 2.56 - 1.6, 1e-12, "φ = +90° (destructive)");
  assertRel(sfgIntensity(2878 * perCm, r, 0.5, -Math.PI / 2), 0.25 + 2.56 + 1.6, 1e-12, "φ = −90° (constructive)");
  // Far from resonance only the background is left.
  assertRel(sfgIntensity(1e6 * perCm, r, 0.5, 0.3), 0.25, 1e-4, "background limit");
  const bad = resonantSusceptibility(2878 * perCm, [{ ...r[0], halfWidth: 0 }]);
  assert.ok(Number.isNaN(bad.re) && Number.isNaN(bad.im), "Γ = 0");
});

test("SFG peak pulled by a real background: Δ = −A + √(A² + 4A_NR²Γ²) over 2A_NR = 1.43398 cm⁻¹", () => {
  // Hand calculation: A = 8, Γ = 5, A_NR = 0.5 → (−8 + √89)/1 = 1.433981 cm⁻¹; the sampled maximum agrees.
  const shift = singleResonancePeakShift(8 * perCm, 5 * perCm, 0.5) / perCm;
  assertRel(shift, Math.sqrt(89) - 8, 1e-12, "closed form");
  const r = [{ center: 2878 * perCm, amplitude: 8 * perCm, halfWidth: 5 * perCm }];
  const x = Array.from({ length: 2001 }, (_, i) => 2828 + i * 0.05);
  const peaks = localMaxima(x, x.map((s) => sfgIntensity(s * perCm, r, 0.5, 0)));
  assert.equal(peaks.length, 1);
  assert.ok(Math.abs(peaks[0].x - 2878 - shift) < 1e-4, `sampled peak ${peaks[0].x}`);
  // Negative amplitude: mirrored shift. No background: no shift.
  assertRel(singleResonancePeakShift(-8 * perCm, 5 * perCm, 0.5) / perCm, -shift, 1e-12, "A < 0");
  assert.equal(singleResonancePeakShift(8 * perCm, 5 * perCm, 0), 0);
});

test("Blackbody at 5778 K: λ_peak 501.52 nm, M = σT⁴ 6.3201e7 W/m², 46.53 % in 380–780 nm", () => {
  // CODATA 2022: b = 2.897771955e-3 m K, σ = 5.670374419e-8 W m⁻² K⁻⁴ (hand: b/T, σT⁴).
  assertRel((b_Wien / 5778) * 1e9, 501.51816, 1e-7, "λ_peak");
  assertRel(sigma_SB * 5778 ** 4, 6.32007e7, 1e-5, "M");
  // Independent check of the series: trapezoid of Planck's law over the band, 20000 steps.
  const n = 20000;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const lam = 380e-9 + (400e-9 * i) / n;
    sum += planckExitance(lam, 5778) * (i === 0 || i === n ? 0.5 : 1);
  }
  const trapezoid = (sum * (400e-9 / n)) / (sigma_SB * 5778 ** 4);
  assertRel(blackbodyBandFraction(380e-9, 780e-9, 5778), trapezoid, 1e-7, "band fraction");
  assertRel(trapezoid, 0.465261, 1e-5, "band fraction value");
});

test("Wavenumber conversions: 1000 nm = 10000 cm⁻¹ = 299.792458 THz = 1.239842 eV", () => {
  // Exact SI: c = 299792458 m/s; hc/e = 1239.841984 eV nm.
  const p = photonFromWavelength(1000e-9);
  assertRel(p.wavenumber / perCm, 10000, 1e-14, "ν̃");
  assertRel(p.frequency, 299.792458e12, 1e-14, "f");
  assertRel(p.energy / eV, 1.239841984, 1e-9, "E");
  const q = photonFromWavenumber(10000 * perCm);
  assertRel(q.wavelength, 1000e-9, 1e-14, "λ from ν̃");
  assert.ok(Number.isNaN(photonFromWavelength(0).energy), "λ = 0");
  assert.ok(Number.isNaN(photonFromWavenumber(-1).wavelength), "ν̃ < 0");
});
