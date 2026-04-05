import test from "node:test";
import assert from "node:assert/strict";

import { calculateEducationalContinuousMpe } from "../src/lib/laser-safety-mpe.ts";
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

test("rejects blue-light long-duration branch instead of approximating through it", () => {
  const result = calculateEducationalContinuousMpe(450, 10.001);
  assert.equal(result.status, "unsupported");
  if (result.status !== "unsupported") return;
  assert.match(result.reason, /blue-light|C_B|photochemical/i);
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
