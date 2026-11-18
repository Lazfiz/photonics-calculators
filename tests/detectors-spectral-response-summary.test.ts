import test from "node:test";
import assert from "node:assert/strict";

import { crossing, spectralResponseSummary } from "../src/physics/detectors/spectral-response";

function assertRel(actual: number, expected: number, tol: number, label: string) {
  assert.ok(Math.abs(actual / expected - 1) < tol, `${label}: ${actual} vs ${expected}`);
}

// Gärtner (1959, doi:10.1103/PhysRev.116.84) η = (1 − R)[1 − e^(−αW)/(1 + αL)], α = 4π·k/λ with Green (2008) k (ln k linear between 10 nm nodes),
// ℛ = η·q·λ/(h·c). Values re-derived with an independent script (exact SI q, h, c) scanning the 250–1450 nm grid in 5 nm steps.
test("spectralResponseSummary: defaults (W = 20 µm, L = 100 µm, R = 0.05)", () => {
  const s = spectralResponseSummary({ W: 20e-6, L: 100e-6, reflectance: 0.05, measuredResponsivity: 0.6, measuredWavelength: 900e-9 });
  assert.equal(s.wavelengthNm.length, 241);
  assert.equal(s.wavelengthNm[240], 1450);
  assertRel(s.peakResponsivity, 0.6159853044045609, 1e-9, "peak");
  assert.equal(s.peakWavelengthNm, 850);
  assertRel(s.halfShortNm, 401.9602327012123, 1e-9, "half short");
  assertRel(s.halfLongNm, 1010.7484350682743, 1e-9, "half long");
  assertRel(s.responsivity650, 0.4979823126864359, 1e-9, "R 650");
  assertRel(s.qe650, 0.9498759672667546, 1e-9, "QE 650");
  assertRel(s.impliedQe, 0.8265613228880018, 1e-9, "implied QE");
});

test("spectralResponseSummary: slab absorber (L = 0)", () => {
  const s = spectralResponseSummary({ W: 5e-6, L: 0, reflectance: 0.1, measuredResponsivity: 0.45, measuredWavelength: 800e-9 });
  assertRel(s.peakResponsivity, 0.3848202283947166, 1e-9, "peak");
  assert.equal(s.peakWavelengthNm, 570);
  assertRel(s.halfShortNm, 265.06459754666656, 1e-9, "half short");
  assertRel(s.halfLongNm, 807.0793206983499, 1e-9, "half long");
  assertRel(s.impliedQe, 0.6974111161867515, 1e-9, "implied QE");
});

test("crossing: linear interpolation and no crossing", () => {
  // y falls 4 → 0 over x = 0..4; level 1 is crossed at x = 3.
  assert.equal(crossing([0, 1, 2, 3, 4], [4, 3, 2, 1, 0], 0, 1, 1.5), 2.5);
  assert.ok(Number.isNaN(crossing([0, 1, 2], [3, 3, 3], 0, 1, 1)));
});
