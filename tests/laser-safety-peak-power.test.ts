import test from "node:test";
import assert from "node:assert/strict";

import { PULSE_SHAPE_FACTOR, peakPower, pulseTrain } from "../src/physics/laser-safety/peak-power";

// Definitions: E = P_avg/f, duty cycle D = τ·f, rectangular peak P_pk = E/τ = P_avg/D. Shape factors: Gaussian
// 2√(ln2/π) = 0.9394 and sech² ln(1+√2) = 0.8814 of E/τ (Paschotta, RP Photonics Encyclopedia, "Peak power").

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("10 W, 80 MHz, 0.1 %: 125 nJ, 12.5 ps, 10 kW (rectangular), 9.3944 kW Gaussian, 8.8137 kW sech²", () => {
  const p = pulseTrain(10, 80e6, 0.001);
  assertRel(p.energy, 125e-9, 1e-12, "energy");
  assertRel(p.duration, 12.5e-12, 1e-12, "duration");
  assertRel(p.peak, 10e3, 1e-12, "peak");
  assertRel(peakPower(p.energy, p.duration, "rectangular"), 10e3, 1e-12, "rectangular");
  assertRel(peakPower(p.energy, p.duration, "gaussian"), 9.3944e3, 1e-5, "Gaussian");
  assertRel(peakPower(p.energy, p.duration, "sech2"), 8.8137e3, 1e-5, "sech²");
});

test("shape factors: 1, 2√(ln2/π) = 0.939437, ln(1+√2) = 0.881374", () => {
  assert.equal(PULSE_SHAPE_FACTOR.rectangular, 1);
  assertRel(PULSE_SHAPE_FACTOR.gaussian, 0.939437, 1e-6, "Gaussian");
  assertRel(PULSE_SHAPE_FACTOR.sech2, 0.881374, 1e-6, "sech²");
  // Cross-check by integrating the pulse: peak × area-width = E. Gaussian exp(−4 ln2 t²/τ²) has area τ√(π/(4 ln2)).
  assertRel(PULSE_SHAPE_FACTOR.gaussian * Math.sqrt(Math.PI / (4 * Math.LN2)), 1, 1e-12, "Gaussian area");
  // sech²(t/t0) has area 2 t0 and FWHM 2 t0 ln(1+√2), so the area is τ/ln(1+√2).
  assertRel(PULSE_SHAPE_FACTOR.sech2 * (1 / Math.log(1 + Math.SQRT2)), 1, 1e-12, "sech² area");
});

test("1 µJ, 100 fs Gaussian → 9.3944 MW", () => {
  assertRel(peakPower(1e-6, 100e-15, "gaussian"), 9.3944e6, 1e-5, "ultrafast pulse");
});

test("the duty cycle is a fraction: 10 % gives a peak 10× the average, not 0.1×", () => {
  // The page used its "%" input as a fraction (0.1 % gave 100 W for 10 W average, 10 % gave 1 W: below the average).
  assertRel(pulseTrain(10, 1e3, 0.1).peak, 100, 1e-12, "10 %");
  assert.ok(pulseTrain(10, 1e3, 0.1).peak > 10);
});

test("edges: D = 100 % is continuous (peak = average), invalid input gives NaN", () => {
  const cw = pulseTrain(3, 1e6, 1);
  assert.equal(cw.peak, 3);
  assertRel(cw.duration, 1e-6, 1e-12, "τ = period");
  assertRel(cw.energy, 3e-6, 1e-12, "E = P/f");
  assert.equal(pulseTrain(0, 1e6, 0.5).peak, 0);
  for (const [P, f, D] of [[1, 1e6, 0], [1, 1e6, -0.1], [1, 1e6, 1.0001], [1, 0, 0.5], [1, -1, 0.5], [-1, 1e6, 0.5],
    [NaN, 1e6, 0.5], [1, Infinity, 0.5]]) {
    const p = pulseTrain(P, f, D);
    assert.ok(Number.isNaN(p.energy) && Number.isNaN(p.duration) && Number.isNaN(p.peak), `${P}, ${f}, ${D}`);
  }
  assert.ok(Number.isNaN(peakPower(1e-6, 0, "gaussian")));
  assert.ok(Number.isNaN(peakPower(-1e-6, 1e-12, "sech2")));
});
