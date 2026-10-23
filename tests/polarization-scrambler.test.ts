import test from "node:test";
import assert from "node:assert/strict";

import { largestSymmetricEigenvalue } from "../src/physics/math";
import { applyMueller, chainMueller, muellerRetarder } from "../src/physics/polarization/mueller";
import {
  type ScramblerStage, lockedGroup, residualDopVsTime, scramblerMeanMueller, stageMeanCosSin, stageMeanMueller,
  stageResonance, stageRetardance,
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

test("Scrambler: locked stage frequencies are averaged over their common period, not as a product of means", () => {
  // Two stages at 0° and 45°, Γm = 1.5 rad, both at 1 kHz in phase, input linear at 22.5°. By hand (mueller.ts
  // matrices), with c = cos Γ, s = sin Γ, Γ = Γm sin ωt shared: S_out = (1/√2)(c + s², c, s(1 − c)). Over a period
  // ⟨c⟩ = J₀(Γm), ⟨s²⟩ = (1 − J₀(2Γm))/2 and the odd terms vanish, so
  //   DOP = (1/√2)√[(J₀(1.5) + (1 − J₀(3))/2)² + J₀(1.5)²] = 0.884815608 (J₀ from A&S Table 9.1),
  // while the product of the stage means gives J₀(1.5) = 0.5118277.
  const J0_15 = 0.5118276717, J0_3 = -0.2600519549;
  const exact = Math.SQRT1_2 * Math.hypot(J0_15 + (1 - J0_3) / 2, J0_15);
  const S: Stokes = [1, Math.cos(45 * deg), Math.sin(45 * deg), 0];
  const locked = [sine(0, 1.5), sine(45 * deg, 1.5)];
  assert.ok(Math.abs(dopAfter(locked, S) - exact) < 1e-9, `locked ${dopAfter(locked, S)}`);
  const product = degreeOfPolarization(applyMueller(chainMueller(locked.map(stageMeanMueller)), S));
  assert.ok(Math.abs(product - J0_15) < 1e-9);
  // The numerical time average over whole periods agrees.
  const [actual] = residualDopVsTime(locked, S, [10e-3]);
  assert.ok(Math.abs(actual - exact) < 1e-4, `time average ${actual}`);
  const r = stageResonance([1e3, 1e3]);
  assert.ok(r && r.p === 1 && r.q === 1 && r.beatPeriod === Infinity);
  // 3 f₁ ≈ 2 f₂ within 0.5 %: flagged (q = 3, p = 2), with the beat period 1/|3 f₁ − 2 f₂| = 0.1 s.
  const r23 = stageResonance([1e3, 1.505e3]);
  assert.ok(r23 && r23.p === 2 && r23.q === 3 && Math.abs(r23.beatPeriod - 1 / 10) < 1e-12, JSON.stringify(r23));
  // The page defaults 1, √2, √5 kHz are not within 1 % of any p/q with p, q ≤ 4.
  assert.equal(stageResonance([1e3, Math.SQRT2 * 1e3, Math.sqrt(5) * 1e3]), null);
});

/** Brute-force long-time Stokes average: midpoint over `periods` of T, free stages averaged over `nPhase` drive phases. */
function bruteDop(stages: ScramblerStage[], S: Stokes, T: number, nT: number, free: number[] = [], nPhase = 1): number {
  const acc = [0, 0, 0, 0];
  for (let p = 0; p < nPhase; p++) {
    const ph = (2 * Math.PI * (p + 0.5)) / nPhase;
    for (let i = 0; i < nT; i++) {
      const t = ((i + 0.5) / nT) * T;
      const M = chainMueller(stages.map((s, k) =>
        muellerRetarder(free.includes(k) ? stageRetardance({ ...s, frequency: 0, phase: ph }, 0) : stageRetardance(s, t), s.axis)));
      applyMueller(M, S).forEach((v, r) => { acc[r] += v / (nT * nPhase); });
    }
  }
  return degreeOfPolarization(acc as Stokes);
}

test("Scrambler: lockedGroup finds the common period of locked stages", () => {
  assert.equal(lockedGroup([sine(0, 1, 1e3), sine(1, 1, 1414.2)]), null, "5000:7071 is beyond order 12");
  assert.deepEqual(lockedGroup([sine(0, 1, 2e3), sine(1, 1, 3e3), sine(2, 1, 5e3)]), { members: [0, 1, 2], harmonics: [2, 3, 5], period: 1e-3 });
  assert.deepEqual(lockedGroup([sine(0, 1, 1e3), sine(1, 1, Math.SQRT2 * 1e3), sine(2, 1, 2e3)]), { members: [0, 2], harmonics: [1, 2], period: 1e-3 });
});

test("Scrambler: locked averages match brute-force time averages (sine, ramp, drive phase, a free stage)", () => {
  const S: Stokes = [1, Math.cos(45 * deg), Math.sin(45 * deg), 0];
  // 2:3 sine with a drive phase.
  const a = [sine(0, 2, 2e3), { ...sine(45 * deg, 2.4, 3e3), phase: 1.1 }];
  const Se: Stokes = [1, 0.6, 0.48, 0.64];
  assert.ok(Math.abs(dopAfter(a, Se) - bruteDop(a, Se, 1e-3, 20000)) < 1e-10);
  // The drive phase changes the answer, which a product of means cannot show. The 1:1 pair of the previous test with
  // stage 2 in antiphase (Γ₂ = −Γ₁): by hand S_out = (1/√2)(c − s², c, −s(1 + c)), so
  // DOP = (1/√2)√[(J₀(1.5) − (1 − J₀(3))/2)² + J₀(1.5)²] = 0.371442 (A&S Table 9.1), against 0.884816 in phase.
  const anti = [sine(0, 1.5), { ...sine(45 * deg, 1.5), phase: Math.PI }];
  const J0_15 = 0.5118276717, J0_3 = -0.2600519549;
  assert.ok(Math.abs(dopAfter(anti, S) - Math.SQRT1_2 * Math.hypot(J0_15 - (1 - J0_3) / 2, J0_15)) < 1e-9);
  // Ramp 3:5 with phases: Simpson between flybacks against a 10⁶-point midpoint rule (error ≈ 1e-7 at the flybacks).
  const ramp = (axis: number, amplitude: number, frequency: number, phase: number): ScramblerStage =>
    ({ axis, bias: 0, amplitude, frequency, waveform: "ramp", phase });
  const r = [ramp(0, 6.28, 3e3, 0.3), ramp(45 * deg, 3, 5e3, 1)];
  const Sr: Stokes = [1, 0.6, 0.48, 0.64];
  assert.ok(Math.abs(dopAfter(r, Sr) - bruteDop(r, Sr, 1e-3, 1_000_000)) < 1e-6);
  // Stages 1 and 3 locked at 1:2, stage 2 free at √2 kHz: the module's E_T[M₃ E[M₂] M₁] against a grid over t and
  // over stage 2's phase.
  const three = [sine(0, 2, 1e3), sine(45 * deg, 1.7, Math.SQRT2 * 1e3), { ...sine(10 * deg, 2.2, 2e3), phase: 0.5 }];
  assert.ok(Math.abs(dopAfter(three, S) - bruteDop(three, S, 1e-3, 400, [1], 64)) < 1e-10);
});
