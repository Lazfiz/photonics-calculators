import test from "node:test";
import assert from "node:assert/strict";

import { besselJ } from "../src/physics/math";
import {
  GAUSSIAN_FWHM_PER_SIGMA, PSF_SIGMA_COEFFICIENT, abbeLateralFwhm, axialPsfFwhm, localizationPrecision, rayleighDistance,
  stedLateralFwhm,
} from "../src/physics/imaging/super-resolution";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const nm = 1e-9;

test("STED law uses the λ/(2NA) FWHM, not the Rayleigh distance (page defaults)", () => {
  // Westphal & Hell, PRL 94, 143903 (2005): d = λ/(2NA√(1 + ζ)). 580 nm, NA 1.4, ζ = 30:
  // λ/(2NA) = 207.1429 nm; / √31 = 37.2041 nm. The page computed 0.61λ/NA/√31 = 45.3891 nm (1.22×).
  assertRel(abbeLateralFwhm(580 * nm, 1.4), 207.1429 * nm, 1e-6, "Abbe");
  assertRel(stedLateralFwhm(580 * nm, 1.4, 30), 37.2041 * nm, 1e-5, "STED");
  assertRel(rayleighDistance(580 * nm, 1.4) / Math.sqrt(31) / stedLateralFwhm(580 * nm, 1.4, 30), 1.22, 1e-12, "old/new");
  assert.equal(stedLateralFwhm(580 * nm, 1.4, 0), abbeLateralFwhm(580 * nm, 1.4), "ζ = 0 is confocal");
});

test("Gaussian σ = 0.21 λ/NA agrees with a least-squares fit to the Airy PSF", () => {
  // Independent check of Zhang et al. (2007): fit A exp(−r²/2s²) to [2J₁(v)/v]², v = 2πx (x in λ/NA),
  // weighted by the area element 2πx dx. The best s is 0.206 λ/NA (within 2 % of 0.21).
  const airy = (x: number) => { const v = 2 * Math.PI * x; return v === 0 ? 1 : (2 * besselJ(1, v) / v) ** 2; };
  const xs: number[] = [];
  for (let x = 0.001; x < 3; x += 0.004) xs.push(x);
  const ys = xs.map(airy);
  let best = { err: Infinity, s: 0 };
  for (let s = 0.18; s < 0.24; s += 0.0005) {
    let num = 0, den = 0;
    xs.forEach((x, i) => { const g = Math.exp(-x * x / (2 * s * s)); num += ys[i] * g * x; den += g * g * x; });
    const A = num / den;
    let err = 0;
    xs.forEach((x, i) => { err += (ys[i] - A * Math.exp(-x * x / (2 * s * s))) ** 2 * x; });
    if (err < best.err) best = { err, s };
  }
  assertRel(best.s, PSF_SIGMA_COEFFICIENT, 0.025, "LSQ σ");
});

test("shot-noise localization precision (Thompson et al. 2002, no pixelation or background)", () => {
  // 580 nm, NA 1.4, N = 5000: s = 0.21 · 580/1.4 = 87.0 nm; σ = 87.0/√5000 = 1.230366 nm; FWHM 2.897280 nm.
  assertRel(localizationPrecision(580 * nm, 1.4, 5000), 1.230366 * nm, 1e-5, "σ");
  assertRel(localizationPrecision(580 * nm, 1.4, 5000) * GAUSSIAN_FWHM_PER_SIGMA, 2.897280 * nm, 1e-5, "FWHM");
  // 1/√N: four times the photons halves σ.
  assertRel(localizationPrecision(580 * nm, 1.4, 1250) / localizationPrecision(580 * nm, 1.4, 5000), 2, 1e-12, "√N");
});

test("axial diffraction limit and domain guards", () => {
  // 0.88 · 580/(1.52 − √(1.52² − 1.4²)) = 510.4/0.928054 = 549.968 nm.
  assertRel(axialPsfFwhm(580 * nm, 1.52, 1.4), 549.968 * nm, 1e-5, "axial");
  assert.ok(Number.isNaN(axialPsfFwhm(580 * nm, 1.33, 1.4)), "NA > n");
  assert.ok(Number.isNaN(stedLateralFwhm(580 * nm, 1.4, -1)));
  assert.ok(Number.isNaN(localizationPrecision(580 * nm, 1.4, 0)));
  assert.ok(Number.isNaN(abbeLateralFwhm(580 * nm, 0)));
});
