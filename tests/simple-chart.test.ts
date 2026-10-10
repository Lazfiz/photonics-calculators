import test from "node:test";
import assert from "node:assert/strict";

import { formatTick, niceTicks } from "../src/components/simple-chart";

// The step is 1, 2, 5 or 10 × 10^k, the first ≥ range/count. Before the fix it was the bare multiplier
// (2 instead of 200 for 270–960 nm), which crowded 100 labels onto the x axis ("1.5k5k5k…") and left a
// single y tick at 0 for R/T in [0, 1.05] (ROADMAP Phase 3, session 25).
test("niceTicks: linear step scales with the range", () => {
  assert.deepEqual(niceTicks(270, 960, 6, false), [400, 600, 800]); // 690/6 = 115 → 200
  assert.deepEqual(niceTicks(0, 1.05, 6, false).map((t) => +t.toFixed(10)), [0, 0.2, 0.4, 0.6, 0.8, 1]);
  assert.deepEqual(niceTicks(1500, 1600, 6, false), [1500, 1520, 1540, 1560, 1580, 1600]); // 16.7 → 20
  assert.deepEqual(niceTicks(0, 10, 6, false), [0, 2, 4, 6, 8, 10]); // 1.67 → 2 (worked before too)
  assert.equal(niceTicks(-3e-15, 3e-15, 6, false).length, 7); // 1e-15 steps, −3 … 3 (rounding at both ends)
  assert.deepEqual(niceTicks(5, 5, 6, false), []);
});

test("niceTicks: log axis", () => {
  assert.deepEqual(niceTicks(1, 1000, 6, true), [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]);
  // A range that starts mid-decade keeps the 2× and 5× ticks below its first power of ten (they were dropped).
  assert.deepEqual(niceTicks(180, 20000, 6, true), [200, 500, 1000, 2000, 5000, 10000, 20000]);
  assert.deepEqual(niceTicks(0.3, 40, 6, true), [0.5, 1, 2, 5, 10, 20]);
});

// Labels carry the digits the step needs: 20 nm steps near 1.5 µm used to print "1.5k" five times.
test("formatTick: neighbouring labels differ", () => {
  const label = (min: number, max: number) => {
    const t = niceTicks(min, max, 6, false);
    return t.map((v) => formatTick(v, t));
  };
  assert.deepEqual(label(1500, 1600), ["1500", "1520", "1540", "1560", "1580", "1600"]);
  assert.deepEqual(label(270, 960), ["400", "600", "800"]);
  assert.deepEqual(label(0, 4000), ["0", "1.0k", "2.0k", "3.0k", "4.0k"]);
  assert.deepEqual(label(0, 1.05), ["0", "0.2", "0.4", "0.6", "0.8", "1.0"]);
  assert.deepEqual(label(0, 0.003), ["0", "5e-4", "1.0e-3", "1.5e-3", "2.0e-3", "2.5e-3", "3.0e-3"]);
  const log = niceTicks(1, 1e6, 6, true); // > 4 decades: decades only
  assert.deepEqual(log.map((v) => formatTick(v, log)), ["1", "10", "100", "1.0k", "10.0k", "100.0k", "1.0M"]);
});
