import test from "node:test";
import assert from "node:assert/strict";

import {
  afterpulseProbability, countLoss, measuredRate, nonParalyzableFano, paralyzablePeakRate, parseDeadTimeModel,
  trueRateAtLoss,
} from "../src/physics/detectors/dead-time";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("recorded rate: non-paralyzable R/(1 + Rτ), paralyzable R·e^{−Rτ} (Knoll 2010 ch. 4; Müller 1973)", () => {
  // 10 Mcps through 25 ns: Rτ = 0.25, so 10/1.25 = 8 Mcps and 10·e^{−0.25} = 7.788007831 Mcps.
  close(measuredRate(1e7, 25e-9, "nonparalyzable"), 8e6, 1e-14);
  close(measuredRate(1e7, 25e-9, "paralyzable"), 7.788007830714049e6, 1e-14);
  close(countLoss(1e7, 25e-9, "nonparalyzable"), 0.2, 1e-14);
  close(countLoss(1e7, 25e-9, "paralyzable"), 1 - Math.exp(-0.25), 1e-14);
  // Small Rτ: both lose Rτ to first order, with no cancellation at Rτ = 1e-12.
  close(countLoss(1, 1e-12, "paralyzable"), 1e-12, 1e-9);
  close(countLoss(1, 1e-12, "nonparalyzable"), 1e-12, 1e-9);
  assert.equal(measuredRate(0, 25e-9, "paralyzable"), 0);
  assert.equal(measuredRate(1e7, 0, "nonparalyzable"), 1e7);
  assert.ok(Number.isNaN(measuredRate(-1, 25e-9, "nonparalyzable")));
  assert.ok(Number.isNaN(countLoss(1e7, -1e-9, "paralyzable")));
});

test("loss limits and the paralyzable peak 1/(eτ)", () => {
  // 10 % loss: Rτ = 1/9 (non-paralyzable) and −ln 0.9 (paralyzable); at 25 ns 4.444 and 4.214 Mcps.
  close(trueRateAtLoss(0.1, 25e-9, "nonparalyzable"), 1 / 9 / 25e-9, 1e-14);
  close(trueRateAtLoss(0.1, 25e-9, "paralyzable"), -Math.log(0.9) / 25e-9, 1e-14);
  // Round trip: the loss at that rate is 10 %.
  close(countLoss(trueRateAtLoss(0.1, 25e-9, "paralyzable"), 25e-9, "paralyzable"), 0.1, 1e-14);
  assert.ok(Number.isNaN(trueRateAtLoss(1, 25e-9, "nonparalyzable")));
  // The paralyzable recorded rate peaks at R = 1/τ, at 1/(eτ) = 14.715 Mcps for 25 ns, and falls on either side.
  const peak = paralyzablePeakRate(25e-9);
  close(peak, 1 / (Math.E * 25e-9), 1e-15);
  close(measuredRate(4e7, 25e-9, "paralyzable"), peak, 1e-14);
  assert.ok(measuredRate(3.6e7, 25e-9, "paralyzable") < peak && measuredRate(4.4e7, 25e-9, "paralyzable") < peak);
  assert.ok(Number.isNaN(paralyzablePeakRate(0)));
});

test("non-paralyzable count variance: Fano 1/(1 + Rτ)² (renewal theory, Cox 1962)", () => {
  // Intervals τ + Exp(R): mean 1/R + τ, variance 1/R², so Var N/E N = (1/R²)/(1/R + τ)² = 1/(1 + Rτ)².
  // At Rτ = 0.25 that is 0.64; a 4000-gate Monte Carlo of 1600 counts each gave 0.635 (session 71 probe).
  close(nonParalyzableFano(1e7, 25e-9), 0.64, 1e-14);
  assert.equal(nonParalyzableFano(1e7, 0), 1);
  // Corrected-rate SNR: N recorded counts → R̂ = m/(1 − mτ); δR̂/R̂ = δm/[m(1 − mτ)] = √(F·N)/[N(1 − mτ)] = 1/√N,
  // because 1 − mτ = 1/(1 + Rτ) = √F.
  const R = 1e7, tau = 25e-9, m = measuredRate(R, tau, "nonparalyzable");
  close(Math.sqrt(nonParalyzableFano(R, tau)), 1 - m * tau, 1e-14);
});

test("afterpulse probability η·e^{−t_d/τ} summed over trap levels (Cova 1991; Ziarkash 2018)", () => {
  // η = 0.05, τ = 20 ns, t_d = 50 ns: 0.05·e^{−2.5} = 4.1042499e-3.
  close(afterpulseProbability([{ eta: 0.05, tau: 20e-9 }], 50e-9), 4.104249931194941e-3, 1e-14);
  // A second level adds: + 0.01·e^{−50/200} = 7.7880078e-3, total 1.1892258e-2.
  close(afterpulseProbability([{ eta: 0.05, tau: 20e-9 }, { eta: 0.01, tau: 200e-9 }], 50e-9),
    4.104249931194941e-3 + 0.01 * Math.exp(-0.25), 1e-14);
  // t_d = 0 gives Σ η; an η = 0 level is ignored whatever its τ.
  assert.equal(afterpulseProbability([{ eta: 0.05, tau: 20e-9 }, { eta: 0, tau: 0 }], 0), 0.05);
  assert.ok(Number.isNaN(afterpulseProbability([{ eta: 1.5, tau: 20e-9 }], 50e-9)));
  assert.ok(Number.isNaN(afterpulseProbability([{ eta: 0.05, tau: 20e-9 }], -1)));
});

test("URL model ids", () => {
  assert.equal(parseDeadTimeModel("paralyzable"), "paralyzable");
  assert.equal(parseDeadTimeModel("toString"), "nonparalyzable");
  assert.equal(parseDeadTimeModel(""), "nonparalyzable");
});
