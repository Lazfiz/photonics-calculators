import test from "node:test";
import assert from "node:assert/strict";

import { nepSummary } from "../src/physics/detectors/nep";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// E. L. Dereniak, G. D. Boreman, Infrared Detectors and Systems (Wiley 1996), ch. 5: NEP = i_n/ℛ, D* = √(A·B)/NEP with
// i_shot = √(2q·I_d·B), i_th = √(4k_BT·B/R_L). Values re-derived with an independent script (own constants).
test("nepSummary: 10 nA, 0.8 A/W, 1 Hz, 300 K, 50 Ω, 0.01 cm²", () => {
  const s = nepSummary({ darkCurrent: 10e-9, responsivity: 0.8, bandwidth: 1, temperature: 300, loadResistor: 50, area_cm2: 0.01 });
  assertRel(s.iShot, 5.660700723408719e-14, 1e-9, "shot");
  assertRel(s.iThermal, 1.820317994197717e-11, 1e-9, "thermal");
  assertRel(s.totalNoiseCurrent, 1.8203267958069176e-11, 1e-9, "total");
  assertRel(s.nep, 2.2754084947586468e-11, 1e-9, "NEP");
  assertRel(s.nepSpectral, 2.2754084947586468e-11, 1e-9, "NEP spectral");
  assertRel(s.detectivity, 4394815270.767768, 1e-9, "D*");
  assert.equal(s.noiseFree, false);
});

test("nepSummary: 77 K, 1 MHz, 10 kΩ; the spectral NEP is the NEP over √B", () => {
  const s = nepSummary({ darkCurrent: 1e-9, responsivity: 0.5, bandwidth: 1e6, temperature: 77, loadResistor: 1e4, area_cm2: 0.04 });
  assertRel(s.nep, 1.3046997008151722e-9, 1e-9, "NEP");
  assertRel(s.nepSpectral, 1.3046997008151723e-12, 1e-9, "NEP spectral");
  assertRel(s.detectivity, 153291979660.17822, 1e-9, "D*");
});

test("nepSummary: no dark current at T = 0 has no noise, so the NEP and D* are undefined", () => {
  const s = nepSummary({ darkCurrent: 0, responsivity: 0.8, bandwidth: 1, temperature: 0, loadResistor: 50, area_cm2: 0.01 });
  assert.equal(s.noiseFree, true);
  assert.ok(!Number.isFinite(s.detectivity));
});
