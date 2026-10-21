import assert from "node:assert/strict";
import { test } from "node:test";

import { LAMBDA_D, abbeNumber, fromResonanceWavelengths, inRange, refractiveIndex } from "../src/physics/materials/sellmeier";
import { MATERIALS } from "../src/physics/materials/sellmeier-data";
import {
  WINDOW_MATERIALS, fresnelLimitTransmission, surfaceReflectance, transmits, windowIndex,
} from "../src/physics/materials/window-materials";

const um = 1e-6;
const assertAbs = (actual: number, expected: number, tol: number, msg: string) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: ${actual} vs ${expected}`);

test("As₂S₃ (Rodney 1958): the materials audit's table values", () => {
  // Rodney, Malitson, King, JOSA 48, 633 (1958), measured n(1 µm) 2.4777 and n(4 µm) 2.4112 (PR #155 audit).
  // The old chalcogenide page's formula gave 1.846 at 4 µm and NaN near 5.9 µm.
  assertAbs(refractiveIndex(MATERIALS.as2s3.model, 1 * um), 2.4777, 1e-4, "As₂S₃ 1 µm");
  assertAbs(refractiveIndex(MATERIALS.as2s3.model, 4 * um), 2.4112, 1e-4, "As₂S₃ 4 µm");
  for (let l = 0.6; l <= 11.8; l += 0.1) {
    const n = refractiveIndex(MATERIALS.as2s3.model, l * um);
    assert.ok(n > 2.3 && n < 2.7, `As₂S₃ ${l.toFixed(1)} µm: ${n}`);
  }
});

test("ZBLAN (Gan 1995): hand evaluation of the formula and no pole inside the range", () => {
  // n² − 1 = 1.22514 λ²/(λ² − 0.08969²) + 1.52898 λ²/(λ² − 21.3825²), λ = 0.5875618 µm:
  // λ² = 0.345229; terms 1.254368 and −0.0011554 → n² = 2.253213, n = 1.501071.
  assertAbs(refractiveIndex(MATERIALS.zblan.model, LAMBDA_D), 1.501071, 2e-6, "ZBLAN n_d");
  // The old fluoride page: n_d 1.711 and a pole near 3 µm.
  for (let l = 0.37; l <= 3.5; l += 0.01) assert.ok(refractiveIndex(MATERIALS.zblan.model, l * um) > 1.47, `ZBLAN ${l.toFixed(2)} µm`);
  assert.ok(abbeNumber(MATERIALS.zblan.model) > 70);
});

test("alkali halides (Li 1976) agree with Crystran and an independent CsI measurement", () => {
  // Crystran: LiF 1.392 at 0.6 µm (5.2 % reflection loss, 2 surfaces); KBr 1.527 at 10 µm (8.3 %).
  assertAbs(refractiveIndex(MATERIALS.lif.model, 0.6 * um), 1.392, 5e-4, "LiF 0.6 µm");
  assertAbs(refractiveIndex(MATERIALS.kbr.model, 10 * um), 1.527, 1e-3, "KBr 10 µm");
  // Old uv-materials page: LiF 1.472 at 589 nm.
  assertAbs(refractiveIndex(MATERIALS.lif.model, 589.3e-9), 1.392, 5e-4, "LiF n_D");
  // CsI: Rodney, JOSA 45, 987 (1955), measured at 24 °C, is independent of Li's critical fit.
  const csiRodney = fromResonanceWavelengths(1, [0.34617251, 1.0080886, 0.285518, 0.39743178, 3.3605359],
    [0.0229567, 0.1466, 0.181, 0.212, 161], [0.2967, 50]);
  for (let l = 0.3; l <= 50; l *= 1.05) {
    assertAbs(refractiveIndex(MATERIALS.csi.model, l * um), refractiveIndex(csiRodney, l * um), 6e-4, `CsI ${l.toFixed(2)} µm`);
  }
});

test("Fresnel limit 2n/(n² + 1) reproduces Crystran's two-surface reflection losses", () => {
  // Audit value: Ge, n 4.0036 → 47.0 % (the old transparency page showed 87 %).
  assertAbs(fresnelLimitTransmission(4.0036), 0.4702, 1e-4, "Ge 4.0036");
  assertAbs(fresnelLimitTransmission(4.0036), (1 - surfaceReflectance(4.0036)) / (1 + surfaceReflectance(4.0036)), 1e-15, "(1 − R)/(1 + R)");
  // Crystran: [material, λ µm, reflection loss, tolerance]. The index comes from each material's formula.
  // Crystran rounds to 0.1 % or 1 %; diamond's 30 % is 29.4 % from its own n 2.4175.
  const cases: [keyof typeof WINDOW_MATERIALS, number, number, number][] = [
    ["ge", 11, 0.53, 5e-3], ["si", 5, 0.462, 1e-3], ["znse", 10.6, 0.291, 1e-3], ["zns", 10, 0.247, 1e-3],
    ["nacl", 10.6, 0.075, 1e-3], ["caf2", 5, 0.054, 1e-3], ["baf2", 5, 0.065, 1e-3], ["mgf2", 0.22, 0.057, 1e-3],
    ["lif", 0.6, 0.052, 1e-3], ["kbr", 10, 0.083, 1e-3], ["csi", 10, 0.136, 1e-3], ["sapphire", 1.06, 0.14, 5e-3],
    ["quartz", 0.6, 0.088, 1e-3], ["fusedSilica", 0.4, 0.07, 1e-3], ["bk7", 0.5875618, 0.081, 1e-3],
    ["diamond", 0.589, 0.3, 7e-3],
  ];
  for (const [id, l, loss, tol] of cases) {
    assertAbs(1 - fresnelLimitTransmission(windowIndex(WINDOW_MATERIALS[id], l * um)), loss, tol, id);
  }
  assertAbs(1 - fresnelLimitTransmission(2.371), 0.284, 6e-4, "KRS-5 (data-sheet n 2.371)");
});

test("domain: n = 1 transmits all, bad n is NaN, bands and fit ranges", () => {
  assert.equal(fresnelLimitTransmission(1), 1);
  assert.equal(surfaceReflectance(1), 0);
  assert.ok(Number.isNaN(fresnelLimitTransmission(0)));
  assert.ok(Number.isNaN(fresnelLimitTransmission(NaN)));
  assert.ok(Number.isNaN(surfaceReflectance(-1.5)));
  // Ge is opaque at 1 µm and outside its formula's 2–14 µm range; data-sheet-only KRS-5 has no formula index.
  assert.equal(transmits(WINDOW_MATERIALS.ge, 1 * um), false);
  assert.ok(Number.isNaN(windowIndex(WINDOW_MATERIALS.ge, 1 * um)));
  assert.ok(Number.isNaN(windowIndex(WINDOW_MATERIALS.krs5, 10 * um)));
  // Two bands: silicon transmits at 50 µm but not at 20 µm.
  assert.equal(transmits(WINDOW_MATERIALS.si, 50 * um), true);
  assert.equal(transmits(WINDOW_MATERIALS.si, 20 * um), false);
  assert.equal(inRange(MATERIALS.zblan.model, 4 * um), false);
});
