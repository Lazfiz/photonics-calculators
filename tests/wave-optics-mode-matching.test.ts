import test from "node:test";
import assert from "node:assert/strict";

import {
  bestLensPosition, couplingAtLensPosition, gaussianOverlap, qAfterLens, singleLensModeMatch,
} from "../src/physics/wave-optics/mode-matching";
import {
  airyDiskDiameter, focusedSpotRadius, pinholeFarFieldIntensity, pinholeRadiusForTransmission, pinholeTransmission,
} from "../src/physics/wave-optics/spatial-filter";
import { regularizedGammaP } from "../src/physics/math";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const zR = (lambda: number, w: number) => (Math.PI * w * w) / lambda;

test("Mode matching: single-lens closed form (Kogelnik & Li 1966; Self 1983)", () => {
  // λ 1550 nm, 50 → 200 µm, d 200 mm. f₀ = π w₁ w₂/λ = 20.26834 mm, a = w₁/w₂ + w₂/w₁ = 4.25:
  // 14.0625 f² + 800 f − (200² + 4.25² f₀²) = 0 → f = 36.21766 mm, s₁ = f + (d − 2f)/17 = 43.72147 mm.
  const p = { lambda: 1550e-9, w1: 50e-6, w2: 200e-6, d: 0.2 };
  const s = singleLensModeMatch(p);
  assertRel(s.f0, 2.026833970e-2, 1e-9, "f₀");
  assertRel(s.f, 3.621766059e-2, 1e-9, "f");
  assertRel(s.s1, 4.372146523e-2, 1e-9, "s₁");
  assertRel(s.s1 + s.s2, 0.2, 1e-12, "s₁ + s₂ = d");
  assert.equal(s.lensBetweenWaists, true);
  // Self's magnification m = 1/√((1 − s/f)² + (z_R1/f)²) = w₂/w₁ = 4.
  assertRel(1 / Math.hypot(1 - s.s1 / s.f, zR(p.lambda, p.w1) / s.f), 4, 1e-9, "Self magnification");
  // The traced q at z = d is i z_R2: a waist of 200 µm there, and η = 1.
  const q = qAfterLens(p.lambda, p.w1, s.s1, s.f, s.s2);
  assert.ok(Math.abs(q.re) < 1e-12, `waist at d: Re q = ${q.re}`);
  assertRel(q.im, zR(p.lambda, p.w2), 1e-9, "Im q = z_R2");
  assertRel(couplingAtLensPosition(p, s.f, s.s1), 1, 1e-12, "η");

  // λ 1550 nm, 100 → 200 µm, d 500 mm: 2.25 f² + 2000 f − (500² + 6.25 f₀²) = 0 → f = 115.2041 mm, s₁ = 169.1225 mm.
  const s2 = singleLensModeMatch({ lambda: 1550e-9, w1: 100e-6, w2: 200e-6, d: 0.5 });
  assertRel(s2.f, 0.1152040898, 1e-9, "f (beam-waist-matching defaults)");
  assertRel(s2.s1, 0.1691224539, 1e-9, "s₁ (beam-waist-matching defaults)");
});

test("Mode matching: equal waists, lens outside the waists, invalid input", () => {
  // w₁ = w₂: the quadratic is linear, f = d/4 + f₀²/d, lens midway.
  const p = { lambda: 1550e-9, w1: 100e-6, w2: 100e-6, d: 0.5 };
  const s = singleLensModeMatch(p);
  const f0 = (Math.PI * 1e-8) / 1550e-9;
  assertRel(s.f, 0.125 + (f0 * f0) / 0.5, 1e-12, "f for equal waists");
  assertRel(s.s1, 0.25, 1e-12, "s₁ = d/2");
  // Large → small waist over d < 2f₀: the lens would sit before the input waist (s₁ < 0).
  const back = singleLensModeMatch({ lambda: 1550e-9, w1: 500e-6, w2: 50e-6, d: 0.05 });
  assert.ok(back.s1 < 0 && back.lensBetweenWaists === false, `s₁ = ${back.s1}`);
  assert.ok(Number.isNaN(singleLensModeMatch({ ...p, d: 0 }).f));
  assert.ok(Number.isNaN(singleLensModeMatch({ ...p, w2: -1e-6 }).f));
});

test("Gaussian overlap η (Joyce & DeLoach 1984)", () => {
  // Waists 50 and 200 µm in one plane: η = 4/(w₁/w₂ + w₂/w₁)² = 4/4.25² = 0.2214533.
  const a = { re: 0, im: zR(1550e-9, 50e-6) };
  const b = { re: 0, im: zR(1550e-9, 200e-6) };
  assertRel(gaussianOverlap(a, b), 4 / 4.25 ** 2, 1e-12, "size mismatch");
  // With curvature mismatch: η = 4/((w₁/w₂ + w₂/w₁)² + (π w₁ w₂/λ)² (1/R₁ − 1/R₂)²);
  // λ 1 µm, w 1 and 1.5 mm, R 2 m and −3 m: 4/(4.694444 + 4.712389² · 0.694444) = 0.1988496.
  const q = (w: number, R: number) => {
    const u = { re: 1 / R, im: -1e-6 / (Math.PI * w * w) };
    const m = u.re * u.re + u.im * u.im;
    return { re: u.re / m, im: -u.im / m };
  };
  assertRel(gaussianOverlap(q(1e-3, 2), q(1.5e-3, -3)), 0.1988496417, 1e-9, "curvature mismatch");
  assert.ok(Number.isNaN(gaussianOverlap({ re: 0, im: 0 }, b)));
  // Best placement of the exact lens recovers s₁ and η = 1; a 40 mm lens can only reach η < 1.
  const p = { lambda: 1550e-9, w1: 50e-6, w2: 200e-6, d: 0.2 };
  const best = bestLensPosition(p, singleLensModeMatch(p).f);
  assertRel(best.s, 4.372146523e-2, 1e-6, "best s for the exact f");
  assertRel(best.eta, 1, 1e-10, "best η for the exact f");
  const stock = bestLensPosition(p, 0.04);
  assert.ok(stock.eta > 0.9 && stock.eta < 0.99, `η(40 mm) = ${stock.eta}`);
});

test("Spatial filter: focal spot, pinhole throughput, far field (Uehara & Kikuchi 1986)", () => {
  // 1064 nm, 1 mm 1/e² diameter input, f 50 mm: w_f = λ f/(π w_in) = 33.86817 µm.
  const wf = focusedSpotRadius(1064e-9, 500e-6, 0.05);
  assertRel(wf, 3.386817189e-5, 1e-9, "w_f");
  assertRel(focusedSpotRadius(1064e-9, 500e-6, 0.05, 1.3), 1.3 * 3.386817189e-5, 1e-9, "M² w_f");
  // T = 1 − exp(−2a²/w²): 1 − e⁻² = 0.8646647 at a = w_f (pinhole = 1/e² diameter), 1 − e^−4.5 = 0.9888910 at 1.5 w_f.
  assertRel(pinholeTransmission(wf, wf), 0.8646647168, 1e-9, "T(a = w)");
  assertRel(pinholeTransmission(1.5 * wf, wf), 0.9888910035, 1e-9, "T(a = 1.5 w)");
  assertRel(pinholeRadiusForTransmission(0.99, wf) / wf, Math.sqrt(Math.log(100) / 2), 1e-12, "a for 99 %");
  assert.equal(pinholeTransmission(0, wf), 0);
  // Airy first-zero diameter of a uniformly filled 1 mm aperture at f 50 mm, 1064 nm: 2.44 λ f/D = 129.808 µm.
  assertRel(airyDiskDiameter(1064e-9, 0.05, 1e-3), 1.29808e-4, 1e-9, "Airy diameter");
  // Far field on axis: (1 − exp(−a²/w²))², 0.8003105 for a = 1.5 w.
  assertRel(pinholeFarFieldIntensity(1064e-9, wf, 1.5 * wf, 0.1, 0), (1 - Math.exp(-2.25)) ** 2, 1e-6, "on axis");
  // A pinhole much larger than the beam leaves the Gaussian exp(−2ρ²/W²), W = λz/(π w): e⁻² at ρ = W.
  const W = (1064e-9 * 0.1) / (Math.PI * wf);
  assertRel(pinholeFarFieldIntensity(1064e-9, wf, 10 * wf, 0.1, W), Math.exp(-2), 1e-6, "uncut Gaussian at ρ = W");
  // Independent series: expanding J₀ term by term, E(ρ)/E_full(0) = Σₘ (−1)ᵐ (κw/2)²ᵐ/m! · P(m + 1, a²/w²), with P the
  // regularised lower incomplete gamma function; κw = 2 at ρ = W. Truncation at a = 1.5 w puts more light at ρ = W
  // than the uncut beam has (0.1630 vs e⁻² = 0.1353).
  let series = 0;
  let term = 1;
  for (let m = 0; m < 40; m++) {
    series += term * regularizedGammaP(m + 1, 2.25);
    term *= -1 / (m + 1);
  }
  assertRel(pinholeFarFieldIntensity(1064e-9, wf, 1.5 * wf, 0.1, W), series * series, 1e-6, "cut beam at ρ = W");
  assert.ok(Math.abs(series * series - 0.16302) < 1e-5, `series ${series * series}`);
});
