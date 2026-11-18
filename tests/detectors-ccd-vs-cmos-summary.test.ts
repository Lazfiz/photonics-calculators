import test from "node:test";
import assert from "node:assert/strict";

import { evaluateSensor, SENSORS } from "../src/physics/detectors/ccd-vs-cmos";

const assertRel = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg}: ${actual} vs ${expected}`);
const sensor = (id: string) => SENSORS.find((s) => s.id === id)!;

// Golden values from an independent scratch script: SNR = S/sqrt(F2*(S + D*t) + (read/G)^2) (Janesick, Photon Transfer, SPIE 2007),
// F2 = 2(G - 1)G^(-(N+1)/N) + 1/G with N = 536 (Robbins & Hadwen, IEEE TED 50, 1227, 2003), DR = 20 log10(S_max/(read/G)).
test("CCD, phone CMOS and EMCCD at 1000 photons, 1 s, G = 300", () => {
  const ccd = evaluateSensor(sensor("ccd"), 1000, 1, 300);
  assertRel(ccd.snr, 30.677083982425287, 1e-8, "CCD SNR");
  assertRel(ccd.dynamicRange, 90.45757490560675, 1e-8, "CCD DR");
  assertRel(evaluateSensor(sensor("phone"), 1000, 1, 300).snr, 25.320405081777643, 1e-8, "phone SNR");
  const em = evaluateSensor(sensor("emccd"), 1000, 1, 300);
  assertRel(em.snr, 21.928336149997257, 1e-8, "EMCCD SNR");
  assertRel(em.floor, 0.2966666666666667, 1e-12, "EMCCD floor");
  assertRel(em.dynamicRange, 79.07399960694062, 1e-8, "EMCCD DR");
});

test("saturation gives no SNR", () => {
  // EMCCD register well 800000/1000 = 800 e- < 950 e- signal; phone well 6000 e- < 5 e-/s * 1e4 s dark charge.
  const em = evaluateSensor(sensor("emccd"), 1000, 1, 1000);
  assert.equal(em.saturated, true);
  assert.ok(Number.isNaN(em.snr));
  assert.equal(evaluateSensor(sensor("phone"), 0, 1e4, 300).saturated, true);
});
