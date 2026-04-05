import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateEducationalContinuousMpe,
  correctionCb,
  crossoverT1Seconds,
} from "../src/lib/laser-safety-mpe.ts";
import {
  cornealIrradianceWcm2,
  cwPointSourceNohdPrecheck,
  cwPointSourceOdPrecheck,
  divergenceMradToRad,
  powerMwToW,
} from "../src/lib/laser-safety-cw-suite.ts";

test("supports short-duration visible thermal branch", () => {
  const result = calculateEducationalContinuousMpe(532, 0.25);
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  const expected = 1.8 * Math.pow(0.25, 0.75);
  assert.ok(Math.abs(result.radiantExposureMpe_mJcm2 - expected) < 1e-9);
});

test("applies ANSI-style CA factor in the supported NIR branch", () => {
  const result = calculateEducationalContinuousMpe(850, 1);
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  const expectedCa = Math.pow(10, 2 * (0.85 - 0.7));
  assert.ok(Math.abs(result.radiantExposureMpe_mJcm2 - 1.8 * expectedCa) < 1e-9);
});

test("supports 400-450 nm long-duration branch from 10 to 100 s", () => {
  const result = calculateEducationalContinuousMpe(440, 20);
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  assert.equal(result.radiantExposureMpe_mJcm2, 10);
  assert.equal(result.equivalentIrradianceMpe_mWcm2, 0.5);
});

test("supports 450-500 nm blue-light branch using Cb and T1", () => {
  const wavelength = 470;
  const cb = correctionCb(wavelength);
  const t1 = crossoverT1Seconds(wavelength);
  assert.ok(t1 && t1 > 10);
  const result = calculateEducationalContinuousMpe(wavelength, 60);
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  assert.ok(Math.abs(result.radiantExposureMpe_mJcm2 - 10 * cb) < 1e-9);
  assert.ok(Math.abs(result.equivalentIrradianceMpe_mWcm2 - (10 * cb) / 60) < 1e-9);
});

test("supports 500-700 nm long-duration constant irradiance branch", () => {
  const result = calculateEducationalContinuousMpe(532, 600);
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  assert.equal(result.equivalentIrradianceMpe_mWcm2, 1);
  assert.equal(result.radiantExposureMpe_mJcm2, 600);
});

test("supports 700-1050 nm long-duration CA-scaled branch", () => {
  const result = calculateEducationalContinuousMpe(850, 600);
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  const expectedCa = Math.pow(10, 2 * (0.85 - 0.7));
  assert.ok(Math.abs(result.equivalentIrradianceMpe_mWcm2 - expectedCa) < 1e-9);
});

test("rejects unsupported wavelengths outside bounded ocular suite", () => {
  const result = calculateEducationalContinuousMpe(1064, 1);
  assert.equal(result.status, "unsupported");
});

test("unit helpers stay explicit", () => {
  assert.equal(powerMwToW(500), 0.5);
  assert.equal(divergenceMradToRad(1.2), 0.0012);
  assert.ok(Math.abs(cornealIrradianceWcm2(1000, 2) - (1 / (Math.PI * 0.1 * 0.1))) < 1e-12);
});

test("OD precheck gets stricter when safety factor increases", () => {
  const base = cwPointSourceOdPrecheck({ wavelengthNm: 532, exposureS: 0.25, powerMw: 100, beamDiameterMm: 2, safetyFactor: 1 });
  const safer = cwPointSourceOdPrecheck({ wavelengthNm: 532, exposureS: 0.25, powerMw: 100, beamDiameterMm: 2, safetyFactor: 10 });
  assert.equal(base.status, "supported");
  assert.equal(safer.status, "supported");
  if (base.status !== "supported" || safer.status !== "supported") return;
  assert.ok(safer.requiredOd > base.requiredOd);
});

test("NOHD precheck returns a positive distance for a hazardous direct beam", () => {
  const result = cwPointSourceNohdPrecheck({ wavelengthNm: 532, exposureS: 0.25, powerMw: 100, beamDiameterMm: 2, divergenceMrad: 1, safetyFactor: 1 });
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  assert.ok(result.nohdM > 0);
  assert.ok(result.irradianceAtDistance(result.nohdM * 1.2) < result.targetIrradianceWcm2);
});
