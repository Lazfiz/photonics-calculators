import test from "node:test";
import assert from "node:assert/strict";

import { circularPolarizer, linearPolarizer, linearRetarder, rotator } from "../src/physics/polarization/jones";
import {
  type MuellerMatrix, applyMueller, bandAveragedRetardance, bandAveragedRetardanceSweep, chainMueller,
  muellerCircularPolarizer, muellerRetarderBandSweep,
  muellerDepolarizer, muellerFromJones, muellerPolarizer, muellerRetarder, muellerRetarderBandAveraged,
  muellerRotator,
} from "../src/physics/polarization/mueller";
import { type Stokes, degreeOfPolarization } from "../src/physics/polarization/stokes";

const deg = Math.PI / 180;

function assertVec(actual: number[], expected: number[], tol: number, label: string) {
  actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < tol, `${label}[${i}]: ${actual} vs ${expected}`));
}
const assertMat = (A: MuellerMatrix, B: MuellerMatrix, tol: number, label: string) =>
  A.forEach((row, i) => assertVec(row, B[i], tol, `${label} row ${i}`));

test("Mueller: the closed-form matrices equal the Jones ones mapped through M_ij = ½ tr(J† σi J σj)", () => {
  for (const t of [0, 22.5, 30, -50, 135]) {
    assertMat(muellerPolarizer(t * deg), muellerFromJones(linearPolarizer(t * deg)), 1e-15, `polarizer ${t}°`);
    assertMat(muellerRotator(t * deg), muellerFromJones(rotator(t * deg)), 1e-15, `rotator ${t}°`);
    for (const g of [90, 180, 37]) {
      assertMat(muellerRetarder(g * deg, t * deg), muellerFromJones(linearRetarder(g * deg, t * deg)), 1e-15, `retarder ${g}° at ${t}°`);
    }
  }
  assertMat(muellerCircularPolarizer("right"), muellerFromJones(circularPolarizer("right")), 1e-15, "right circular");
  assertMat(muellerCircularPolarizer("left"), muellerFromJones(circularPolarizer("left")), 1e-15, "left circular");
});

test("Mueller: Goldstein's quarter-wave plate, fast axis horizontal, takes +45° to LCP", () => {
  assertVec(applyMueller(muellerRetarder(Math.PI / 2, 0), [1, 0, 1, 0]), [1, 0, 0, -1], 1e-15, "QWP");
  assertVec(applyMueller(muellerRetarder(Math.PI / 2, 45 * deg), [1, 1, 0, 0]), [1, 0, 0, 1], 1e-15, "QWP 45° on H");
  assertVec(applyMueller(muellerRetarder(Math.PI, 22.5 * deg), [1, 1, 0, 0]), [1, 0, 1, 0], 1e-15, "HWP 22.5° on H");
});

test("Mueller: rotator sense, Malus and chain order", () => {
  assertVec(applyMueller(muellerRotator(45 * deg), [1, 1, 0, 0]), [1, 0, 1, 0], 1e-15, "rotator 45° on H");
  assert.ok(Math.abs(applyMueller(muellerPolarizer(30 * deg), [1, 1, 0, 0])[0] - 0.75) < 1e-15);
  const S = applyMueller(chainMueller([muellerPolarizer(45 * deg), muellerPolarizer(90 * deg)]), [1, 1, 0, 0]);
  assert.ok(Math.abs(S[0] - 0.25) < 1e-15, `H → P45 → PV: ${S[0]}`);
  assert.ok(applyMueller(chainMueller([muellerPolarizer(90 * deg), muellerPolarizer(45 * deg)]), [1, 1, 0, 0])[0] < 1e-15);
});

test("Mueller: the isotropic depolarizer diag(1, d, d, d) is realisable for −1/3 ≤ d ≤ 1 only", () => {
  const S = applyMueller(muellerDepolarizer(0.5), [1, 0.6, 0, 0.8]);
  assert.ok(Math.abs(degreeOfPolarization(S) - 0.5) < 1e-15);
  assert.ok(muellerDepolarizer(-1 / 3).flat().every(Number.isFinite));
  assert.ok(muellerDepolarizer(1).flat().every(Number.isFinite));
  for (const d of [-0.34, 1.01, NaN]) assert.ok(muellerDepolarizer(d).flat().every(Number.isNaN), `d = ${d}`);
});

// Si and Ci by their power series (Abramowitz & Stegun §5.2), fine to ~1e-12 for x ≤ 15.
function si(x: number): number {
  let sum = 0, term = x;
  for (let k = 0; k < 60; k++) {
    sum += term / (2 * k + 1);
    term *= (-x * x) / ((2 * k + 2) * (2 * k + 3));
  }
  return sum;
}
function ci(x: number): number {
  let sum = 0, term = (-x * x) / 2;
  for (let k = 1; k < 60; k++) {
    sum += term / (2 * k);
    term *= (-x * x) / ((2 * k + 1) * (2 * k + 2));
  }
  return 0.5772156649015329 + Math.log(x) + sum;
}

test("Mueller: band-averaged retardance against the closed-form integrals of cos(a/λ) and sin(a/λ)", () => {
  // ∫cos(a/λ)dλ = λ cos(a/λ) + a Si(a/λ) and ∫sin(a/λ)dλ = λ sin(a/λ) − a Ci(a/λ) (differentiate to check).
  // One wave at 1 µm, flat from 0.5 to 1.5 µm: a/λ runs from 4.19 to 12.57 rad.
  const lam0 = 1e-6, lo = 0.5e-6, hi = 1.5e-6, a = 2 * Math.PI * lam0;
  const F = (l: number) => l * Math.cos(a / l) + a * si(a / l);
  const G = (l: number) => l * Math.sin(a / l) - a * ci(a / l);
  const { meanCos, meanSin } = bandAveragedRetardance(1, lam0, lo, hi);
  assert.ok(Math.abs(meanCos - (F(hi) - F(lo)) / (hi - lo)) < 1e-7, `⟨cos Γ⟩ ${meanCos}`);
  assert.ok(Math.abs(meanSin - (G(hi) - G(lo)) / (hi - lo)) < 1e-7, `⟨sin Γ⟩ ${meanSin}`);
});

test("Mueller: a narrow band averages to the sinc law; zero bandwidth is the plain retarder", () => {
  // m = 1000.25 waves at 1 µm over 0.1 nm: Γ0 = 2000.5π, so ⟨cos Γ⟩ ≈ 0 and ⟨sin Γ⟩ ≈ sinc(ΔΓ/2), ΔΓ = Γ0·B/λ0.
  // The curvature of 1/λ adds about 2e-5 rad here.
  const m = 1000.25, dG = 2 * Math.PI * m * 1e-4;
  const { meanCos, meanSin } = bandAveragedRetardance(m, 1e-6, 1e-6 - 0.5e-10, 1e-6 + 0.5e-10);
  assert.ok(Math.abs(meanCos) < 1e-4, `⟨cos Γ⟩ ${meanCos}`);
  assert.ok(Math.abs(meanSin - Math.sin(dG / 2) / (dG / 2)) < 1e-4, `⟨sin Γ⟩ ${meanSin}`);
  assertMat(muellerRetarderBandAveraged(5.3, 550e-9, 0, 45 * deg), muellerRetarder(2 * Math.PI * 5.3, 45 * deg), 1e-12, "B = 0");
  // A many-wave plate over a broad band depolarizes: +45°-axis plate on H light.
  const S: Stokes = applyMueller(muellerRetarderBandAveraged(83, 550e-9, 100e-9, 45 * deg), [1, 1, 0, 0]);
  assert.ok(degreeOfPolarization(S) < 0.1, `DOP ${degreeOfPolarization(S)}`);
  // Edges: no retardance; too many cycles to integrate; a bad band.
  assert.equal(bandAveragedRetardance(0, 1e-6, 0.5e-6, 1.5e-6).meanCos, 1);
  assert.ok(Number.isNaN(bandAveragedRetardance(1e6, 1e-6, 0.5e-6, 1.5e-6).meanCos));
  assert.ok(Number.isNaN(bandAveragedRetardance(10, 1e-6, -1e-6, 1.5e-6).meanCos));
});

test("Mueller: the cumulative bandwidth sweep matches the band average computed band by band", () => {
  const widths = [0, 20e-9, 37e-9, 100e-9, 100e-9, 400e-9];
  const sweep = bandAveragedRetardanceSweep(83.3, 550e-9, widths);
  widths.forEach((b, i) => {
    const direct = bandAveragedRetardance(83.3, 550e-9, 550e-9 - b / 2, 550e-9 + b / 2);
    assert.ok(Math.abs(sweep.meanCos[i] - direct.meanCos) < 1e-6, `⟨cos Γ⟩ at ${b}: ${sweep.meanCos[i]} vs ${direct.meanCos}`);
    assert.ok(Math.abs(sweep.meanSin[i] - direct.meanSin) < 1e-6, `⟨sin Γ⟩ at ${b}: ${sweep.meanSin[i]} vs ${direct.meanSin}`);
  });
  const M = muellerRetarderBandSweep(83.3, 550e-9, widths, 45 * deg);
  assertMat(M[3], muellerRetarderBandAveraged(83.3, 550e-9, 100e-9, 45 * deg), 1e-6, "sweep matrix");
  // Edges: a width that shrinks, or reaches λ = 0, makes it and every later band NaN.
  const bad = bandAveragedRetardanceSweep(5, 550e-9, [0, 100e-9, 50e-9, 200e-9]);
  assert.deepEqual(bad.meanCos.map(Number.isNaN), [false, false, true, true]);
  assert.ok(Number.isNaN(bandAveragedRetardanceSweep(5, 550e-9, [1100e-9]).meanSin[0]));
});
