import test from "node:test";
import assert from "node:assert/strict";

import {
  type HologramSetup, dmdHologram, leeEfficiency, leeFields, leeOrderPower, superpixelEfficiency, superpixelFields,
} from "../src/physics/spatial-light-modulators/dmd-holography";
import schema from "../src/schemas/spatial-light-modulators/dmd-holography";
import { runSchema } from "../src/schemas/run";

const close = (actual: number, expected: number, rel: number, msg = "") =>
  assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${msg} ${actual} vs ${expected}`);
// Goorden, Bertolotti, Mosk, Opt. Express 22, 17999 (2014), Sec. 2: DLP7000 (V-4100), d = 13.68 µm, 1024 × 768,
// HeNe 633 nm, f₁ = 300 mm.
const goorden: HologramSetup = {
  method: "superpixel", lambda: 633e-9, pitch: 13.68e-6, focal: 0.3, columns: 1024, rows: 768, period: 4, superpixel: 4,
};
const run = (values: Record<string, number | string>) =>
  runSchema(schema, {
    ...Object.fromEntries(schema.inputs.map((i) => [i.key, i.default])),
    ...Object.fromEntries((schema.choices ?? []).map((c) => [c.key, c.default])),
    ...values,
  });
const magnitude = ([re, im]: readonly [number, number]) => Math.hypot(re, im);

test("Goorden et al. 2014 Sec. 2: n = 4 puts the aperture at (−0.87, 3.47) mm; largest radius 0.9 mm", () => {
  const r = dmdHologram(goorden);
  // |a| = λf₁/(n²d) = 633e-9 · 0.3/(16 · 13.68e-6) = 0.867599 mm; n|a| = 3.470395 mm, signs as printed.
  close(r.apertureX * 1e3, -0.87, 5e-3, "x");
  close(r.apertureY * 1e3, 3.47, 5e-3, "y");
  close(r.apertureX * 1e3, -0.8675987, 1e-6, "x hand");
  // Δk = 2πd r/(λf₁) ≤ π/(2n) ⇒ r ≤ λf₁/(4nd) = 0.867599 mm; the paper prints r = 0.9 mm.
  close(r.apertureRadius * 1e3, 0.9, 0.04, "r");
  assert.equal(r.finestPeriod, 16);
  assert.equal(r.cells, 256 * 192);
  // Phase steps 2π/n² and 2π/n between neighbouring pixels (Sec. 2: π/8 and π/2 for n = 4).
  close(r.phaseStepX, Math.PI / 8, 1e-12);
  close(r.phaseStepY, Math.PI / 2, 1e-12);
});

test("Goorden et al. 2014 Fig. 2: 343 fields for n = 3, 6561 for n = 4; 9 for n = 2 by hand", () => {
  assert.equal(superpixelFields(3).length, 343);
  assert.equal(superpixelFields(4).length, 6561);
  // n = 2: responses 1, i, −1, −i (each /4), so each axis takes −1, 0 or 1 quarter: 3 × 3.
  assert.equal(superpixelFields(2).length, 9);
  assert.deepEqual(superpixelFields(5), []);
});

test("Goorden et al. 2014 Sec. 4: calculated efficiency 10.3 % for n = 4, half the pixels on", () => {
  // [sin(π/2)/(16 sin(π/16))]² = (1/(16 · 0.1950903))² = 0.1026334.
  close(superpixelEfficiency(4), 0.103, 5e-3);
  close(superpixelEfficiency(4), 0.1026334, 1e-6);
  // n = 2: two neighbours on, |1 + i|/4 squared = 1/8.
  close(superpixelEfficiency(2), 1 / 8, 1e-12);
  // The brightest enumerated field is the same.
  close(Math.max(...superpixelFields(4).map(magnitude)) ** 2, superpixelEfficiency(4), 1e-9);
  close(Math.max(...superpixelFields(3).map(magnitude)) ** 2, superpixelEfficiency(3), 1e-9);
  assert.ok(Number.isNaN(superpixelEfficiency(2.5)));
});

test("Gutiérrez-Cuevas & Popoff 2024 after Eq. 22: 1/π² = 10.1 % for even p, sin²[π(p−1)/2p]/π² for odd p", () => {
  close(leeEfficiency(4), 0.101, 5e-3);
  close(leeEfficiency(2), 1 / Math.PI ** 2, 1e-12);
  // p = 3: sin²(π/3)/π² = 0.75/π² = 0.0759909.
  close(leeEfficiency(3), 0.0759909, 1e-6);
  // Odd p tends to 1/π².
  close(leeEfficiency(63), 1 / Math.PI ** 2, 1e-3);
  assert.ok(Number.isNaN(leeEfficiency(1)));
});

test("Lee cells (Eq. 22): p = 4 parallel encodes 2 amplitudes × 4 phases + 0, orthogonal 4 × 4 + 0", () => {
  const parallel = leeFields(4, "lee-parallel"), orthogonal = leeFields(4, "lee-orthogonal");
  assert.equal(parallel.length, 9);
  assert.equal(orthogonal.length, 17);
  close(Math.max(...parallel.map(magnitude)), 1 / Math.PI, 1e-12);
  close(Math.max(...orthogonal.map(magnitude)), 1 / Math.PI, 1e-12);
  // p = 3 parallel: wₓ = 1 and 2 give the same amplitude with whole and half-integer shifts: 3 + 3 phases + 0.
  assert.equal(leeFields(3, "lee-parallel").length, 7);
  // p = 5 parallel: wₓ = 1…4 give 2 amplitudes, each with whole and half-integer shifts: 4 × 5 + 0 = 21.
  assert.equal(leeFields(5, "lee-parallel").length, 21);
});

test("Lee orders of the brightest cell (Eq. 21): order −1 holds the efficiency, the orders sum to the duty cycle", () => {
  close(leeOrderPower(4, -1), leeEfficiency(4), 1e-12);
  close(leeOrderPower(4, 0), 0.25, 1e-12);
  // The pixel-grid orders m = ±p vanish for whole widths.
  assert.ok(leeOrderPower(4, 4) < 1e-30);
  // Parseval: Σ|c_m|² = mean of T² = wₓ/p = 1/2 for a 0/1 grating.
  let sum = 0;
  for (let m = -20000; m <= 20000; m++) sum += leeOrderPower(4, m);
  close(sum, 0.5, 1e-4);
  // p = 5: wₓ = 2, duty 2/5.
  sum = 0;
  for (let m = -20000; m <= 20000; m++) sum += leeOrderPower(5, m);
  close(sum, 0.4, 1e-4);
});

test("One footing: Eq. 22 equals the phasor sum times the flat-pixel envelope; superpixel n = 4 gives 8.21 %", () => {
  // Lee p = 4: two of four quarter-turn phasors, |1 + i|/4 squared = 1/8, times sinc²(π/4) = 0.8105695 → 1/π².
  const lee = dmdHologram({ ...goorden, method: "lee-parallel", period: 4 });
  close(lee.phasorEfficiency, 1 / 8, 1e-12);
  close(lee.envelope, (Math.sin(Math.PI / 4) / (Math.PI / 4)) ** 2, 1e-12);
  // Derived (not printed): 0.1026334 · sinc²(π/16) sinc²(π/4) = 0.1026334 · 0.987218 · 0.810569 = 0.0821279.
  const sp = dmdHologram(goorden);
  close(sp.phasorEfficiency, 0.1026334, 1e-6);
  close(sp.envelope, 0.800206, 1e-6);
  close(sp.efficiency, 0.0821279, 1e-6);
});

test("Lee geometry: order at λf₁/(pd), aperture radius half of that, carrier period p d", () => {
  const r = dmdHologram({ ...goorden, method: "lee-parallel", period: 3 });
  // 633e-9 · 0.3/(3 · 13.68e-6) = 4.627193 mm.
  close(r.apertureX * 1e3, -4.627193, 1e-6); // rₐ = −λf₁ν
  assert.equal(r.apertureY, 0);
  close(r.apertureRadius * 1e3, 2.3135965, 1e-6);
  close(r.carrierPeriod * 1e6, 41.04, 1e-12);
  // Fourier-plane resolution λf₁/(N d): 13.88158 mm/1024 = 13.5562 µm.
  close(r.spotX * 1e6, 13.556229, 1e-6);
  // A period wider than the array, or a fractional one, has no result.
  assert.ok(Number.isNaN(dmdHologram({ ...goorden, method: "lee-parallel", period: 2.5 }).efficiency));
  assert.ok(Number.isNaN(dmdHologram({ ...goorden, columns: 3 }).cells));
});

test("API schema: superpixels have no carrier period and n > 4 no field count, each with a reason", () => {
  const sp = run({});
  assert.equal(sp.outputs.carrierPeriod, null);
  assert.ok(sp.warnings.some((w) => w.includes("no carrier grating")));
  const big = run({ superpixel: 6 });
  assert.equal(big.outputs.values, null);
  assert.ok(big.warnings.some((w) => w.includes("2^(n²)")));
  close(big.outputs.phasorEfficiency as number, 100 * superpixelEfficiency(6), 1e-12);
  const lee = run({ method: "lee-orthogonal", period: 5 });
  assert.equal(lee.outputs.values, 26);
  close(lee.outputs.carrierPeriod as number, 68.4, 1e-12);
});
