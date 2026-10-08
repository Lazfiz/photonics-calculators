import test from "node:test";
import assert from "node:assert/strict";

import {
  MEAN_TO_RMS, dgdAtExceedance, dgdExceedanceProbability, dgdPdf, maxwellSigma, meanDgd, pmdLimitedLength,
} from "../src/physics/fiber-optics/polarization-mode-dispersion";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

const PS_SQRT_KM = 1e-12 / Math.sqrt(1e3); // ps/√km → s/√m
const ps = 1e-12;

test("mean DGD = PMD·√L", () => {
  // Hand: 0.5 ps/√km over 100 km → 5 ps.
  assertRel(meanDgd(0.5 * PS_SQRT_KM, 100e3), 5 * ps, 1e-14, "⟨Δτ⟩");
});

test("Maxwellian moments: the pdf integrates to 1, has the given mean, and rms = mean/0.921", () => {
  // Trapezoid rule over [0, 12σ] (the tail beyond is < 1e-29).
  const mean = 5 * ps;
  const sigma = maxwellSigma(mean);
  const N = 6000;
  const h = (12 * sigma) / N;
  let m0 = 0, m1 = 0, m2 = 0;
  for (let i = 0; i <= N; i++) {
    const x = i * h;
    const w = (i === 0 || i === N ? 0.5 : 1) * h * dgdPdf(x, mean);
    m0 += w;
    m1 += w * x;
    m2 += w * x * x;
  }
  assertRel(m0, 1, 1e-10, "∫f");
  assertRel(m1, mean, 1e-10, "⟨Δτ⟩");
  // ⟨Δτ⟩ = √(8/(3π)) ⟨Δτ²⟩^½ = 0.9213 ⟨Δτ²⟩^½ (Maxwellian; Poole 1988).
  assertRel(MEAN_TO_RMS, 0.92132, 1e-5, "√(8/3π)");
  assertRel(Math.sqrt(m2), mean / MEAN_TO_RMS, 1e-10, "rms");
});

test("exceedance probability: 4.2e-5 above 3× the mean, and it inverts", () => {
  const mean = 5 * ps;
  // Duelk, IEEE 802.3 HSSG (Nov. 2006): P(DGD > 3⟨DGD⟩) ≈ 4.2×10⁻⁵.
  const p3 = dgdExceedanceProbability(3 * mean, mean);
  assert.ok(Math.abs(p3 - 4.2e-5) < 0.05e-5, `P(>3⟨Δτ⟩) = ${p3}`);
  // Simpson integral of the pdf from 3⟨Δτ⟩ to 12σ (independent of the closed form).
  const sigma = maxwellSigma(mean);
  const N = 4000;
  const a = 3 * mean;
  const h = (12 * sigma - a) / N;
  let tail = 0;
  for (let i = 0; i <= N; i++) tail += ((i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * h * dgdPdf(a + i * h, mean)) / 3;
  assertRel(p3, tail, 1e-8, "closed form vs integral");
  for (const p of [0.5, 1e-3, 4.2e-5, 1e-9, 1e-100]) {
    assertRel(dgdExceedanceProbability(dgdAtExceedance(p, mean), mean), p, 1e-9, `inverse at ${p}`);
  }
  // Edges: every DGD exceeds 0; p outside (0, 1] has no answer.
  assert.equal(dgdExceedanceProbability(0, mean), 1);
  assert.equal(dgdAtExceedance(1, mean), 0);
  assert.ok(Number.isNaN(dgdAtExceedance(0, mean)));
  assert.ok(Number.isNaN(dgdAtExceedance(1.5, mean)));
});

test("PMD-limited length for ⟨Δτ⟩ = 0.1 T_bit", () => {
  // Hand: 0.5 ps/√km at 10 Gb/s → T = 100 ps, ⟨Δτ⟩ ≤ 10 ps → √L ≤ 20 √km → 400 km.
  assertRel(pmdLimitedLength(0.5 * PS_SQRT_KM, 10e9), 400e3, 1e-12, "L at 10 Gb/s");
  // 4× the bit rate → 1/16 the length.
  assertRel(pmdLimitedLength(0.5 * PS_SQRT_KM, 40e9), 25e3, 1e-12, "L at 40 Gb/s");
});
