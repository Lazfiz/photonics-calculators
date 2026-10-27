import test from "node:test";
import assert from "node:assert/strict";

import { antiblooming, bloomingOnset } from "../src/physics/detectors/antiblooming";
import { prnuPattern, sensorNoise, shotPrnuCrossover, shotReadCrossover } from "../src/physics/detectors/sensor-noise";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);

test("read + quantization → shot crossover passes the full floor: S = σ_r² + K²/12", () => {
  // K = 20 e⁻/DN, σ_r = 2 e⁻: 4 + 400/12 = 37.333 e⁻ (hand calculation; quantization K/√12, Janesick 2007 ch. 5).
  close(shotReadCrossover(Math.hypot(2, 20 / Math.sqrt(12))), 4 + 400 / 12, 1e-12);
  close(shotReadCrossover(Math.hypot(2, 20 / Math.sqrt(12))), 37.3333333, 1e-8);
});

test("total noise with DSNU and PRNU (EMVA 1288 R3.1 Eq. 48)", () => {
  // uniformity defaults: S = 50 000, D = 100, σ_r = 5, PRNU 1 %, DSNU 2 e⁻.
  // total² = 50 000 + 100 + 25 + 2² + 500² = 300 129 → 547.8403; temporal² = 50 125 → 223.8861; spatial² = 250 004.
  const n = sensorNoise({ signal: 50000, dark: 100, read: 5, prnu: 0.01, dsnu: 2 });
  close(n.total, Math.sqrt(300129), 1e-12, "total");
  close(n.total, 547.8403, 1e-7, "total 4 d.p.");
  close(n.temporal, Math.sqrt(50125), 1e-12, "temporal");
  close(n.spatial, Math.sqrt(250004), 1e-12, "spatial");
  assert.equal(n.prnu, 500);
  assert.equal(n.darkShot, 10);
  // Without spatial terms it reduces to the shot + read noise of camera-snr.
  assert.equal(sensorNoise({ signal: 400, read: 3 }).total, Math.sqrt(409));
});

test("photon transfer curve with quantization (Janesick 2007 ch. 5; EMVA 1288 σ_q = K/√12)", () => {
  // photon-transfer defaults at full well: S = 50 000, σ_r = 10, PRNU 1 %, K = 2 e⁻/DN.
  // total² = 50 000 + 100 + 4/12 + 250 000 = 300 100.333 → 547.8141 e⁻ = 273.9071 DN; temporal → 223.8310 e⁻.
  const n = sensorNoise({ signal: 50000, read: 10, prnu: 0.01, electronsPerDn: 2 });
  close(n.total, Math.sqrt(300100 + 1 / 3), 1e-12, "total");
  close(n.total / 2, 273.9071, 1e-6, "total DN");
  close(n.temporal, 223.8310, 1e-6, "temporal");
  // Regime boundaries: shot = read at σ_r², shot = PRNU at 1/P².
  assert.equal(shotReadCrossover(10), 100);
  close(shotPrnuCrossover(0.01), 10000, 1e-12, "shot-PRNU crossover");
  const at = sensorNoise({ signal: 10000, read: 0, prnu: 0.01 });
  close(at.shot, at.prnu, 1e-12, "equal at the crossover");
  assert.equal(shotPrnuCrossover(0), Infinity);
});

test("sensor noise domain guards", () => {
  assert.ok(Number.isNaN(sensorNoise({ signal: -1, read: 5 }).total));
  assert.ok(Number.isNaN(sensorNoise({ signal: 100, read: 5, prnu: -0.01 }).shot));
  assert.ok(Number.isNaN(shotPrnuCrossover(Number.NaN)));
  assert.equal(sensorNoise({ signal: 0, read: 0 }).total, 0);
});

test("PRNU pattern has zero mean and unit sample rms (EMVA 1288 Eq. 24)", () => {
  const values = prnuPattern(80).flat();
  assert.equal(values.length, 6400);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
  assert.ok(Math.abs(mean) < 1e-12, `mean ${mean}`);
  close(sd, 1, 1e-12, "sd");
  // Deterministic, so the server render and the browser agree.
  assert.deepEqual(prnuPattern(8), prnuPattern(8));
  assert.deepEqual(prnuPattern(1), []);
});

test("anti-blooming drain: capped well and blooming onset (hand calculation)", () => {
  // W = 50 000, T = 0.8·W = 40 000, η = 0.99. 20 000 e⁻ above T: 19 800 drained, 200 kept, nothing spills.
  assert.deepEqual(antiblooming(60000, 50000, 0.8, 0.99), { collected: 40200, drained: 19800, spilled: 0 });
  // Blooming starts at N_b = 40 000 + 10 000/0.01 = 1.04 × 10⁶ e⁻, 20.8 full wells.
  close(bloomingOnset(50000, 0.8, 0.99), 1.04e6, 1e-12, "onset");
  // At 2 × 10⁶ e⁻ the well holds 50 000 and (1.96e6·0.01 − 10 000) = 9 600 e⁻ spill.
  const big = antiblooming(2e6, 50000, 0.8, 0.99);
  assert.equal(big.collected, 50000);
  close(big.spilled, 9600, 1e-9, "spilled");
  close(big.collected + big.drained + big.spilled, 2e6, 1e-12, "charge conserved");
  // Edges: below T it is linear; a perfect drain never blooms; a barrier at W blooms at W.
  assert.deepEqual(antiblooming(1000, 50000, 0.8, 0.99), { collected: 1000, drained: 0, spilled: 0 });
  assert.equal(bloomingOnset(50000, 0.8, 1), Infinity);
  assert.equal(bloomingOnset(50000, 1, 0.5), 50000);
  assert.ok(Number.isNaN(bloomingOnset(50000, 1.2, 0.5)));
  assert.ok(Number.isNaN(antiblooming(-1, 50000, 0.8, 0.99).collected));
});
