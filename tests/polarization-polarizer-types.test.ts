import test from "node:test";
import assert from "node:assert/strict";

import { sheetMetrics } from "../src/physics/polarization/sheet-polarizer";
import {
  POLARIZER_IDS, POLARIZERS, coversWavelength, polarizerFigures, type PolarizerSpec,
} from "../src/physics/polarization/polarizer-types";

function assertAbs(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} vs ${expected}`);
}

test("Glan-Taylor 100 000:1 (Thorlabs GT10): 50 dB, DOP 99 999/100 001 from unpolarized light", () => {
  const f = polarizerFigures(POLARIZERS["glan-taylor"]);
  assertAbs(f.erDb, 50, 1e-12, "ER dB");
  assertAbs(f.dop, 99_999 / 100_001, 1e-15, "DOP");
  assert.ok(Number.isNaN(f.k1), "no stated transmission → k₁ unknown");
});

test("film 38 % unpolarized at 1000:1 (Thorlabs LPVISE2X2): k₁ = 0.76/1.001, (k₁ + k₂)/2 returns 0.38", () => {
  const f = polarizerFigures(POLARIZERS.film);
  assertAbs(f.k1, 0.76 / 1.001, 1e-15, "k₁");
  assertAbs(f.k2, 0.76 / 1001, 1e-15, "k₂");
  assertAbs(f.tUnpolarized, 0.38, 1e-15, "round trip");
  // Shurcliff's efficiency (k₁ − k₂)/(k₁ + k₂) from sheet-polarizer.ts is the same DOP.
  assertAbs(f.dop, sheetMetrics(Math.log(f.k1), Math.log(f.k2)).efficiency, 1e-15, "DOP = efficiency");
  assertAbs(f.dop, 999 / 1001, 1e-15, "DOP");
});

test("PBS cube Tp 90 %, 1000:1 (Thorlabs PBS253): k₂ = 9 × 10⁻⁴, unpolarized T = 0.45045", () => {
  const f = polarizerFigures(POLARIZERS["pbs-cube"]);
  assertAbs(f.k1, 0.9, 0, "k₁");
  assertAbs(f.k2, 9e-4, 1e-18, "k₂");
  assertAbs(f.tUnpolarized, 0.45045, 1e-15, "T unpolarized");
  assertAbs(f.erDb, 30, 1e-12, "ER dB");
});

test("wire grid 150:1: DOP 149/151, 21.76 dB", () => {
  const f = polarizerFigures(POLARIZERS["wire-grid"]);
  assertAbs(f.dop, 149 / 151, 1e-15, "DOP");
  assertAbs(f.erDb, 10 * Math.log10(150), 1e-12, "ER dB");
});

test("ER below 1 (not a polarizer) gives NaN, not numbers", () => {
  const bad: PolarizerSpec = { ...POLARIZERS.rochon, er: 0.5 };
  const f = polarizerFigures(bad);
  assert.ok([f.erDb, f.dop, f.k1, f.k2, f.tUnpolarized].every(Number.isNaN));
});

test("wavelength coverage: range ends inclusive, single-wavelength plate ±1 %", () => {
  assert.equal(coversWavelength(POLARIZERS["wire-grid"], 2500e-9), true);
  assert.equal(coversWavelength(POLARIZERS["wire-grid"], 2499e-9), false);
  assert.equal(coversWavelength(POLARIZERS["glan-taylor"], 2300e-9), true);
  // PBSW-1064: Thorlabs tests its LIDT at 1054 nm, inside 1064 nm ± 1 % (1053.36–1074.64 nm).
  assert.equal(coversWavelength(POLARIZERS.plate, 1054e-9), true);
  assert.equal(coversWavelength(POLARIZERS.plate, 1053e-9), false);
  assert.equal(coversWavelength(POLARIZERS.plate, 0), false);
});

test("spec table: Thorlabs catalogue values as read 2026-10-23, consistent ranges and conditions", () => {
  assert.deepEqual(POLARIZERS["glan-taylor"].pulsed, { fluence_J_cm2: 20, lambda_nm: 1064, pulse_ns: 10, rate_Hz: 10 });
  assert.deepEqual(POLARIZERS["glan-thompson"].cw, { linear_W_cm: 2000, lambda_nm: 1064 });
  assert.equal(POLARIZERS.wollaston.er, 100_000);
  assert.equal(POLARIZERS.rochon.er, 10_000);
  assert.equal(POLARIZERS.plate.tPass, 0.95);
  for (const id of POLARIZER_IDS) {
    const s = POLARIZERS[id];
    assert.ok(s.er > 1 && s.lambdaMin_nm <= s.lambdaMax_nm && s.aperture_mm > 0, id);
    assert.ok(s.url.startsWith("https://www.thorlabs.com/"), `${id} url`);
    assert.ok(!(s.tPass !== undefined && s.tUnpolarized !== undefined), `${id}: one transmission basis`);
    if (s.pulsed) assert.ok(s.pulsed.fluence_J_cm2 > 0 && s.pulsed.pulse_ns > 0, `${id} pulsed`);
  }
});
