import test from "node:test";
import assert from "node:assert/strict";

import {
  airyPeakNear,
  airyPeakWidth,
  coefficientOfFinesse,
  firstReflectionExtrema,
  netReflectionPhase,
  reflectingFinesse,
} from "../src/physics/thin-film/interference";
import { stackResponse, type Stack } from "../src/physics/thin-film/transfer-matrix";

const NM = 1e-9;

function close(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

const film = (n0: number, n: number, d: number, ns: number): Stack => ({
  incident: n0,
  layers: [{ n, thickness: d }],
  substrate: { n: ns },
});

// Born & Wolf, Principles of Optics, 7th ed., §7.6.1: F = 4R/(1 − R)², half-intensity width
// 4 asin(1/√F), finesse π√F/2. Hand values: R = 0.8 → F = 3.2/0.04 = 80, ℱ = π√80/2 = 14.0496.
test("interference: coefficient of finesse and reflecting finesse", () => {
  close(coefficientOfFinesse(0.8), 80, 1e-12, "F(0.8)");
  close(coefficientOfFinesse(0.04), 0.16 / 0.9216, 1e-15, "F(0.04)"); // 0.173611
  close(coefficientOfFinesse(0.81, 0.64), (4 * 0.72) / 0.28 ** 2, 1e-12, "F(0.81, 0.64), ρ = 0.72"); // 36.7347
  close(reflectingFinesse(80), (Math.PI * Math.sqrt(80)) / 2, 1e-12, "ℱ(80)");
  close(reflectingFinesse(80), 14.0496, 1e-4, "ℱ(80) hand");
  assert.ok(Number.isNaN(coefficientOfFinesse(1)), "R = 1");
  assert.ok(Number.isNaN(coefficientOfFinesse(-0.1)), "R < 0");
  assert.ok(Number.isNaN(reflectingFinesse(-1)), "F < 0");
});

test("interference: the Airy function with F matches the transfer matrix", () => {
  // Free-standing slab n = 1.5, d = 500 nm in air: both faces have R = 0.04 and T = 1/(1 + F sin²(δ/2)).
  const slab = film(1, 1.5, 500 * NM, 1);
  const F = coefficientOfFinesse(0.04);
  for (const wl of [450, 500, 537.3, 600, 750]) {
    const delta = (4 * Math.PI * 1.5 * 500) / wl;
    close(stackResponse(slab, wl * NM).T, 1 / (1 + F * Math.sin(delta / 2) ** 2), 1e-14, `slab T(${wl} nm)`);
  }
  // Unequal faces, n = 2.35 quarter-wave on glass: T_min/T_max = 1/(1 + F(R₀₁, R₁₂)).
  // T_max is the half-wave (absentee) value 1 − R_glass, T_min the quarter-wave one (Y = n²/n_s).
  const lambda0 = 550 * NM;
  const qw = film(1, 2.35, lambda0 / (4 * 2.35), 1.52);
  const Fu = coefficientOfFinesse(((1 - 2.35) / 3.35) ** 2, ((2.35 - 1.52) / 3.87) ** 2);
  const ratio = stackResponse(qw, lambda0).T / stackResponse(qw, lambda0 / 2).T;
  close(ratio, 1 / (1 + Fu), 1e-14, "T_min/T_max"); // 0.70710
});

test("interference: Airy peak width", () => {
  const F = 80;
  const w = airyPeakWidth(F);
  close(w, 4 * Math.asin(1 / Math.sqrt(80)), 1e-15, "width(80)");
  close(w, 0.4481506, 1e-7, "width(80) hand"); // 4(x + x³/6 + 3x⁵/40), x = 1/√80
  // At δ = ±w/2 from the peak the Airy function is exactly ½.
  close(1 / (1 + F * Math.sin(w / 4) ** 2), 0.5, 1e-15, "half maximum");
  // High finesse: width → 2π/ℱ.
  const big = 1e8;
  close(airyPeakWidth(big) / ((2 * Math.PI) / reflectingFinesse(big)), 1, 1e-8, "width ≈ 2π/ℱ");
  // Edge: F = 1 spans the whole order; below it there is no half maximum.
  close(airyPeakWidth(1), 2 * Math.PI, 1e-15, "F = 1");
  assert.ok(Number.isNaN(airyPeakWidth(0.99)), "F < 1");
});

// Hecht, Optics, 5th ed., §9.4.1: each reflection off a higher index adds π.
test("interference: net reflection phase of a film", () => {
  assert.equal(netReflectionPhase(1, 1.38, 1.52), 0, "MgF₂ on glass: two π shifts");
  assert.equal(netReflectionPhase(1, 1.33, 1), Math.PI, "soap film in air");
  assert.equal(netReflectionPhase(1, 2.35, 1.52), Math.PI, "TiO₂ on glass");
  assert.equal(netReflectionPhase(1.52, 1.38, 1), 0, "from the glass side: no π shift");
  assert.ok(Number.isNaN(netReflectionPhase(1, 1, 1.52)), "film index equals the ambient");
  assert.ok(Number.isNaN(netReflectionPhase(1, 1.52, 1.52)), "film index equals the substrate");
});

test("interference: first reflection extrema are the extrema of the exact R(λ)", () => {
  const cases: Array<[number, number, number, number, number, number]> = [
    // n₀, n, d (nm), n_s, constructive (nm), destructive (nm)
    [1, 1.33, 100, 1, 532, 266], // soap film: max at 4nd, min (R = 0, half-wave absentee) at 2nd
    [1, 1.38, 100, 1.52, 276, 552], // MgF₂ on glass: max at 2nd, min (quarter-wave AR) at 4nd
  ];
  for (const [n0, n, d, ns, cExp, dExp] of cases) {
    const ex = firstReflectionExtrema(n0, n, ns, d * NM);
    close(ex.constructive / NM, cExp, 1e-9, `constructive ${n}`);
    close(ex.destructive / NM, dExp, 1e-9, `destructive ${n}`);
    const st = film(n0, n, d * NM, ns);
    const R = (wl: number) => stackResponse(st, wl).R;
    for (const h of [0.5, 2]) {
      assert.ok(R(ex.constructive) > R(ex.constructive + h * NM) && R(ex.constructive) > R(ex.constructive - h * NM), `max ${n} ±${h}`);
      assert.ok(R(ex.destructive) < R(ex.destructive + h * NM) && R(ex.destructive) < R(ex.destructive - h * NM), `min ${n} ±${h}`);
    }
  }
  close(stackResponse(film(1, 1.33, 100 * NM, 1), 266 * NM).R, 0, 1e-15, "soap film half-wave: R = 0");
  const Y = 1.38 ** 2 / 1.52;
  close(stackResponse(film(1, 1.38, 100 * NM, 1.52), 552 * NM).R, ((1 - Y) / (1 + Y)) ** 2, 1e-15, "MgF₂ quarter-wave R"); // 0.0126008
  assert.ok(Number.isNaN(firstReflectionExtrema(1, 1.38, 1.52, 0).constructive), "d = 0");
});

// Born & Wolf, 7th ed., §7.6.1: peaks at δ = 4πnd/λ = 2πm, half maxima at δ = 2πm ± w/2 with
// w = 4 asin(1/√F). Hand values for nd = 1.5 × 500 nm = 750 nm, R = 0.8 (F = 80, w = 0.4481506):
// near 550 nm m = round(1500/550) = 3, λ₃ = 500 nm, FSR = 500/3 = 166.67 nm,
// FWHM = 4π·750 [1/(6π − w/2) − 1/(6π + w/2)] = 11.8892 nm; m = 2 (λ₂ = 750 nm): 26.7555 nm.
test("interference: nearest Airy peak, its FSR and exact width", () => {
  const p = airyPeakNear(750 * NM, 550 * NM, 80);
  assert.equal(p.order, 3);
  close(p.wavelength / NM, 500, 1e-9, "λ₃");
  close(p.fsr / NM, 500 / 3, 1e-9, "FSR");
  close(p.fwhm / NM, 11.8892, 1e-4, "FWHM, m = 3");
  close(airyPeakNear(750 * NM, 760 * NM, 80).fwhm / NM, 26.7555, 1e-4, "FWHM, m = 2");
  // The width in wavelength is ≈ FSR·w/(2π) for a narrow peak (first order): 11.887 nm here.
  close(p.fwhm / ((p.fsr * airyPeakWidth(80)) / (2 * Math.PI)), 1, 1e-3, "first-order width");
  // Edge cases: λ ≫ 2nd still gives order 1; F < 1 has no half-maximum width.
  const far = airyPeakNear(750 * NM, 5000 * NM, 80);
  assert.equal(far.order, 1);
  close(far.wavelength / NM, 1500, 1e-9, "λ₁");
  assert.ok(Number.isNaN(airyPeakNear(750 * NM, 550 * NM, 0.5).fwhm), "F < 1");
  assert.ok(Number.isNaN(airyPeakNear(0, 550 * NM, 80).order), "nd = 0");
});
