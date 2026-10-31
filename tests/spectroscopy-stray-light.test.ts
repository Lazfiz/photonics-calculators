import test from "node:test";
import assert from "node:assert/strict";

import {
  absorbanceError, apparentAbsorbanceLimit, maxStrayRatio, measuredAbsorbance, measuredTransmittance, orderSortingWindow,
  overlapFreeBand, overlappingOrders, strayRatioFromPowerRatio,
} from "../src/physics/spectroscopy/stray-light";
import {
  czernyTurner, evalPolynomial, fitPolynomial, maxCalibrationError, pixelToWavelength, polynomialSlope, wavelengthToPixel,
} from "../src/physics/spectroscopy/spectral-calibration";
import { gratingReciprocalLinearDispersion } from "../src/physics/spectroscopy/spectral-resolution";
import { createRng, gaussian } from "../src/physics/random";

const close = (actual: number, expected: number, rel: number, msg?: string) =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg ?? ""} ${actual} vs ${expected}`);

const DEG = Math.PI / 180;

test("stray light: photometric error, saturation and the two stray-ratio conventions", () => {
  // Hand: A = 3, s = 10⁻³ of the detected reference power, T_s = 1: T_m = 0.999·10⁻³ + 10⁻³ = 1.999·10⁻³,
  // A_m = 3 − log₁₀ 1.999 = 2.69919 (part 0 audit, PR #127).
  close(measuredTransmittance(1e-3, 1e-3), 1.999e-3, 1e-12);
  close(measuredAbsorbance(3, 1e-3), 2.699187, 1e-6);
  // Skoog, Holler & Crouch ch. 13 write it with S = P_s/P₀: A′ = log((P₀ + P_s)/(P + P_s)) = −log((10⁻³ + 10⁻³)/1.001)
  // = 2.69940; the same model for s = S/(1 + S).
  close(measuredAbsorbance(3, strayRatioFromPowerRatio(1e-3)), -Math.log10(2e-3 / 1.001), 1e-12);
  close(measuredAbsorbance(3, strayRatioFromPowerRatio(1e-3)), 2.699404, 1e-6);
  // Saturation A_max = −log₁₀ s: s = 0.1 % reads at most 3 AU; at A = 10 the reading is 3 − 4.3·10⁻⁸.
  assert.equal(apparentAbsorbanceLimit(1e-3), 3);
  close(measuredAbsorbance(10, 1e-3), 3 - (1 - 1e-3) * 1e-7 / Math.LN10, 1e-9);
  // Stray light half absorbed by the sample: A_max = −log₁₀(5·10⁻⁴) = 3.30103.
  close(apparentAbsorbanceLimit(1e-3, 0.5), 3.30103, 1e-6);
  // Small-s limit ΔA ≈ −s(10^A − 1)/ln 10, kept by log1p at s = 10⁻¹²: −9·10⁻¹²/2.302585 = −3.90865·10⁻¹².
  close(absorbanceError(1, 1e-12), -9e-12 / Math.LN10, 1e-9);
  assert.equal(absorbanceError(2, 0), 0);
  assert.ok(Number.isNaN(absorbanceError(2, 1)) && Number.isNaN(absorbanceError(-0.1, 1e-3)), "s ≥ 1 or A < 0 → NaN");
});

test("stray light: largest stray ratio for an absorbance tolerance", () => {
  // Hand: A = 2, δ = 0.01 AU: s = 0.01·(10^0.01 − 1)/0.99 = 0.01·0.0232930/0.99 = 2.35283·10⁻⁴; it gives ΔA = −0.01 back.
  const s = maxStrayRatio(2, 0.01);
  close(s, 2.35283e-4, 1e-5);
  close(absorbanceError(2, s), -0.01, 1e-9);
  assert.ok(Number.isNaN(maxStrayRatio(1, 0.01, 0.05)), "T_s ≤ T: stray light cannot lower the reading");
});

test("order overlap: nλ′ = mλ at a fixed grating angle (Palmer & Loewen ch. 2)", () => {
  // m = 1 at 600 nm on a 200–1100 nm silicon range: 300 nm (2nd) and 200 nm (3rd) land there too.
  assert.deepEqual(overlappingOrders(600e-9, 1, 200e-9, 1100e-9).map((o) => [o.order, Math.round(o.wavelength * 1e9)]), [[2, 300], [3, 200]]);
  // m = 2 at 500 nm: 1000 nm in 1st order, 333.3, 250 and 200 nm in orders 3–5; the filter must pass (333.3, 1000) nm only.
  assert.deepEqual(overlappingOrders(500e-9, 2, 200e-9, 1100e-9).map((o) => o.order), [1, 3, 4, 5]);
  const w = orderSortingWindow(500e-9, 2);
  close(w.low, 333.333e-9, 1e-5);
  close(w.high, 1000e-9, 1e-12);
  assert.equal(orderSortingWindow(600e-9, 1).high, Infinity);
  assert.deepEqual(overlappingOrders(600e-9, 1, 700e-9, 1100e-9), [], "nothing overlaps when the range starts above λ");
});

// Spectral-range defaults: 1200 lines/mm, m = 1, λ_c = 500 nm, D_v = 30°, f = 100 mm, 2048 × 12.5 µm.
const d = 1e-3 / 1200;
const sp = czernyTurner(500e-9, d, 1, 30 * DEG, 0.1, 12.5e-6, 2048);
// NIST ASD Hg I air wavelengths (nm): 404.6565, 407.7837, 435.8335, 546.0750, 576.9610, 579.0670.
const hg = [404.6565, 407.7837, 435.8335, 546.075, 576.961, 579.067].map((x) => x * 1e-9);

test("spectral calibration: grating-equation truth on a flat detector", () => {
  // Hand: sin ψ = 500/(2·833.333·cos 15°) = 0.310583, ψ = 18.0944°, α = 33.0944°, β₀ = 3.0944°.
  close(sp.incidence / DEG, 33.0944, 1e-5);
  close(sp.beta0 / DEG, 3.0944, 1e-4);
  // 546.075 nm: sin β = 0.655290 − 0.546060 = 0.109230, β = 6.2706°, x = 100 mm · tan 3.1762° = 5.549 mm
  // → pixel ≈ 443.9 + 1023.5 ≈ 1467.4 (hand, 5 digits); 1467.815 unrounded.
  close(wavelengthToPixel(546.075e-9, sp), 1467.815, 1e-6);
  for (const l of hg) close(pixelToWavelength(wavelengthToPixel(l, sp), sp), l, 1e-12, "pixel ↔ λ round trip");
  // Edges as on the spectral-range page: 394.04–605.23 nm.
  close(pixelToWavelength(0, sp) * 1e9, 394.038, 1e-5);
  close(pixelToWavelength(2047, sp) * 1e9, 605.235, 1e-5);
  assert.ok(Number.isNaN(wavelengthToPixel(700e-9, sp)), "700 nm misses the detector");
  // Unreachable: mλ_c ≥ d(1 + cos D_v) = 1555 nm.
  assert.ok(Number.isNaN(czernyTurner(1600e-9, d, 1, 30 * DEG, 0.1, 12.5e-6, 2048).incidence));
});

test("spectral calibration: polynomial fits and their error across the detector", () => {
  const c = 2047 / 2;
  // An exact quadratic is recovered: λ = 400 + 0.1 i − 2·10⁻⁶ i² → 498 at i = 1000, slope 0.096.
  const xs = [0, 300, 900, 1500, 2047];
  const q = fitPolynomial(xs, xs.map((x) => 400 + 0.1 * x - 2e-6 * x * x), 2, c, c)!;
  close(evalPolynomial(q, 1000), 498, 1e-12);
  close(polynomialSlope(q, 1000), 0.096, 1e-10);
  assert.equal(fitPolynomial([1, 2, 3], [1, 2, 3], 3, c, c), null, "degree 3 needs 4 points");

  // Noise-free Hg lines: the cubic's centre slope matches d cos β₀/(m f)·p = 0.104015 nm/px (Palmer & Loewen ch. 2).
  const px = hg.map((l) => wavelengthToPixel(l, sp));
  const fits = [1, 2, 3].map((k) => fitPolynomial(px, hg, k, c, c)!);
  close(polynomialSlope(fits[2], c), gratingReciprocalLinearDispersion(d, 1, sp.beta0, 0.1) * 12.5e-6, 1e-4);
  // With β₀ ≈ 3° the distortion is nearly odd in x, so a quadratic barely beats a line and a cubic removes it:
  // max |fit − truth| 0.623, 0.500 and 0.0051 nm (regression values, this model).
  close(maxCalibrationError(fits[0], sp) * 1e9, 0.6233, 1e-3);
  close(maxCalibrationError(fits[1], sp) * 1e9, 0.5001, 1e-3);
  close(maxCalibrationError(fits[2], sp) * 1e9, 0.00510, 2e-2);
  // 0.05 px centroid noise (seed 1) leaves the cubic's worst error at 0.012 nm.
  const rng = createRng(1);
  const noisy = px.map((x) => x + 0.05 * gaussian(rng));
  close(maxCalibrationError(fitPolynomial(noisy, hg, 3, c, c)!, sp) * 1e9, 0.0120, 3e-2);
});

test("overlap-free band of order m inside the source/detector range", () => {
  // Palmer & Loewen ch. 2: order n puts mλ/n where order m has λ. Free when mλ/(m + 1) < λ_min and mλ/(m − 1) > λ_max.
  // m = 2, 400–700 nm: [max(400, 700/2), min(700, 400·3/2)) = [400, 600) nm. At 590 nm orders 1 and 3 bring 1180 and
  // 393.3 nm (both outside); at 610 nm order 3 brings 406.7 nm (inside).
  const b = overlapFreeBand(400e-9, 700e-9, 2);
  assert.ok(Math.abs(b.low - 400e-9) < 1e-15 && Math.abs(b.high - 600e-9) < 1e-15);
  assert.equal(overlappingOrders(590e-9, 2, 400e-9, 700e-9).length, 0);
  assert.equal(overlappingOrders(610e-9, 2, 400e-9, 700e-9).length, 1);
  // m = 2, 200–1100 nm: [550, 300) is empty, since order 1 of 2λ lands everywhere (250 nm ← 500 nm).
  assert.ok(Number.isNaN(overlapFreeBand(200e-9, 1100e-9, 2).low));
  // m = 1: up to 2λ_min, but never past λ_max.
  const one = overlapFreeBand(200e-9, 300e-9, 1);
  assert.ok(Math.abs(one.low - 200e-9) < 1e-15 && Math.abs(one.high - 300e-9) < 1e-15);
  assert.ok(Math.abs(overlapFreeBand(200e-9, 1100e-9, 1).high - 400e-9) < 1e-15);
});
