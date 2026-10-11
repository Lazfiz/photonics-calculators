import test from "node:test";
import assert from "node:assert/strict";

import { largestSymmetricEigenvalue } from "../src/physics/math";
import { applyMueller } from "../src/physics/polarization/mueller";
import {
  type ScramblerStage, residualDopVsTime, scramblerMeanMueller, stageMeanCosSin, stageResonance,
  worstCaseResidualDop,
} from "../src/physics/polarization/scrambler";
import { type Stokes, degreeOfPolarization } from "../src/physics/polarization/stokes";

// First zero of J₀ and J₀(1), Abramowitz & Stegun Tables 9.5 and 9.1.
const J0_ZERO = 2.404825557695773;
const J0_OF_1 = 0.7651976866;
const deg = Math.PI / 180;

const sine = (axis: number, amplitude: number, frequency = 1e3): ScramblerStage =>
  ({ axis, bias: 0, amplitude, frequency, waveform: "sine" });
const dopAfter = (stages: ScramblerStage[], S: Stokes) => degreeOfPolarization(applyMueller(scramblerMeanMueller(stages), S));

test("Scrambler: one sine-driven retarder at the J₀ zero scrambles 45° light but not light on its axis", () => {
  assert.ok(dopAfter([sine(0, J0_ZERO)], [1, 0, 1, 0]) < 1e-12);
  assert.ok(dopAfter([sine(0, J0_ZERO)], [1, 0, 0, 1]) < 1e-12, "circular input too");
  assert.ok(Math.abs(dopAfter([sine(0, J0_ZERO)], [1, 1, 0, 0]) - 1) < 1e-15, "H is on the 0° axis");
});

test("Scrambler: two stages 45° apart; residual DOP J₀(Γm)² for circular input", () => {
  const stages = [sine(0, 1), sine(45 * deg, 1, 1414.2)];
  assert.ok(Math.abs(dopAfter(stages, [1, 0, 0, 1]) - J0_OF_1 ** 2) < 1e-9);
  // At the J₀ zero every input is scrambled, including H, 45°, RCP and an ellipse.
  const full = [sine(0, J0_ZERO), sine(45 * deg, J0_ZERO, 1414.2)];
  for (const S of [[1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 1], [1, 0.6, 0.48, 0.64]] as Stokes[]) {
    assert.ok(dopAfter(full, S) < 1e-12, `input ${S}`);
  }
});

test("Scrambler: ramp drive closed forms", () => {
  const ramp = (amplitude: number, bias = 0): ScramblerStage => ({ axis: 0, bias, amplitude, frequency: 1, waveform: "ramp" });
  const full = stageMeanCosSin(ramp(2 * Math.PI));
  assert.ok(Math.abs(full.meanCos) < 1e-15 && Math.abs(full.meanSin) < 1e-15);
  const half = stageMeanCosSin(ramp(Math.PI));
  assert.ok(Math.abs(half.meanCos) < 1e-15 && Math.abs(half.meanSin - 2 / Math.PI) < 1e-15);
  assert.deepEqual(stageMeanCosSin(ramp(0, 0.3)), { meanCos: Math.cos(0.3), meanSin: Math.sin(0.3) });
});

test("Scrambler: the numerical time average converges to the closed form", () => {
  // One stage over whole periods equals the closed form J₀(1) on the S2 component (45° input).
  const one = [sine(0, 1)];
  const [r] = residualDopVsTime(one, [1, 0, 1, 0], [0.1]);
  assert.ok(Math.abs(r - J0_OF_1) < 1e-4, `one stage ${r}`);
  // Two incommensurate stages at the J₀ zero: the residual falls toward 0 as the window grows.
  const two = [sine(0, J0_ZERO, 1000), sine(45 * deg, J0_ZERO, 1000 * Math.SQRT2)];
  const res = residualDopVsTime(two, [1, 0, 0, 1], [1e-3, 1e-2, 1e-1]);
  assert.ok(res[0] > res[2] && res[2] < 0.01, `residuals ${res}`);
  assert.ok(Number.isNaN(residualDopVsTime(two, [1, 0, 0, 1], [0])[0]));
});

test("Scrambler: worst-case residual DOP over all inputs (Smith 1961 eigenvalues)", () => {
  // One stage at any amplitude keeps its axis state (H), so the worst case is 1.
  assert.ok(Math.abs(worstCaseResidualDop([sine(0, 1)]) - 1) < 1e-12);
  // Two stages at the J₀ zero scramble every input.
  assert.ok(worstCaseResidualDop([sine(0, J0_ZERO), sine(45 * deg, J0_ZERO, 1414.2)]) < 1e-12);
  // Two stages at Γm = 1: worst over the sphere ≥ every sampled input.
  const st = [sine(0, 1), sine(45 * deg, 1, 1414.2)];
  const worst = worstCaseResidualDop(st);
  for (const S of [[1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 1], [1, 0.6, 0.48, 0.64]] as Stokes[]) {
    assert.ok(dopAfter(st, S) <= worst + 1e-12);
  }
  // Eigenvalue routine by hand: [[2,1,0],[1,2,0],[0,0,1]] has eigenvalues 3, 1, 1; a diagonal matrix its largest entry.
  assert.ok(Math.abs(largestSymmetricEigenvalue([2, 1, 0, 1, 2, 0, 0, 0, 1]) - 3) < 1e-12);
  assert.equal(largestSymmetricEigenvalue([1, 0, 0, 0, 5, 0, 0, 0, 2]), 5);
});

test("Scrambler: locked stage frequencies break the product of stage means, and stageResonance flags them", () => {
  // Two stages at 0° and 45°, Γm = 1.5 rad, both at 1 kHz, input linear at 22.5°: the product of stage means gives
  // DOP 0.5118, but the phases are locked and the true long-time average (whole periods, numerical) is 0.8848.
  const S: Stokes = [1, Math.cos(45 * deg), Math.sin(45 * deg), 0];
  const locked = [sine(0, 1.5), sine(45 * deg, 1.5)];
  assert.ok(Math.abs(dopAfter(locked, S) - 0.5118) < 1e-4);
  const [actual] = residualDopVsTime(locked, S, [10e-3]);
  assert.ok(Math.abs(actual - 0.8848) < 1e-4, `locked ${actual}`);
  const r = stageResonance([1e3, 1e3]);
  assert.ok(r && r.p === 1 && r.q === 1 && r.beatPeriod === Infinity);
  // 3 f₁ ≈ 2 f₂ within 0.5 %: flagged (q = 3, p = 2), with the beat period 1/|3 f₁ − 2 f₂| = 0.1 s.
  const r23 = stageResonance([1e3, 1.505e3]);
  assert.ok(r23 && r23.p === 2 && r23.q === 3 && Math.abs(r23.beatPeriod - 1 / 10) < 1e-12, JSON.stringify(r23));
  // The page defaults 1, √2, √5 kHz are not within 1 % of any p/q with p, q ≤ 4.
  assert.equal(stageResonance([1e3, Math.SQRT2 * 1e3, Math.sqrt(5) * 1e3]), null);
});
