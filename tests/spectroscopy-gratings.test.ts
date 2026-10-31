import test from "node:test";
import assert from "node:assert/strict";

import {
  anamorphicMagnification, blazeAngleFromLittrow, blazeEnvelope, blazeShadowFactor, blazeWavelength, detectorCoverage, detectorWavelength, flatDetectorReciprocalDispersion,
  gratingDiffractionAngle, gratingOrderRange, gratingReciprocalLinearDispersion, littrowBlazeEfficiency,
  littrowRayleighWavelengths, overlapFreeLimit, scalarBlazeEfficiency,
} from "../src/physics/spectroscopy/spectral-resolution";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

const DEG = Math.PI / 180;
const d = 1e-3 / 1200; // 1200 lines/mm

test("blaze wavelength: Casini & Nelson's echelle example and the grating-efficiency defaults", () => {
  // Casini & Nelson, JOSA A 31, 2179 (2014), Figs. 4–5: 200 lines/mm, φ = 60°, order 16, α = φ (Littrow) → λ ≈ 541.3 nm.
  close(blazeWavelength(1e-3 / 200, 16, 60 * DEG, 60 * DEG), 541.27e-9, 1e-4);
  // Hand: λ_B = 2d sin 17.5° = 1666.67 nm · 0.300706 = 501.18 nm.
  close(blazeWavelength(d, 1, 17.5 * DEG, 17.5 * DEG), 501.176e-9, 1e-5);
  // Catalogue λ_B 550 nm → φ = asin(550/1666.67) = 19.269°; at α = 45° the facets reflect into β = 2φ − α:
  // λ_b = d[sin 45° + sin(−6.462°)] = 833.33 nm · (0.707107 − 0.112552) = 495.46 nm.
  const phi = blazeAngleFromLittrow(550e-9, d);
  close(phi / DEG, 19.2688, 1e-5);
  close(blazeWavelength(d, 1, phi, 45 * DEG), 495.462e-9, 1e-5);
  assert.ok(Number.isNaN(blazeAngleFromLittrow(1700e-9, d)), "λ_B > 2d has no blaze angle");
});

test("scalar envelope (Casini & Nelson eqs. 18, 21, 23) and its normalisation over orders", () => {
  const phi = 17.5 * DEG;
  const lb = 2 * d * Math.sin(phi);
  const th = (l: number) => Math.asin(l / (2 * d));
  // Hand at λ = 1.5 λ_B = 751.76 nm: sin θ = 0.451059, θ = 26.8115°, ρ = cos θ/cos(θ − φ) = 0.904427,
  // x = π d ρ · 2 sin(θ − φ)/λ = 1.019175, sinc² = (0.851676/1.019175)² = 0.69832.
  close(blazeEnvelope(1.5 * lb, d, 1, phi, th(1.5 * lb)), 0.69832, 1e-4);
  close(blazeEnvelope(lb, d, 1, phi, th(lb)), 1, 1e-12);
  // Normalised: η₁ = I₁/Σ I over the propagating orders (energy conservation across orders, as in Casini & Nelson's comparison with vector theory).
  // At 1.5 λ_B orders 0 and 1 propagate, I₀ = 0.344902: η₁ = 0.698286/(0.344902 + 0.698286) = 0.66938.
  close(littrowBlazeEfficiency(1.5 * lb, d, 1, phi), 0.66938, 1e-4);
  // At λ_B orders −1 … 2 carry 0.039137, 0.009620, 1, 0.017239: η₁ = 1/1.065996 = 0.93809.
  close(littrowBlazeEfficiency(lb, d, 1, phi), 0.93809, 1e-4);
  // Near the cutoff (1650 nm) both envelopes tend to 1 (ρ → 0) and the light splits: 0.741048/1.740405 = 0.42579.
  close(littrowBlazeEfficiency(1650e-9, d, 1, phi), 0.42579, 1e-4);
  // Order 1 stops at the Littrow cutoff λ = 2d.
  assert.equal(littrowBlazeEfficiency(1700e-9, d, 1, phi), 0);
  // α = 45°, φ = 19.2688°, λ = 550 nm: β = −2.700°, ρ = 0.784929, sin(α − φ) + sin(β − φ) = 0.060099,
  // x = 0.224546, sinc² = 0.98331; with I₀ = 0.319159 and I₂ = 0.013463, η₁ = 0.983333/1.315955 = 0.74724.
  const phiB = blazeAngleFromLittrow(550e-9, d);
  close(gratingDiffractionAngle(550e-9, d, 1, 45 * DEG) / DEG, -2.7000, 1e-4);
  close(blazeEnvelope(550e-9, d, 1, phiB, 45 * DEG), 0.98331, 1e-4);
  close(scalarBlazeEfficiency(550e-9, d, 1, phiB, 45 * DEG), 0.74724, 1e-4);
  // Shadowing (α < φ < β): α = 0, λ = 700 nm, β = 57.140°, ρ(α) = cos φ = 0.943990 (whole facet lit), x = 1.002289,
  // sinc² = 0.70694. The exit direction sees ρ(β) = cos β/cos(β − φ) = 0.54260/0.78937 = 0.687370 of the period, so
  // k = ρ(β)/ρ(α) = 0.728137 (right-angle sawtooth geometry; the α ≥ φ form cos β cos(α − φ)/(cos α cos(β − φ))
  // would give 0.648843, a lit length longer than the facet). With I₋₁ = 0.046696, I₀ = 0.096891:
  // η₁ = 0.728137 · 0.706922/0.850509 = 0.60521.
  const b700 = gratingDiffractionAngle(700e-9, d, 1, 0);
  close(blazeShadowFactor(b700, phiB, 0), 0.728137, 1e-5);
  close(blazeEnvelope(700e-9, d, 1, phiB, 0), 0.70694, 1e-4);
  close(scalarBlazeEfficiency(700e-9, d, 1, phiB, 0), 0.60521, 1e-4);
  // α = 10°, λ = 400 nm: β = 17.840° < φ, so the exit direction sees the whole facet and k = 1.
  const b400 = gratingDiffractionAngle(400e-9, d, 1, 10 * DEG);
  close(b400 / DEG, 17.8395, 1e-5);
  assert.equal(blazeShadowFactor(b400, phiB, 10 * DEG), 1);
});

test("orders, Rayleigh anomalies and order overlap", () => {
  // First-order Littrow: orders −1 and +2 graze at λ = d/1.5 = 2d/3 = 555.56 nm, then d/2.5, d/3.5 …
  const ray = littrowRayleighWavelengths(d, 1, 300e-9);
  assert.equal(ray.length, 2);
  close(ray[0], 555.556e-9, 1e-5);
  close(ray[1], 333.333e-9, 1e-5);
  // Third order: the cutoff is 2d/3 = 555.6 nm, so the first anomaly is d/2.5 = 333.3 nm (orders 0 … 3 never graze below it).
  close(littrowRayleighWavelengths(d, 3, 300e-9)[0], 333.333e-9, 1e-5);
  // Below 2d/3 four orders propagate (−1, 0, 1, 2); above it only 0 and 1.
  assert.deepEqual(gratingOrderRange(500e-9, d, Math.asin(500e-9 / (2 * d))), { min: -1, max: 2 });
  const r600 = gratingOrderRange(600e-9, d, Math.asin(600e-9 / (2 * d)));
  assert.equal(r600.max, 1);
  assert.equal(r600.min + 0, 0);
  // Free spectral range: order 2 light of λ lands on 2λ in order 1, so a band from 400 nm is clean up to 800 nm.
  close(overlapFreeLimit(400e-9, 1), 800e-9, 1e-12);
  close(overlapFreeLimit(400e-9, 3), 533.333e-9, 1e-6);
});

test("dispersion, anamorphic magnification and flat-detector coverage", () => {
  // d cos β/(m f) at 550 nm, α = 45°, f = 100 mm: 833.33 nm · cos(−2.700°)/100 mm = 8.3241 nm/mm.
  const b = gratingDiffractionAngle(550e-9, d, 1, 45 * DEG);
  close(gratingReciprocalLinearDispersion(d, 1, b, 0.1) * 1e6, 8.3241, 1e-4);
  close(flatDetectorReciprocalDispersion(d, 1, b, b, 0.1), gratingReciprocalLinearDispersion(d, 1, b, 0.1), 1e-12);
  close(anamorphicMagnification(45 * DEG, b), 0.707107 / 0.998890, 1e-5);
  // Littrow (D_v = 0) with β₀ = 10°, 25.6 mm detector at 100 mm: β₀ ± atan(0.128) = 10° ± 7.294°,
  // λ = d(sin 10° + sin β) = 184.05 and 392.44 nm (PR #127 spectral-range golden).
  const lc = 2 * d * Math.sin(10 * DEG);
  const cov = detectorCoverage(lc, d, 1, 0, 25.6e-3, 0.1);
  close(cov.lambdaLow, 184.047e-9, 1e-5);
  close(cov.lambdaHigh, 392.439e-9, 1e-5);
  // Czerny–Turner D_v = 30°, λ_c = 500 nm: sin ψ = 0.3/cos 15° = 0.310583, ψ = 18.094°, α = 33.094°, β₀ = 3.094°.
  const ct = detectorCoverage(500e-9, d, 1, 30 * DEG, 25.6e-3, 0.1);
  close(ct.incidence / DEG, 33.0944, 1e-5);
  close(ct.beta0 / DEG, 3.0944, 1e-4);
  close(detectorWavelength(0, d, 1, ct.incidence, ct.beta0, 0.1), 500e-9, 1e-12, "centre pixel sees λ_c");
  // Edge cases: past the zero order there is no first-order light; λ_c beyond 2d cos(D_v/2)/m is unreachable.
  assert.ok(Number.isNaN(detectorCoverage(50e-9, d, 1, 0, 25.6e-3, 0.1).lambdaLow));
  assert.ok(Number.isNaN(detectorCoverage(1700e-9, d, 1, 0, 25.6e-3, 0.1).incidence));
  // α must stay below 90°: mλ_c < d(1 + cos D_v) = 1555.02 nm at D_v = 30° (1580 nm would need α = 93.9°).
  assert.ok(Number.isNaN(detectorCoverage(1580e-9, d, 1, 30 * DEG, 25.6e-3, 0.1).incidence));
  assert.ok(detectorCoverage(1550e-9, d, 1, 30 * DEG, 25.6e-3, 0.1).incidence < Math.PI / 2);
});
