import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateEducationalContinuousMpe,
  correctionCb,
  crossoverT1Seconds,
} from "../src/lib/laser-safety-mpe";
import {
  cornealIrradianceWcm2,
  cwPointSourceNohdPrecheck,
  cwPointSourceOdPrecheck,
  divergenceMradToRad,
  powerMwToW,
} from "../src/lib/laser-safety-cw-suite";

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
});

// Golden values: ICNIRP 2013 (Health Phys. 105(3), 271, doi:10.1097/HP.0b013e3182983fd4) Table 5, retinal thermal
// 18 t^0.75 J/m² to 10 s, then 10 C_A W/m²; Table 8, 7 mm aperture. NOHD = (D − a)/φ, D = √(4P/(π E_MPE)), 1/e values
// (ANSI Z136.1 App. B), checked by hand.
function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

test("the MPE at 532 nm, 0.25 s and the 10 s joint (the lower of the two pieces)", () => {
  const r = calculateEducationalContinuousMpe(532, 0.25);
  assert.equal(r.status, "supported");
  if (r.status !== "supported") return;
  assertRel(r.radiantExposureMpe_mJcm2, 0.636396, 1e-5, "H(0.25 s)");
  assertRel(r.equivalentIrradianceMpe_mWcm2, 2.545584, 1e-5, "E(0.25 s)");
  for (const nm of [430, 470, 550, 850]) {
    const at10 = calculateEducationalContinuousMpe(nm, 10);
    assert.equal(at10.status, "supported");
    if (at10.status !== "supported") return;
    // 18 · 10^0.75 = 101.2 J/m² above 10 W/m² × 10 s: the joint takes the 10 s piece.
    assert.ok(at10.radiantExposureMpe_mJcm2 <= 10 * (nm > 700 ? Math.pow(10, 2 * (nm / 1000 - 0.7)) : 1) + 1e-9, `${nm} nm`);
  }
});

test("irradiance is averaged over the 7 mm aperture", () => {
  // Narrower beams put all of P into the aperture; wider ones show their 1/e peak 4P/(πd²).
  assertRel(cornealIrradianceWcm2(500, 3), 0.5 / (Math.PI * 0.35 ** 2), 1e-12, "3 mm");
  assertRel(cornealIrradianceWcm2(500, 0.5), 0.5 / (Math.PI * 0.35 ** 2), 1e-12, "0.5 mm");
  assertRel(cornealIrradianceWcm2(500, 10), 0.5 / (Math.PI * 0.5 ** 2), 1e-12, "10 mm");
});

test("OD for 500 mW at 532 nm, 0.25 s: 2.708 for any beam narrower than 7 mm", () => {
  for (const beamDefinition of ["1/e", "1/e2"] as const) {
    const r = cwPointSourceOdPrecheck({ wavelengthNm: 532, exposureS: 0.25, powerMw: 500, beamDiameterMm: 3, beamDefinition });
    assert.equal(r.status, "supported");
    if (r.status !== "supported") return;
    assertRel(r.requiredOd, Math.log10(0.5 / (Math.PI * 0.35 ** 2) / 2.545584e-3), 1e-6, beamDefinition);
    assertRel(r.requiredOd, 2.7079, 1e-4, beamDefinition);
  }
});

test("NOHD starts the beam at its own diameter, not at 7 mm", () => {
  const nohd = (beamDefinition: "1/e" | "1/e2", powerMw = 100, divergenceMrad = 1, beamDiameterMm = 2) => {
    const r = cwPointSourceNohdPrecheck({ wavelengthNm: 532, exposureS: 0.25, powerMw, beamDiameterMm, divergenceMrad, beamDefinition });
    assert.equal(r.status, "supported");
    return r.status === "supported" ? r : undefined;
  };
  // D = √(4 · 0.1 W/(π · 2.545584e-3 W/cm²)) = 7.0725 cm.
  assertRel(nohd("1/e")!.nohdM, 68.725, 1e-4, "1/e: (70.725 − 2)/1");
  assertRel(nohd("1/e2")!.nohdM, (70.725 - 2 / Math.SQRT2) / (1 / Math.SQRT2), 1e-4, "1/e²: values ÷ √2");
  assertRel(nohd("1/e2")!.nohdM, 98.020, 1e-4, "1/e² default");
  assertRel(nohd("1/e", 500, 0.5)!.nohdM, 312.28, 1e-4, "500 mW, 0.5 mrad");
  assertRel(nohd("1/e", 5, 1, 1)!.nohdM, 14.81, 1e-3, "5 mW, 1 mm, 1 mrad");
  const r = nohd("1/e")!;
  assertRel(r.diameterAtNohdCm, 7.0725, 1e-4, "diameter at the NOHD is D");
  assertRel(r.irradianceAtDistance(r.nohdM), r.targetIrradianceWcm2, 1e-9, "the chart meets the target at the NOHD");
  // Edges: below ≈ 0.98 mW nothing is hazardous through 7 mm; a beam that doesn't spread stays hazardous.
  assert.equal(nohd("1/e", 0.9)!.nohdM, 0);
  assert.ok(nohd("1/e", 1.0)!.nohdM > 0);
  assert.equal(nohd("1/e", 100, 0)!.nohdM, Infinity);
  const bad = cwPointSourceNohdPrecheck({ wavelengthNm: 532, exposureS: 0.25, powerMw: 100, beamDiameterMm: 2, divergenceMrad: 1, safetyFactor: 0 });
  assert.equal(bad.status, "unsupported");
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
